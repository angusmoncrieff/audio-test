import './App.css';
import './styles.css';
import AudioTest from './AudioTest';

(function () {

  function replaceLog(logToReplace, className) {
    var oldLog = logToReplace;

    const newLog = function (message) {

      var content = document.createTextNode(message);
      const newLine = document.createElement('div');
      newLine.appendChild(content);
      newLine.classList.add(className);

      var div = document.getElementById('log-box');
      if (div) {
        div.appendChild(newLine);
      };
      oldLog.apply(console, arguments);
    };

    if (className === 'msg-log') console.log = newLog;
    if (className === 'msg-warn') console.warn = newLog;
    if (className === 'msg-error') console.error = newLog;

  }

  replaceLog(console.log, 'msg-log');
  replaceLog(console.warn, 'msg-warn');
  replaceLog(console.error, 'msg-error');

})();


function App() {

  return (
    <div>
      <div id='log-box' />
      <div className="App">
        <AudioTest
          console={console}
        />
      </div>
    </div>
  );
}

export default App;
