const keyboardFrequencyMap = {
  81: 523.251130601197269, //Q - C
  87: 587.32953583481512, //W - D
  69: 659.255113825739859, //E - E
  82: 698.456462866007768, //R - F
  84: 783.990871963498588, //T - G
};

const signalPositioning = {
  81: 100,
  87: 80,
  69: 60,
  82: 40,
  84: 20,
};

window.frequencyHistory = [];
window.selectedNotes = [];

let activeSynthTechnique = ["additive-btn"];
let magentifiedNotes = [];

const compareNumbers = (a, b) => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

const selectNotesInRange = (noteIdx) => {
  if (!window.selectedNotes.includes(noteIdx)) {
    window.selectedNotes.push(noteIdx);
  } else {
    return;
  }

  window.selectedNotes.sort(compareNumbers);

  let newArr = [];

  let isChangeNeeded = false;

  for (let i = 0; i < window.selectedNotes.length - 1; i++) {
    let currentNote = window.selectedNotes[i];
    newArr.push(currentNote);
    let nextNote = window.selectedNotes[i + 1];
    if (nextNote != currentNote + 1) {
      isChangeNeeded = true;
      for (let j = currentNote + 1; j < nextNote; j++) {
        newArr.push(j);
      }
      if (nextNote == window.selectedNotes[window.selectedNotes.length - 1]) {
        newArr.push(nextNote);
      }
    }
  }

  if (isChangeNeeded) {
    window.selectedNotes = newArr.splice(0);
  }

  for (const note of window.selectedNotes) {
    if (!magentifiedNotes.includes(note)) {
      magentifiedNotes.push(note);
    }
  }
};

const addNoteSignalStyling = () => {
  window.selectedNotes.forEach((noteIdx) => {
    $(`.${noteIdx}`).addClass("selected-note-signal");
  });
};

const removeNoteSignalStyling = () => {
  window.selectedNotes.forEach((noteIdx) => {
    $(`.${noteIdx}`).removeClass("selected-note-signal");
  });
};

const addMagentaOverlay = () => {
  const widthOfSelection = window.selectedNotes.length * 35;
  $(".recording-view").append(
    `<div class='magenta-overlay' style='width:${widthOfSelection}px;left:${
      window.selectedNotes[0] * 35
    }px;'></div>`
  );
};

const visualizeNote = (i) => {
  let delay = (i + 1) * 475;

  setTimeout(() => {
    if (magentifiedNotes.includes(i)) {
      $(`.${i - 1}`).removeClass("selected-note-signal");
      $(`.magenta-overlay`).removeClass("active-magenta-overlay");
      $(`.magenta-overlay`).addClass("active-magenta-overlay");
    } else {
      $(`.${i - 1}`).removeClass("selected-note-signal");
      $(`.${i}`).addClass("selected-note-signal");
    }
  }, delay);

  setTimeout(() => {
    $(`.magenta-overlay`).removeClass("active-magenta-overlay");
    $(`.${i}`).removeClass("selected-note-signal");
    $(".info-status").text("play some notes");
  }, (window.frequencyHistory.length + 1) * 475);
};

const handleKeyPress = () => {
  $(window).keydown((event) => {
    const key = (event.detail || event.which).toString();
    if (Object.keys(keyboardFrequencyMap).includes(key)) {
      $(".speaker-1, .speaker-2, .mini-speaker-1, .mini-speaker-2").addClass(
        "active-speakers"
      );
    } else {
      return;
    }

    $(`.${key}`).addClass("active-white-key");

    const widthOfNoteSignal = 35;

    $(".recording-view").append(
      `<div class='note-signal ${window.frequencyHistory.length} freq-${
        keyboardFrequencyMap[key]
      }' style='top:${signalPositioning[key]}px;left:${
        widthOfNoteSignal * window.frequencyHistory.length
      }px;'></div>`
    );

    $(".note-signal").animate(
      {
        opacity: 0.4,
      },
      500
    );

    window.frequencyHistory.push(keyboardFrequencyMap[key]);
  });

  $(window).keyup((event) => {
    const key = (event.detail || event.which).toString();
    if (Object.keys(keyboardFrequencyMap).includes(key)) {
      $(".speaker-1, .speaker-2, .mini-speaker-1, .mini-speaker-2").removeClass(
        "active-speakers"
      );
    }
    $(`.${key}`).removeClass("active-white-key");
  });
};

const handleBtnClick = () => {
  $(".play-btn").click(() => {
    window.frequencyHistory.forEach((freq, i) => {
      visualizeNote(i);
    });
  });

  $(".magenta-btn").click(() => {
    addMagentaOverlay();
    $(".deselect-btn").css("display", "none");
    removeNoteSignalStyling();
  });

  $(".additive-btn").click(() => {
    if (activeSynthTechnique != "additive-btn") {
      $(`.${activeSynthTechnique}`).removeClass("active-btn");
      $(`.${activeSynthTechnique}`).removeClass("active-btn-label");
    }
    $(".additive-btn").addClass("active-btn");
    $(".additive-btn-label").addClass("active-btn-label");
    activeSynthTechnique = "additive-btn";
  });

  $(".am-btn").click(() => {
    if (activeSynthTechnique != "am-btn") {
      $(`.${activeSynthTechnique}`).removeClass("active-btn");
      $(`.${activeSynthTechnique}`).removeClass("active-btn-label");
    }

    $(".am-btn").addClass("active-btn");
    $(".am-btn-label").addClass("active-btn-label");

    activeSynthTechnique = "am-btn";
  });

  $(".fm-btn").click(() => {
    if (activeSynthTechnique != "fm-btn") {
      $(`.${activeSynthTechnique}`).removeClass("active-btn");
      $(`.${activeSynthTechnique}`).removeClass("active-btn-label");
    }
    $(".fm-btn").addClass("active-btn");
    $(".fm-btn-label").addClass("active-btn-label");

    activeSynthTechnique = "fm-btn";
  });

  $(document).on("click", ".note-signal", (event) => {
    $(".deselect-btn").css("display", "block");
    let classList = $(event.target).attr("class").split(/\s+/);

    for (let i = 0; i < classList.length; i++) {
      let currClass = classList[i];
      if (currClass != "note-signal" && currClass != "selected-note-signal") {
        selectNotesInRange(Number(currClass));
        addNoteSignalStyling();
        break;
      }
    }
  });

  $(document).on("click", ".deselect-btn", () => {
    $(".deselect-btn").css("display", "none");
    removeNoteSignalStyling();
    window.selectedNotes = [];
  });
};

$(document).ready(() => {
  handleKeyPress();
  handleBtnClick();
});

export { keyboardFrequencyMap };
