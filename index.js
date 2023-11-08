const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const loop = document.querySelector('.loop');
const counter = document.querySelector('.counter');
const countdown = document.querySelector('.countdown');
const soundClips = document.querySelector('.sound-clips');
const canvas = document.querySelector('.visualizer');
const mainSection = document.querySelector('.main-controls');

const SECOND = 1000;

let interval = null;
function startRecordingAfter(ms_amount) {
  let cnt = ms_amount / SECOND;

  counter.style.display = 'block';
  counter.innerText = cnt;
  const audioClips = document.querySelectorAll('audio');
  audioClips.forEach(a => { a.pause; a.currentTime = 0; });
  if (cnt < 1) {
    counter.style.display = 'none';
    for (let i = 0; i < audioClips.length; i++) {
      audioClips[i].play();
    }
    return record.click();
  }
  interval = setInterval(() => {
    if (cnt > 1) {
      cnt--;
      counter.innerText = cnt;
    } else {
      clearInterval(interval);
      counter.style.display = 'none';
      for (let i = 0; i < audioClips.length; i++) {
        audioClips[i].play();
      }
      record.click();
    }
  }, SECOND)
}

window.addEventListener('keydown', (ke) => {
  switch (ke.code) {
    case 'Space':
      if (record.style.background === "red") {
        stop.click();
      } else {
        startRecordingAfter(countdown.checked * 3 * SECOND);
      }
      break;
  }
})

stop.disabled = true;

let audioCtx;
const canvasCtx = canvas.getContext("2d");

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function (stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function () {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function () {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";

      stop.disabled = true;
      record.disabled = false;
    }

    loop.onclick = function () {
      loop.style.background = loop.style.background === 'green' ? '' : 'green';
      stop.disabled = true;
      record.disabled = false;
    }
    mediaRecorder.onstop = function (e) {
      console.log("data available after MediaRecorder.stop() called.");

      const clipName = prompt('Enter a name for your sound clip?', 'My unnamed clip');

      const clipContainer = document.createElement('article');
      const clipLabel = document.createElement('p');
      const audio = document.createElement('audio');
      const deleteButton = document.createElement('button');

      clipContainer.classList.add('clip');
      audio.setAttribute('controls', '');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';

      if (clipName === null) {
        clipLabel.textContent = 'Unnamed clip';
      } else {
        clipLabel.textContent = clipName;
      }

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      audio.onpause = () => {
        loop.style.background === 'green' ? audio.play() : '';
      }
      const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");

      deleteButton.onclick = function (e) {
        e.target.closest(".clip").remove();
      }

      clipLabel.onclick = function () {
        const existingName = clipLabel.textContent;
        const newClipName = prompt('Enter a new name for your sound clip?');
        if (newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      }
    }

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    }
  }

  let onError = function (err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
  console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  draw()

  function draw() {
    const WIDTH = canvas.width
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;


    for (let i = 0; i < bufferLength; i++) {

      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

  }
}

window.onresize = function () {
  canvas.width = mainSection.offsetWidth;
}

window.onresize();