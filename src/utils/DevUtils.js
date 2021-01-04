import { useRef, useEffect } from 'react';

export function useTraceUpdate(props) {
    const prev = useRef(props);
    useEffect(() => {
        const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
            if (prev.current[k] !== v) {
                ps[k] = [prev.current[k], v];
            }
            return ps;
        }, {});
        if (Object.keys(changedProps).length > 0) {
            console.log('Changed props:', changedProps);
        }
        prev.current = props;
    });
}


export function logArrayElements({ arr, callback, prefix: prefixIn = '' }) {
    const prefix = prefixIn ? prefixIn + ': ' : '';
    console.log(`${prefix}elements (${arr.length}):`);
    arr.forEach(item => { console.log(`${prefix}${callback(item)}`) });
    console.log(`${prefix}----------------`);
}


// export const color =
//     Object.fromEntries(
//         ['red', 'aqua', 'aquamarine']
//             .map(color => { return [color, (text) => ([`%c${text}`, `color: ${color};`])] })  // key (= colorname), value (= function)
//     );

export function color(color, text) {
    return [`%c${text}`, `color: ${color};`];
}

// cf https://stackoverflow.com/questions/9559725/extending-console-log-without-affecting-log-line
// but I'm not sure how to work it exactly..?
// export const log = function (color, ...args) {
//     console.log(args)
//     return Function.prototype.bind.call(console.log, console, '%c', 'color: red;');
// }();


// log('hello')