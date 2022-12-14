# magenta-synth
magenta-synth is a basic synthesizer built using JavaScript, the Web Audio API, and the Magenta API where users are able to create simple musical pieces and choose sections of these pieces to automatically compose using machine learning. It is a project which combines digital signal processing and automated composition.

## Reflections (Write up)
Throughout the following, I will describe my process creating this digital synthesizer. 

### Building the interface
My first step to this process was to build a basic user interface as I wanted to make it easy to feed in the correct inputs once I integrated the Web Audio/Magenta APIs.

Fleshing out my interface, I knew that I wanted to incorporate a few things: 
- The ability to choose between different synthesis options 
- The ability to edit different parts of a chosen synthesis technique 
- The ability to visualize and hear the notes as you play them
- The ability to select the notes you want to ‘magentify’
- The ability to play your notes back

Given homework 2 and homework 5, I knew that I had the code to support most of these features. However, it was also a matter of building a compelling user interface that could logically support all of these features as well. 

With this in mind, I took to Figma to design something fun that could challenge my web design abilities but could also be done within the time constraints I had been given. 

The interface is entirely built using HTML/CSS – leveraging CSS properties like transition-duration and transform to get some cool transitions and scaling effects based on certain user interactions. A lot of the interactivity that this interface provides, however, lives in styling.js. Here, I handle features like the note visualizer, the note selections, and other events specific to more high-level user interactions. 

### Building the functionality 
Integrating the Web Audio and Magenta APIs to work with this functionality proved to be the most challenging part to this experience. 

**Adding the Keyboard/Synthesis Techniques** </br>
I started off by integrating the keyboard/synthesis functionality from homework 2 into the project and syncing the keyboard up with the interface such that, every time you press a note, this note gets added to the view. The keyboard/synthesis functionality carries on all the features that were specified in the homework 2 specifications (e.g. additive, AM, and FM synthesis) and is extended by the addition of the waveshaping synthesis technique. <br/>

The waveshaping synthesis technique is a method of music synthesis involving the intentional distortion of a signal. This [distortion](https://en.wikipedia.org/wiki/Waveshaper#:~:text=In%20electronic%20music%20waveshaping%20is,the%20shape%20of%20the%20waveforms) can be achieved by applying a mathematical or shaping function in which takes in an input signal (e.g. a WebAudio oscillator node) and outputs some transformed, “distorted” signal as a result. 

I decided to choose this technique because I thought that, in the case that the Web Audio API did not provide the waveshaping functionality already, creating the mathematical mapping could be feasible. Luckily, however, I found that the Web Audio API does provide a [WaveShaperNode](https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode) in which takes in an input such that I can run my oscillator node through its input and send the distorted output signal through other audio nodes, like gain nodes, to create more effects. At first, I thought that the waveshaper node had a default curve that would apply the distortion. This caused an error to arise when playing back the sound which produced no audio. After looking more closely at the documentation, however, I realized that the WaveShaperNode comes with a curve property which requires you to specify the shaping function in the form of a Float32Array. Initially, I was confused about the relation between the shaping function and the array, however, this StackOverflow [thread](https://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion) allowed me to gain some insight into how people create distortion curves and how not all distortion curves will have a noticeable effect on your original input signal. I used the distortion curve provided here as it seemed to be well-backed and I could make some of the features customizable by the user (e.g. the value of k).

Other changes that were made in the integration of keyboard/synthesis techniques from homework 2 was the general reduction of the keyboard size. I found that I did have to reduce the size of the keyboard to five key notes (C, D, E, F, G) in order to make the project more feasible given the complexity of the features I wanted to add. 

The code implementation for the keyboard can be found in keyboard.js. 

**Adding Magenta** <br/>
Magenta was the real challenge here as I couldn’t reuse the code I had built here due to some lingering issues that I wasn’t able to solve in this homework iteration.

The issues were the following:
1. I could not play back the ‘magentified’ pieces
2. The Magenta API would cause some notes to be skipped unless I changed the offset to something extremely long

I found the first issue to be rooted in the place where I declared a new Web Audio context. Revisiting Professor Santalucito’s [Magenta](http://www.marksantolucito.com/COMS3430/fall2022/magenta/) example, I realized that, in his implementation of Magenta, a new audio context is instantiated every time the play button is pressed whereas, in my original implementation, the audio context is instantiated only once. My assumption is that there were some changes applied to the audio context object which prevented the audio from restarting upon hitting play again. This could possibly be traced down to the oscillator node’s start method or changes done to the gain although I am not completely certain. Creating a new audio context object would fix said issues as these changes would not transfer over with a new object. 

I fixed my second issue by changing the overall implementation of this feature. My initial implementation of this feature was such that, everytime a user pressed the Magenta button, the audio would play immediately. Because it takes some time for Magenta to queue up these notes, the offset would have to be factored into the startTime and endTime of the notes. 

This offset was causing a lot of problems with the note visualizer because, as the Magenta API takes an unpredictable amount of time to load, it was hard to predict when to trigger the visualizer.

By changing the implementation so that the Magenta does not automatically play but simply alters the notes, it provides the interface some time to inform the user that the new Magenta notes are still being fetched and, by then removing the offset, allows the notes to play immediately as opposed to playing after some long time. 

The code implementation for magenta can be found in magenta.js.

### Room for Improvement
As of now, the Magenta API only continues the initial series of input notes that come before the selection. I could not find this in the API documentation but it would be great if the Magenta API could also consider the notes that come after in order to fill in a sequence as opposed to continuing it.

I would also love to add some more ways to edit each synthesis technique. As of now, the AM mode of synthesis has no available controls yet but I would love to iterate on this in the future. 


