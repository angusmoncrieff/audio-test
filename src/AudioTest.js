import { BaseMetronome } from './audio/Metronome';
import * as Soundfont from 'soundfont-player';
import { initAudio } from './audio/Audio';
import { NotePlayer } from './audio/NotePlayer';
import { useState, useEffect } from 'react';

let player;

const setupAudio = () => {
    const audio = initAudio();
    const dispatchSetPlayingScaleId = () => { };
    player = new NotePlayer(audio, dispatchSetPlayingScaleId);
}

setupAudio();

const AudioTest = ({ console }) => {

    const instrument = {
        transpositionSounding: 0,
    };

    const note = {
        midi: 60,
    }

    const noteIndex = 0;
    const setSoundingHalos = () => { };


    const [m] = useState(new BaseMetronome());

    useEffect(
        () => {
            m.start();
        }
        , [m]
    );

    const [webAudioCtx] = useState(new (window.AudioContext || window.webkitAudioContext)());

    // const webAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const tick = webAudioCtx.createOscillator();
    const tickVolume = webAudioCtx.createGain();

    tick.type = 'sine';
    tick.frequency.value = 440;
    tickVolume.gain.value = 0;

    tick.connect(tickVolume);
    tickVolume.connect(webAudioCtx.destination);
    tick.start(0);  // No offset, start immediately.

    function click() {
        console.log(`- click() called @ ${webAudioCtx.currentTime} status ${webAudioCtx.state}`)
        if (webAudioCtx.state !== 'runnig') {
            webAudioCtx.resume();
        }
        const time = webAudioCtx.currentTime;

        // Silence the click.
        tickVolume.gain.cancelScheduledValues(time);
        tickVolume.gain.setValueAtTime(0, time);

        // Audible click sound.
        tickVolume.gain.linearRampToValueAtTime(1, time + .001);
        tickVolume.gain.linearRampToValueAtTime(0, time + .001 + .01);

        console.log(`- click() finished @ ${webAudioCtx.currentTime}`)
    }


    return (
        <div className='buttons-container'>
            <button
                onClick={() => {
                    // setupAudio();
                    console.log('click 1');
                    player.playSingleNote(note, noteIndex, instrument, setSoundingHalos)
                }}
            >
                my NotePlayer
            </button>
            <button
                onClick={() => {
                    console.log('click 2');
                    const ac = new (window.AudioContext || window.webkitAudioContext)();
                    ac.resume().then(() => {
                        console.log('- calling Soundfont.instrument..')
                        Soundfont.instrument(ac, 'flute').then(function (flute) {
                            console.log('- asking soundfont flute to play..')
                            flute.play('Ab5')
                        })
                    })
                }}
            >
                soundfont-player
            </button>
            <button
                onClick={() => {
                    m.audioCtx.resume();
                    console.log(`click 3, m: ${m} ${m.audioCtx?.state}`);
                    // m.start();
                    m.click();
                }}
            >
                Web Audio (via metronome class)
            </button>

            <button
                onClick={() => {
                    console.log('click 4');
                    click();
                }}
            >
                Web Audio
            </button>


        </div>
    )
}

export default AudioTest;