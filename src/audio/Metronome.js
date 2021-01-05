// import { freqFromMidi } from './Audio';


/* 
 * Base metronome, with no timing. 
 * More like a "click on command" class. 
 */
class BaseMetronome {
    constructor(tempo = 60) {
        console.log('- BaseMetronome constructor() ');
        this.tempo = tempo;
        this.playing = false;

        this.audioCtx = null;
        this.tick = null;
        this.tickVolume = null;
        this.soundHz = 1000;
    }

    initAudio() {
        console.log('- BaseMetronome initAudio() ');
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.audioCtx.resume();

        console.log(`- this.audioCtx?.state: ${this.audioCtx?.state}`)
        this.tick = this.audioCtx.createOscillator();
        this.tickVolume = this.audioCtx.createGain();

        this.tick.type = 'sine';
        this.tick.frequency.value = this.soundHz;
        this.tickVolume.gain.value = 0;

        this.tick.connect(this.tickVolume);
        this.tickVolume.connect(this.audioCtx.destination);
        this.tick.start(0);  // No offset, start immediately.
    }

    click(callbackFn) {
        const time = this.audioCtx.currentTime;
        this.clickAtTime(time);

        if (callbackFn) {
            callbackFn(time);
        }
    }

    clickAtTime(time) {
        console.log(`- BaseMetronome clickAtTime() - state: ${this.audioCtx?.state} `);
        // Silence the click.
        this.tickVolume.gain.cancelScheduledValues(time);
        this.tickVolume.gain.setValueAtTime(0, time);

        // Audible click sound.
        this.tickVolume.gain.linearRampToValueAtTime(1, time + .001);
        this.tickVolume.gain.linearRampToValueAtTime(0, time + .001 + .01);
    }

    start(callbackFn) {
        this.playing = true;
        this.initAudio();
    }

    stop(callbackFn) {
        this.playing = false;
        this.tickVolume.gain.value = 0;
    }
}

/* 
 * Scheduling is done by prescheduling all the audio events, and
 * letting the WebAudio scheduler actually do the scheduling.
 */
class ScheduledMetronome extends BaseMetronome {
    constructor(tempo, ticks = 1000) {
        super(tempo);
        this.scheduledTicks = ticks;
    }

    start(callbackFn) {
        super.start();
        const timeoutDuration = (60 / this.tempo);

        let now = this.audioCtx.currentTime;

        // Schedule all the clicks ahead.
        for (let i = 0; i < this.scheduledTicks; i++) {
            this.clickAtTime(now);
            const x = now;
            setTimeout(() => callbackFn(x), now * 1000);
            now += timeoutDuration;
        }
    }
}

/* 
 * Scheduling is done by prescheduling all the audio events, and
 * letting the WebAudio scheduler actually do the scheduling.
 */
class ScheduledPlayer extends BaseMetronome {
    constructor(notes, tempo, instrument, ticks = 1000) {
        super(tempo);
        this.notes = notes;
        this.instrument = instrument;
        this.scheduledTicks = ticks;
    }

    noteAtTime(midi, time, duration) {
        // Silence the click.
        this.tickVolume.gain.cancelScheduledValues(time);
        this.tickVolume.gain.setValueAtTime(0, time);

        const attack = 0.008;
        // const sustain = 0.5;
        const release = 0.02;

        const hold = duration - release - 4 * attack;

        // this.tick.frequency.setValueAtTime(freqFromMidi(midi), time);

        // Audible click sound.
        this.tickVolume.gain.linearRampToValueAtTime(1, time + attack);
        console.log(midi, time + hold);
        this.tickVolume.gain.setValueAtTime(1, time + hold);
        this.tickVolume.gain.linearRampToValueAtTime(0, time + hold + release);
    }

    start() {
        super.start();
        const beatDurationSecs = 60 / this.tempo;

        let nextNoteTime = this.audioCtx.currentTime;

        const noteDurationsLookup = {
            "8": 8,
            q: 4
        }

        // Schedule all the clicks ahead.
        // for (let i = 0; i < this.notes.length; i++) {
        for (const note of this.notes) {
            const noteDurationSecs = beatDurationSecs * 4 / noteDurationsLookup[note.duration];
            this.noteAtTime(note.midi + this.instrument.transpositionSounding,
                nextNoteTime,
                noteDurationSecs);
            nextNoteTime += noteDurationSecs;
        }
    }

    stop() {
        this.tickVolume.gain.cancelScheduledValues(this.audioCtx.currentTime + 0.2);
        this.tickVolume.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.2);
        this.playing = false;

    }

}

export { BaseMetronome, ScheduledMetronome, ScheduledPlayer };