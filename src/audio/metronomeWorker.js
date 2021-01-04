// This worker provides the timing service for scales being played and for the metronome.
// From https://github.com/cwilso/metronome

const worker = () => {

	let timerID = null;
	let interval = 100;

	onmessage = function (e) {
		if (e.data === "start") {
			timerID = setInterval(function () { postMessage("tick"); }, interval)
			console.log("started - timerID, interval: ", timerID, interval);
		}
		else if (e.data.interval) {
			interval = e.data.interval;
			console.log("setting interval - timerID, new interval: ", timerID, interval);
			if (timerID) {
				clearInterval(timerID);
				timerID = setInterval(function () { postMessage("tick"); }, interval)
			}
			console.log("set interval - new timerID, new interval: ", timerID, interval);
		}
		else if (e.data === "stop") {
			// console.log("stopping - timerID: ", timerID);
			clearInterval(timerID);
			timerID = null;
		}
	};

	postMessage('hi there');

}



// Following hacked from react metronome - cos there's an issue using web workers with create-react-app
let code = worker.toString()
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'))

const blob = new Blob([code], { type: 'application/javascript' })
const workerScript = URL.createObjectURL(blob)

export default workerScript
