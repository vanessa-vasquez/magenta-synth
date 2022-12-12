import { activeSynthTechnique, isLFOActive } from "./styling.js";

import {
  numOfPartials,
  randomnessFactor,
  lfoFreq,
  modFreq,
  modIndex,
} from "./synth_options.js";

let inputData = {
  notes: [],
  totalTime: 0,
};

let audioCtx;
let FMModulatorFreq;
let FMModulatorIndex;

const updateHistory = (newNotes) => {
  window.frequencyHistory.splice(
    window.selectedNotes[0],
    window.selectedNotes.length
  );

  let startIdx = window.selectedNotes[0];

  let numNotesToAdd = window.selectedNotes.length;

  if (newNotes.length < window.selectedNotes.length) {
    amountToAdd = newNotes.length;
  }

  for (let i = 0; i < numNotesToAdd; i++) {
    window.frequencyHistory.splice(startIdx, 0, midiToFreq(newNotes[i].pitch));
    startIdx++;
  }

  window.selectedNotes = [];

  $(".info-status").text("success! ready to play now");
};

const runLFO = (audioCtx, osc) => {
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = lfoFreq;
  let lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain).connect(osc.frequency);
  lfo.start();
};

const playAdditiveSynthesis = (freq, startTime, endTime) => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

  if (isLFOActive) {
    runLFO(audioCtx, oscillators[0]);
  }

  oscillators.forEach((currentOsc) => {
    currentOsc.start();
  });

  gainNode.gain.value = 0;
  gainNode.gain.setTargetAtTime(0.3, startTime, 0.01);
  gainNode.gain.setTargetAtTime(0, endTime - 0.05, 0.01);

  return oscillators;
};

const playAMMode = (freq, startTime, endTime) => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const carrier = audioCtx.createOscillator();
  const modulatorFreq = audioCtx.createOscillator();
  const globalGain = audioCtx.createGain();
  globalGain.gain.value = 0;

  modulatorFreq.frequency.value = 100;

  globalGain.gain.setTargetAtTime(0.8, startTime, 0.01);

  carrier.frequency.setTargetAtTime(freq, startTime, 0.001);

  globalGain.gain.setTargetAtTime(0, endTime - 0.05, 0.01);

  const modulated = audioCtx.createGain();
  const depth = audioCtx.createGain();

  depth.gain.value = 0.5;
  modulated.gain.value = 1.0 - depth.gain.value;

  modulatorFreq.connect(depth).connect(modulated.gain);
  carrier.connect(modulated);
  modulated.connect(globalGain).connect(audioCtx.destination);

  if (isLFOActive) {
    runLFO(audioCtx, modulatorFreq);
  }

  carrier.start();
  modulatorFreq.start();
};

const playFMMode = (freq, startTime, endTime) => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const carrier = audioCtx.createOscillator();
  FMModulatorFreq = audioCtx.createOscillator();

  FMModulatorIndex = audioCtx.createGain();
  const globalGain = audioCtx.createGain();
  globalGain.gain.value = 0;

  FMModulatorIndex.gain.value = modIndex;
  FMModulatorFreq.frequency.value = modFreq;

  globalGain.gain.setTargetAtTime(0.8, startTime, 0.01);
  carrier.frequency.setTargetAtTime(freq, startTime, 0.001);

  globalGain.gain.setTargetAtTime(0, endTime - 0.05, 0.01);

  FMModulatorFreq.connect(FMModulatorIndex);
  FMModulatorIndex.connect(carrier.frequency);

  carrier.connect(globalGain).connect(audioCtx.destination);

  if (isLFOActive) {
    runLFO(audioCtx, FMModulatorFreq);
  }

  carrier.start();
  FMModulatorFreq.start();
};

const midiToFreq = (m) => {
  return Math.pow(2, (m - 69) / 12) * 440;
};

const freqToMidi = (f) => {
  return (12 * Math.log(f / 400)) / Math.log(2) + 69;
};

const genNotes = async () => {
  $(".info-status").text("magentifying...");
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

  let startIdx = window.selectedNotes[0];

  for (let i = 0; i <= startIdx; i++) {
    let freq = window.frequencyHistory[i];

    let notesList = inputData["notes"];

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
};

const handleBtnClick = () => {
  $(".play-btn").click(() => {
    if (window.frequencyHistory.length > 0) {
      $(".info-status").text("playing...");
      let startTime = 0.0;
      let endTime = 0.5;
      window.frequencyHistory.forEach((freq, i) => {
        if (activeSynthTechnique === "additive-btn") {
          playAdditiveSynthesis(freq, startTime, endTime);
        } else if (activeSynthTechnique === "am-btn") {
          playAMMode(freq, startTime, endTime);
        } else {
          playFMMode(freq, startTime, endTime);
        }
        startTime += 0.5;
        endTime += 0.5;
      });
    }
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
