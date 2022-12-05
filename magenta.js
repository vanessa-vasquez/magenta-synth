import { selectedNotes, frequencyHistory } from "./styling.js";

let numOfPartials = 1;
let randomnessFactor = 15;
let inputData = {
  notes: [],
  totalTime: 0,
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playAdditiveSynthesis = (freq, startTime, endTime, note) => {
  if (note) {
    freq = midiToFreq(note.pitch);
    startTime = note.startTime;
    endTime = note.endTime;
  }

  let offset = frequencyHistory.length;
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
  gainNode.gain.value = 0;
  gainNode.gain.setTargetAtTime(0.8, startTime + offset, 0.01);
  gainNode.gain.setTargetAtTime(0, endTime + offset - 0.05, 0.01);

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

  return oscillators;
};

const midiToFreq = (m) => {
  return Math.pow(2, (m - 69) / 12) * 440;
};

const freqToMidi = (f) => {
  return (12 * Math.log(f / 400)) / Math.log(2) + 69;
};

function playNotes(noteList) {
  noteList = mm.sequences.unquantizeSequence(noteList);
  console.log(noteList.notes);
  noteList.notes.forEach((note) => {
    playAdditiveSynthesis(null, null, null, note);
  });
}

function genNotes() {
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
  music_rnn
    .continueSequence(qns, rnn_steps, rnn_temperature)
    .then((sample) => playNotes(mm.sequences.concatenate([qns, sample])));
}

const createQuantizedInputData = () => {
  inputData["notes"] = [];

  let startTime = 0.0;
  let endTime = 0.5;

  selectedNotes.forEach((noteIdx) => {
    let classList = $(`.${noteIdx}`).attr("class").split(/\s+/);
    let freq;

    for (let i = 0; i < classList.length; i++) {
      let currClass = classList[i];
      if (currClass.includes("freq")) {
        freq = currClass.split("-")[1];
        break;
      }
    }
    const notesList = inputData["notes"];
    const quantizedStep = {
      pitch: freqToMidi(freq),
      startTime: startTime,
      endTime: endTime,
    };
    notesList.push(quantizedStep);
    startTime += 0.5;
    endTime += 0.5;
  });

  inputData["totalTime"] = inputData["notes"].length * 0.5;
  console.log("inputData", inputData["notes"]);
};

const handleBtnClick = () => {
  $(".play-btn").click(() => {
    let startTime = 0.0;
    let endTime = 0.5;
    frequencyHistory.forEach((freq) => {
      playAdditiveSynthesis(freq, startTime, endTime, null);
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
