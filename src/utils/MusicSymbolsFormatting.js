import React from 'react';

const typeableLookup = {
    'b': { unicode: '\u266D', className: 'flat-sign' },
    '#': { unicode: '\u266F', className: 'sharp-sign' },
    'n': { unicode: '\u266E', className: 'natural-sign' },
    '##': { unicode: '\uD834\uDD2A', className: 'double-sharp' },
    'bb': { unicode: '\uD834\uDD2B', className: 'double-flat' },
}

const symbolLookup = {
    '♭': { typeable: 'b', className: 'flat-sign' },
    '♯': { typeable: '#', className: 'sharp-sign' },
    '♮': { typeable: 'n', className: 'natural-sign' },
    '𝄪': { typeable: '##', className: 'double-sharp' },
    '𝄫': { typeable: 'bb', className: 'double-flat' },
}

export const pitchClassDisplayString = (pitchClass) => {
    const alterationDisplay = typeableLookup[pitchClass.substr(1)];
    if (typeof alterationDisplay === 'undefined') return pitchClass;  // Not in lookup, just return

    return pitchClass[0] + alterationDisplay.unicode;
}

export const pitchClassJSX = (pitchClass) => {
    const alterationDisplay = typeableLookup[pitchClass.substr(1)];
    if (typeof alterationDisplay === 'undefined') return pitchClass;  // Not in lookup, just return

    return (
        <div style={{ display: 'inline-block' }}>
            {pitchClass[0]}
            <div className={`music-symbol accidental ${alterationDisplay.className}`}>
                {alterationDisplay.unicode}
            </div>
        </div>
    )
}

export const trebleClefJSX = (
    <div className="music-symbol treble-clef">
        𝄞
    </div>
)
export const bassClefJSX = (
    <div className="music-symbol bass-clef">
        𝄢
    </div>
)


export const formatAccidentalsJSX = (str) => {
    // Returns JSX of string with all accidental symbols given correct classNames.
    // Now works for double sharps and flats, and for multiple accidentals.

    /*
    Handy for copy/paste:
♭
♯
♮
𝄪
𝄫
♭♯♮𝄪𝄫
    */

    if (typeof str === 'number') return formatAccidentalsJSX(str.toString());
    if (typeof str !== 'string') return str;

    const chunks = str.split(/(♭|♯|♮|𝄪|𝄫)/g);

    return (
        <div style={{ display: 'inline-block' }}>
            {chunks.map((chunk, i) => {
                const symbol = symbolLookup[chunk];
                return (
                    typeof symbol === 'undefined' ?
                        chunk
                        : <span
                            key={i}
                            className={`music-symbol accidental ${symbol.className}`}
                        >
                            {chunk}
                        </span>
                );
            })}
        </div >
    )
}


export const Sharp = () => (formatAccidentalsJSX('♯'));
export const Flat = () => (formatAccidentalsJSX('♭'));
export const Natural = () => (formatAccidentalsJSX('♮'));

export const convertFlatSharpNaturalToTypeable = (str) => {
    return str.replace(/♭/g, 'b')
        .replace(/♯/g, '#')
        .replace(/♮/g, 'n')
        .replace(/𝄪/g, '##')
        .replace(/𝄫/g, 'bb');
}