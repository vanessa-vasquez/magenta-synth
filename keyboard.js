import {
  isLFOActive,
  lfoFreq,
  activeSynthTechnique,
  keyboardFrequencyMap,
} from "./styling.js";

let activeOscillators = {};
let gainNodes1 = {};
let gainNodes2 = {};
let numOfPartials = 1;
let randomnessFactor = 15;
let modFreq = 100;
let modIndex = 100;

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const applyEnvelope = (gainNode) => {
  const gainNodesCount = Object.keys(gainNodes1).length;

  // Attack
  Object.keys(gainNodes1).forEach(() => {
    gainNode.gain.linearRampToValueAtTime(
      0.3 / gainNodesCount,
      audioCtx.currentTime + 0.1
    );
  });

  //Decay
  gainNode.gain.exponentialRampToValueAtTime(
    0.2 / gainNodesCount,
    audioCtx.currentTime + 0.2
  );
};

const runAdditiveSynthesisMode = (key) => {
  let oscillators = [];

  let freqMultiplier = 2;
  let isSubtraction = false;
  for (let i = 0; i < numOfPartials; i++) {
    let newOsc = audioCtx.createOscillator();
    oscillators.push(newOsc);
    if (isSubtraction) {
      newOsc.frequency.value =
        keyboardFrequencyMap[key] * freqMultiplier -
        Math.random() * randomnessFactor;
    } else {
      newOsc.frequency.value =
        keyboardFrequencyMap[key] * freqMultiplier +
        Math.random() * randomnessFactor;
    }
    isSubtraction = !isSubtraction;
    freqMultiplier++;
  }

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

  oscillators.forEach((currentOsc) => {
    currentOsc.connect(gainNode);
  });

  gainNode.connect(audioCtx.destination);

  activeOscillators[key] = oscillators[0];
  gainNodes1[key] = gainNode;

  if (isLFOActive) {
    runLFO(oscillators[0]);
  }

  applyEnvelope(gainNode);

  oscillators.forEach((currentOsc) => {
    currentOsc.start();
  });

  return oscillators;
};

const runAMMode = (key) => {
  const carrier = audioCtx.createOscillator();
  const modulatorFreq = audioCtx.createOscillator();
  modulatorFreq.frequency.value = 100;
  carrier.frequency.value = keyboardFrequencyMap[key];

  const modulated = audioCtx.createGain();
  const depth = audioCtx.createGain();
  const globalGain = audioCtx.createGain();

  globalGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  depth.gain.value = 0.5;
  modulated.gain.value = 1.0 - depth.gain.value;

  modulatorFreq.connect(depth).connect(modulated.gain);
  carrier.connect(modulated);
  modulated.connect(globalGain).connect(audioCtx.destination);

  activeOscillators[key] = carrier;
  gainNodes1[key] = depth;
  gainNodes2[key] = modulated;

  if (isLFOActive) {
    runLFO(modulatorFreq);
  }

  applyEnvelope(globalGain);

  carrier.start();
  modulatorFreq.start();
};

const runFMMode = (key) => {
  const carrier = audioCtx.createOscillator();
  const FMModulatorFreq = audioCtx.createOscillator();

  const FMModulatorIndex = audioCtx.createGain();

  const globalGain = audioCtx.createGain();

  FMModulatorIndex.gain.value = modIndex;
  FMModulatorFreq.frequency.value = modFreq;

  globalGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  carrier.frequency.value = keyboardFrequencyMap[key];
  FMModulatorFreq.connect(FMModulatorIndex);
  FMModulatorIndex.connect(carrier.frequency);

  carrier.connect(globalGain).connect(audioCtx.destination);

  activeOscillators[key] = carrier;
  gainNodes1[key] = globalGain;

  if (isLFOActive) {
    runLFO(FMModulatorFreq);
  }
  applyEnvelope(globalGain);

  carrier.start();
  FMModulatorFreq.start();
};

const runLFO = (osc) => {
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = lfoFreq;
  let lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain).connect(osc.frequency);
  lfo.start();
};

const handleKeyPress = () => {
  $(window).keydown((event) => {
    const key = (event.detail || event.which).toString();

    if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
      if (activeSynthTechnique === "additive-btn") {
        runAdditiveSynthesisMode(key);
      } else if (activeSynthTechnique === "am-btn") {
        runAMMode(key);
      } else {
        runFMMode(key);
      }
    }
  });

  $(window).keyup((event) => {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && activeOscillators[key]) {
      let currentGainLevel = gainNodes1[key].gain.value;

      // Release
      gainNodes1[key].gain.setValueAtTime(
        currentGainLevel,
        audioCtx.currentTime
      );

      gainNodes1[key].gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + 1.5
      );

      gainNodes1[key].gain.setValueAtTime(0, audioCtx.currentTime + 1.6);

      if (activeSynthTechnique === "am-btn") {
        gainNodes2[key].gain.setValueAtTime(
          currentGainLevel,
          audioCtx.currentTime
        );

        gainNodes2[key].gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 1
        );

        delete gainNodes2[key];
      }

      activeOscillators[key].stop(audioCtx.currentTime + 1.6);

      delete activeOscillators[key];
      delete gainNodes1[key];
    }
  });
};

$(document).ready(() => {
  handleKeyPress();
});
