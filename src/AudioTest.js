import { BaseMetronome } from './audio/Metronome';
import * as Soundfont from 'soundfont-player';
import { initAudio } from './audio/Audio';
import { NotePlayer } from './audio/NotePlayer';

let player;

const setupAudio = () => {
    const audio = initAudio();
    const dispatchSetPlayingScaleId = () => { };
    player = new NotePlayer(audio, dispatchSetPlayingScaleId);
}

setupAudio();

const AudioTest = () => {

    const instrument = {
        transpositionSounding: 0,
    };

    const note = {
        midi: 60,
    }

    const noteIndex = 0;
    const setSoundingHalos = () => { };

    return (
        <div>
            <button
                onClick={() => {
                    // setupAudio();
                    player.playSingleNote(note, noteIndex, instrument, setSoundingHalos)
                }
                }
            >
                my NotePlayer
            </button>
            <button
                onClick={() => {
                    const ac = new (window.AudioContext || window.webkitAudioContext)();
                    Soundfont.instrument(ac, 'clavinet').then(function (clavinet) {
                        clavinet.play('C4')
                    })
                }
                }
            >
                soundfont-player
            </button>
            <button
                onClick={() => {
                    const m = new BaseMetronome();
                    m.start();
                    m.click();
                }
                }
            >
                Web Audio
            </button>


        </div>
    )
}

export default AudioTest;