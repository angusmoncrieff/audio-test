// Based on https://github.com/cwilso/metronome

import { castArray } from "lodash";
import { scaleValueBetweenTwoPoints } from '../utils/miscUtils';


const NOTE_GAIN_DEFAULT = 0.5,
    NOTE_GAIN_NEW_BEAM = 1,
    NOTE_GAIN_SWING_OFFBEAT = 1,
    NOTE_GAP_SWING_ONBEAT = 0.05,
    DURATION_LAST_NOTE = 2.7;

// Adjust swing as tempo gets higher
// 0.5 = no swing
// These values go from 0.6 @ 60bpm to 0.55 @ 300bpm
const adjustSwing = tempo => scaleValueBetweenTwoPoints(60, 0.6, 300, 0.55, tempo);
// Adjust onbeat de-emphasis - more contrast for higher tempo
// I.e. 0.8 gain @ 60bpm, 0.14 gain @ 250bpm
const adjustOnbeatGain = tempo => scaleValueBetweenTwoPoints(60, 0.8, 250, 0.14, tempo);


const lookAhead = 25.0;    // How frequently worker should call scheduling function (ms)
const scheduleAheadInSecs = 0.1;    // How far ahead to schedule notes (sec)
const firstNoteDelay = 0.04;        // Avoid first note lateness (1st/2nd bunching)

var audioUnlocked = false;  // ???πππ to top level state -->> TO REDUX SESSION STORE!



// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();


class NotePlayer {
    constructor(audio, setPlayingScaleId) {
        // super();
        this.isPlayingScale = false;
        this.notes = [];
        this.notesInQueue = [];      // the notes that have been put into the web audio,
        // and may or may not have played yet. {note, time}
        this.lastNoteDrawn = -1;     // the last halo 'drawn' (i.e. 'halos' state updated)
        this.haloTimeouts = [];

        this.audio = audio;
        audio.then(audio => {
            this.audioContext = audio.audioContext;
            this.patch = audio.patch;
            this.timerWorker = audio.metronomeWorker;
            setPlayingScaleId(null);  // say we're ready (cos initially it's 'LOADING_AUDIO')
        });

        this.setPlayingScaleId = setPlayingScaleId;

        this.draw = this.draw.bind(this);

    }


    playSingleNote(note, noteIndex, instrument, setSoundingHalos) {

        console.log(`- NotePlayer.playSingleNote() called.., state: ${this.audioContext?.state}`)
        this.instrument = instrument;
        this.setHalos = setSoundingHalos;

        if (this.isPlayingScale) { return }  // don't allow note clicking while scale playing

        this.audio.then(() => {  // don't try to play until audio is all loaded
            const
                midiConcert = note.midi + this.instrument.transpositionSounding,
                durationInSecs = 2;

            const startTime = this.audioContext.currentTime;

            this.patch.play(midiConcert, startTime, { duration: durationInSecs })

            // set the note halo:
            this.setHalo(noteIndex, durationInSecs);
        })

        console.log('- NotePlayer.playSingleNote() done')

    }


    setHalo(noteIndex, durationInSecs) {

        this.clearHalo(noteIndex);

        // 'note on' - set the halo
        this.setHalos(prevHalos => ([...prevHalos,
        {
            noteIndex,
            durationInSecs,
            className: 'sounding',
        }]
        ));

        // 'note off' - schedule the clear halo
        const clearHaloTimeoutId = setTimeout(
            () => this.clearHalo(noteIndex),
            durationInSecs * 1000);

        // Keep track of the timeout Ids
        this.haloTimeouts[noteIndex] = {
            clearHaloTimeoutId
        };
    }


    clearHalo(noteIndex) {
        this.setHalos(prevHalos => (
            prevHalos.filter(halo => halo.noteIndex !== noteIndex)
        ));

        if (this.haloTimeouts[noteIndex]) {
            // clearTimeout(this.haloTimeouts[noteIndex].setHaloTimeoutId);
            clearTimeout(this.haloTimeouts[noteIndex].clearHaloTimeoutId);
            this.haloTimeouts[noteIndex] = null;
        }
    }



    scheduler() {
        // while there are notes that will need to play before the next interval, schedule them and advance the pointer.

        if (this.currentNotePointer === 0 && !this.nextNoteTime) {
            this.nextNoteTime = this.audioContext.currentTime + firstNoteDelay;
        }

        while (this.nextNoteTime < this.audioContext.currentTime + scheduleAheadInSecs) {

            const simultaneousNotes = this.notes[this.currentNotePointer];

            // if (this.currentNotePointer > 2) {
            //     const x = this.currentNotePointer.doesntExist.error;  // ???362 deliberate error for rollbar test
            //     console.log(x);
            // }

            if (typeof simultaneousNotes === 'undefined') {  // no more notes, we are done playing
                this.stop()
                break;
            }

            else {

                simultaneousNotes.forEach(note => {
                    this.notesInQueue.push({ note, time: this.nextNoteTime });

                    const beatDurationInSecs = 60 / window.tempo;
                    note.durationInSecs = (4 / note.durationSanitized * beatDurationInSecs)
                        * (note.endNote ? DURATION_LAST_NOTE : 1)      // Feels musical to hold the last note a little longer
                        ;

                    note.gapInSecs = 0;

                    if (this.swing) {
                        const swingAdjusted = adjustSwing(window.tempo);
                        const onbeatGainAdjusted = adjustOnbeatGain(window.tempo);

                        if (note.onBeatQuaver) {
                            note.durationInSecs *= swingAdjusted * 2  // lengthen onbeat quavers
                                * (1 - NOTE_GAP_SWING_ONBEAT)         // and have a gap at end
                                ;
                            note.gapInSecs = note.durationInSecs * NOTE_GAP_SWING_ONBEAT;

                            note.gain =
                                note.firstNote ? (NOTE_GAIN_SWING_OFFBEAT + onbeatGainAdjusted) / 2  // 1st should be clearly sounded despite being on beat
                                    : onbeatGainAdjusted;
                        }
                        else if (note.offBeatQuaver) {
                            note.durationInSecs *= (1 - swingAdjusted) * 2    // shorten offbeats
                            note.gain = NOTE_GAIN_SWING_OFFBEAT;
                        }
                        else if (note.endNote) {
                            note.gain = (NOTE_GAIN_SWING_OFFBEAT + onbeatGainAdjusted) / 2;    // don't de-emphasize last note too much
                        }
                    }
                    else {                                                                   // no swing..
                        note.gain = note.newBeam ? NOTE_GAIN_NEW_BEAM : NOTE_GAIN_DEFAULT;   // ..emphasize 1st of each beam
                    }

                    this.patch.play(note.midiConcert, this.nextNoteTime, { duration: note.durationInSecs, gain: note.gain })
                });

                this.nextNoteTime += simultaneousNotes[0].durationInSecs + simultaneousNotes[0].gapInSecs;    // Add beat length to last beat time
                this.currentNotePointer++;
            }
        }

    }

    playScale(scaleId, scale, scaleStaff2, instrument, setSoundingHalos, swing) {

        this.scaleId = scaleId;
        this.instrument = instrument;
        this.setHalos = setSoundingHalos;
        this.swing = swing;
        this.init();

        if (!audioUnlocked) {
            // play silent buffer to unlock the audio
            console.log(`1 unlocking audio - audioContext.state: ${this.audioContext.state}`)
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const node = this.audioContext.createBufferSource();
            node.buffer = buffer;
            node.start(0);
            console.log(`2 unlocking audio - audioContext.state: ${this.audioContext.state}`)
            audioUnlocked = true;
        }

        const notesFirstInBeamGroup = scale.beamGroups.map(beamGroup => {
            const beamGroupArr = castArray(beamGroup);
            return beamGroupArr[0];
        });

        // ??? is noteIndex necessary? Maybe nicer to leave them present, but set a dontPlay flag..?
        this.notes = scale.notes
            .map((note, noteIndex) => ({ note, noteIndex }))
            .filter(({ noteIndex }) => (!scale.disabledNotes.includes(noteIndex)))  // don't play disabled notes
            .map(({ note, noteIndex }, indexWithinPlayableNotes) => ({
                noteIndex,
                midiConcert: note.midi + this.instrument.transpositionSounding,
                durationSanitized: note.durationSanitized,
                newBeam: notesFirstInBeamGroup.includes(note),
                onBeatQuaver: note.durationSanitized === '8' && indexWithinPlayableNotes % 2 === 0,
                offBeatQuaver: note.durationSanitized === '8' && indexWithinPlayableNotes % 2 === 1,
                firstNote: indexWithinPlayableNotes === 0,
                endNote: noteIndex === scale.notes.length - 1,
            }))
            ;

        // If grand staff then put in the second staff notes (each elt of this.notes is to be an array containing simultaneous notes).
        // NB. this assumes the disabled notes in upper and lower staves correspond (which will probably fail with arpeggios of 
        // contrary motion scales...)
        this.notes = this.notes.map(n => {
            let simultaneousNotes = [n];
            const staff2Note = scaleStaff2?.notes[n.noteIndex];
            if (staff2Note) simultaneousNotes.push({
                ...n,
                midiConcert: staff2Note.midi + this.instrument.transpositionSounding,
            });
            return simultaneousNotes;
        });

        this.currentNotePointer = 0;
        this.timerWorker.postMessage("start");
    }


    draw() {
        let currentNote = this.lastNoteDrawn;
        const currentTime = this.audioContext.currentTime;
        const haloEarlyWindow = 0.05;

        while (this.notesInQueue.length && this.notesInQueue[0].time < currentTime + haloEarlyWindow) {
            currentNote = this.notesInQueue[0].note;
            this.notesInQueue.splice(0, 1);   // remove note from queue
        }

        const { noteIndex, durationInSecs } = currentNote;

        // We only need to draw if the note has moved.
        if (this.lastNoteDrawn.noteIndex !== noteIndex) {

            this.setHalo(noteIndex, durationInSecs);

            // // set the halo
            // this.setHalos(prevHalos => (
            //     [
            //         ...prevHalos,
            //         {
            //             // playId:
            //             noteIndex,
            //             durationInSecs,
            //             className: 'sounding',
            //         }
            //     ]
            // ));

            // // 'note off' - schedule the clear halo
            // const clearHaloTimeoutId = setTimeout(
            //     () => this.clearHalo(noteIndex),
            //     durationInSecs * 1000);

            // // Keep track of the timeout Ids
            // this.haloTimeouts[noteIndex] = {
            //     clearHaloTimeoutId
            // };

        }

        // set up to draw again (unless we finished playing scale)
        if (this.isPlayingScale) window.requestAnimFrame(this.draw);
    }



    init() {

        this.isPlayingScale = true;
        this.setHalos([]);
        this.setPlayingScaleId(this.scaleId);

        window.requestAnimFrame(() => this.draw());    // start the drawing loop.

        const messageHandler = ((e) => {
            if (e.data === "tick") {
                // console.log("tick!");
                this.scheduler();
            }
            else
                console.log("message: " + e.data);
        });

        this.timerWorker.onmessage = messageHandler;
        this.timerWorker.postMessage({ "interval": lookAhead });
    }


    stop() {
        this.setPlayingScaleId(null);
        this.isPlayingScale = false;
        this.currentNotePointer = null;
        this.nextNoteTime = null;
        if (this.timerWorker) this.timerWorker.postMessage("stop");
        this.notesInQueue = [];
        for (const haloTimeout of this.haloTimeouts) {
            if (haloTimeout) {
                // clearTimeout(haloTimeout.setHaloTimeoutId);
                clearTimeout(haloTimeout.clearHaloTimeoutId);
            }
        }
        this.haloTimeouts = [];
    }


}

export { NotePlayer };