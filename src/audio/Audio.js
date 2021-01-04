import * as Soundfont from 'soundfont-player';
import metronomeWorkerFn from '../audio/metronomeWorker';




export const initAudio = async (setAudio) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const patch = await Soundfont.instrument(audioContext, 'acoustic_grand_piano');
    const metronomeWorker = new Worker(metronomeWorkerFn);    // ??? need to tidy this away?


    return { audioContext, patch, metronomeWorker }
}

export const loadPatch = async (instrument, patchDefault, currentPatch, audioContext) => {
    let newPatch;
    if (patchDefault === 'EACH_INSTRUMENT') newPatch = instrument.patch;
    else newPatch = patchDefault;

    if (newPatch !== currentPatch) return await Soundfont.instrument(audioContext, newPatch);

    // oh maybe I need to build up a patch object as each patch is loaded, like
    /*
    
    patch = {
        trumpet: {...whatever comes back...},
        eb-cornet: {...}
    }

    ...or add to INSTRUMENTS?? that feels weird
    */
}

/*
Do I somehow subscribe to the store?
so that every time instrument changes or the default patch changes it calls the function to load patch?
That seems like the right way!

But I'm not sure that my audio object (comprising audio context, patch and metronome worker) should be
in state - patch is the only thing that changes. And even for that, perhaps only the patch name needs
to be in state...?
*/