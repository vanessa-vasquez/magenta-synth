import { isLFOActive, activeSynthTechnique } from "./styling.js";

import {
  numOfPartials,
  randomnessFactor,
  k,
  lfoFreq,
  modFreq,
  modIndex,
} from "./synth_options.js";

const keyboardFrequencyMap = {
  81: 523.251130601197269, //Q - C
  87: 587.32953583481512, //W - D
  69: 659.255113825739859, //E - E
  82: 698.456462866007768, //R - F
  84: 783.990871963498588, //T - G
};

const DEG = Math.PI / 180;

let activeOscillators = {};
let gainNodes1 = {};
let gainNodes2 = {};
let FMModulatorFreq;
let FMModulatorIndex;

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
  FMModulatorFreq = audioCtx.createOscillator();

  FMModulatorIndex = audioCtx.createGain();
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

/*
 * Distortion curve source
 * https://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion
 */

const makeDistortionCurve = () => {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  curve.forEach((_, i) => {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * DEG) / (Math.PI + k * Math.abs(x));
  });
  return curve;
};

const runWaveshaper = (key) => {
  const osc = audioCtx.createOscillator();
  const waveshaper = audioCtx.createWaveShaper();
  waveshaper.curve = makeDistortionCurve();

  osc.frequency.value = keyboardFrequencyMap[key];

  const globalGain = audioCtx.createGain();

  globalGain.gain.value = 0;
  globalGain.gain.setValueAtTime(0.5, audioCtx.currentTime);

  if (isLFOActive) {
    runLFO(osc);
  }

  osc.connect(waveshaper).connect(globalGain).connect(audioCtx.destination);

  activeOscillators[key] = osc;
  gainNodes1[key] = globalGain;

  applyEnvelope(globalGain);

  osc.start();
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
      } else if (activeSynthTechnique === "fm-btn") {
        runFMMode(key);
      } else {
        runWaveshaper(key);
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

export { keyboardFrequencyMap, makeDistortionCurve };
