import { useLayoutEffect } from 'react';

/**
 * A hook to listen for width changes or scroll-bar show/hide.
 *
 * Arguments:
 *  * containerRef - a React ref to the element whose width you want to measure.
 *  * onWidthChanged - a function that is invoked when the width changes.
 *
 * Based on https://gist.github.com/AdamMcCormick/d5f718d2e9569acdf7def25e8266bb2a
*/

// 20200528 AM:
// I've adapted to use the timeout thing, so it doesn't go crazy trying to rerender everything 100s of times when you resize.
// ??? why not use throttle or debounce?

const RESET_TIMEOUT = 333


export const useWidthDetector = (containerRef, setDimensions) => {
    useLayoutEffect(() => {          // useEffect makes zeros appear briefly on each ScaleCpt
        //                              ???perf oh! Not exactly - so is useLayoutEffect causing extra work/renders?

        const testDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,     // containerRef.current.clientWidth accounts for vertical scrollbar (i.e. it's less when scrollbar is visible)
                    // width: containerRef.current.clientWidth > 0 ? 800 : 0,  // hack test to see how much resizes slow things down
                    height: window.innerHeight
                });
                // console.log('window.innerWidth, <ScaleList> width:', window.innerWidth, containerRef.current.clientWidth);
            }
        }

        let movementTimer;

        // testDimensions();

        const handleResize = () => {
            clearTimeout(movementTimer);
            movementTimer = setTimeout(testDimensions, RESET_TIMEOUT);
            console.log('resize!');
        }

        if (containerRef.current) {
            const detector = document.createElement('iframe');
            Object.assign(detector.style, {
                height: 0,
                border: 0,
                width: '100%'
                // display: block // ??? put this in?  https://gist.github.com/curran/0e30c621fe4fc612bf7feb0938a68e4d#gistcomment-3367387
            });

            const container = containerRef.current;
            container.appendChild(detector);

            // Invoke here to capture initial width.
            testDimensions();

            // Detect when width changes hereafter.
            detector.contentWindow.addEventListener('resize', handleResize);
            // window.addEventListener("resize", handleResize);   // my original version

            // return tidy up function
            return () => {
                detector.contentWindow.removeEventListener('resize', handleResize);
                container.removeChild(detector);
                clearTimeout(movementTimer)
            };
        }
    }, [containerRef, setDimensions]);
};

