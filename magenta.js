import { selectedNotes } from "./styling.js";

let numOfPartials = 1;
let randomnessFactor = 15;
let inputData = {
  notes: [],
  totalTime: 0,
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const updateHistory = (newNotes) => {
  window.frequencyHistory.splice(
    selectedNotes[0],
    selectedNotes[selectedNotes.length - 1] + 1
  );

  let endIdx = Number(selectedNotes[selectedNotes.length - 1]);

  for (let i = 0; i < newNotes.length; i++) {
    $(`.${endIdx}`).after(
      `<div class='magenta-note-signal ${
        window.frequencyHistory.length
      } freq-${midiToFreq(newNotes[i].pitch)}' style='top:${
        Math.random() * (100 - 20) + 20
      }px;left:${35 * window.frequencyHistory.length}px;'></div>`
    );

    window.frequencyHistory.splice(endIdx, 0, midiToFreq(newNotes[i].pitch));
  }
};

const playAdditiveSynthesis = (freq, startTime, endTime, offset) => {
  let oscillators = [];

  let freqMultiplier = 2;
  let isSubtraction = false;
  for (let i = 0; i < numOfPartials; i++) {
    let newOsc = audioCtx.createOscillator();
    oscillators.push(newOsc);
    if (isSubtraction) {
      newOsc.frequency.value =
        freq * freqMultiplier - Math.random() * randomnessFactor;
    } else {
      newOsc.frequency.value =
        freq * freqMultiplier + Math.random() * randomnessFactor;
    }
    isSubtraction = !isSubtraction;
    freqMultiplier++;
  }

  const gainNode = audioCtx.createGain();

  oscillators.forEach((currentOsc) => {
    currentOsc.connect(gainNode);
  });

  gainNode.connect(audioCtx.destination);

  // if (isLFOActive) {
  //   runLFO(oscillators[0]);
  // }

  oscillators.forEach((currentOsc) => {
    currentOsc.start();
  });

  gainNode.gain.value = 0;
  gainNode.gain.setTargetAtTime(0.8, startTime + offset, 0.01);
  gainNode.gain.setTargetAtTime(0, endTime + offset - 0.05, 0.01);

  return oscillators;
};

const midiToFreq = (m) => {
  return Math.pow(2, (m - 69) / 12) * 440;
};

const freqToMidi = (f) => {
  return (12 * Math.log(f / 400)) / Math.log(2) + 69;
};

const genNotes = async () => {
  //load a pre-trained RNN model
  const music_rnn = new mm.MusicRNN(
    "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn"
  );
  music_rnn.initialize();

  //the RNN model expects quantized sequences
  const qns = mm.sequences.quantizeNoteSequence(inputData, 4);

  //and has some parameters we can tune
  const rnn_steps = 40; //including the input sequence length, how many more quantized steps (this is diff than how many notes) to generate
  const rnn_temperature = 1.1; //the higher the temperature, the more random (and less like the input) your sequence will be

  // we continue the sequence, which will take some time (thus is run async)
  // "then" when the async continueSequence is done, we play the notes
  let response = await music_rnn.continueSequence(
    qns,
    rnn_steps,
    rnn_temperature
  );

  let sample = mm.sequences.unquantizeSequence(response);

  updateHistory(sample.notes);
};

const createQuantizedInputData = () => {
  inputData["notes"] = [];

  let startTime = 0.0;
  let endTime = 0.5;

  let startIdx = selectedNotes[0];

  for (let i = 0; i < startIdx; i++) {
    let freq = window.frequencyHistory[i];

    const notesList = inputData["notes"];

    const quantizedStep = {
      pitch: freqToMidi(freq),
      startTime: startTime,
      endTime: endTime,
    };

    notesList.push(quantizedStep);
    startTime += 0.5;
    endTime += 0.5;
  }

  inputData["totalTime"] = inputData["notes"].length * 0.5;
  console.log("inputData", inputData["notes"]);
};

const playNote = (freq, startTime, endTime) => {
  playAdditiveSynthesis(
    freq,
    startTime,
    endTime,
    window.frequencyHistory.length
  );
};

const visualize = (i) => {
  let delay = (i + 1) * 500;
  setTimeout(() => {
    $(`.${i - 1}`).removeClass("selected-note-signal");
    $(`.${i}`).addClass("selected-note-signal");
  }, delay);
};

const handleBtnClick = () => {
  $(".play-btn").click(() => {
    let startTime = 0.0;
    let endTime = 0.5;
    window.frequencyHistory.forEach((freq, i) => {
      playNote(freq, startTime, endTime);
      visualize(i);
      startTime += 0.5;
      endTime += 0.5;
    });
  });

  $(".magenta-btn").click(() => {
    genNotes();
  });

  $(document).on("click", ".note-signal", (event) => {
    let classList = $(event.target).attr("class").split(/\s+/);
    for (let i = 0; i < classList.length; i++) {
      let currClass = classList[i];
      if (currClass != "note-signal" && currClass != "selected-note-signal") {
        createQuantizedInputData();
        break;
      }
    }
  });
};

$(document).ready(() => {
  handleBtnClick();
});
