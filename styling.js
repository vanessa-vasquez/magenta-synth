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

let activeSynthTechnique = ["additive-btn"];
let frequencyHistory = [];
let selectedNotes = [];

const selectNotesInRange = (noteIdx) => {
  if (!selectedNotes.includes(noteIdx)) {
    selectedNotes.push(noteIdx);
  } else {
    return;
  }

  selectedNotes.sort(compareNumbers);

  let newArr = [];

  let isChangeNeeded = false;

  for (let i = 0; i < selectedNotes.length - 1; i++) {
    let currentNote = selectedNotes[i];
    newArr.push(currentNote);
    let nextNote = selectedNotes[i + 1];
    if (nextNote != currentNote + 1) {
      isChangeNeeded = true;
      for (let j = currentNote + 1; j < nextNote; j++) {
        newArr.push(j);
      }
      if (nextNote == selectedNotes[selectedNotes.length - 1]) {
        newArr.push(nextNote);
      }
    }
  }

  if (isChangeNeeded) {
    selectedNotes = newArr.splice(0);
  }
};

const addNoteSignalStyling = () => {
  selectedNotes.forEach((noteIdx) => {
    $(`.${noteIdx}`).addClass("selected-note-signal");
  });
};

const removeNoteSignalStyling = () => {
  selectedNotes.forEach((noteIdx) => {
    $(`.${noteIdx}`).removeClass("selected-note-signal");
  });
};

const compareNumbers = (a, b) => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
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
      `<div class='note-signal ${frequencyHistory.length} freq-${
        keyboardFrequencyMap[key]
      }' style='top:${signalPositioning[key]}px;left:${
        widthOfNoteSignal * frequencyHistory.length
      }px;'></div>`
    );

    $(".note-signal").animate(
      {
        opacity: 0.4,
      },
      500
    );

    frequencyHistory.push(keyboardFrequencyMap[key]);
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

const addMagentaOverlay = () => {
  const widthOfSelection = selectedNotes.length * 35;
  $(".recording-view").append(
    `<div class='magenta-overlay'' style='width:${widthOfSelection}px;left:${
      selectedNotes[0] * 35
    }px;'></div>`
  );
};

const handleBtnClick = () => {
  $(".magenta-btn").click(() => {
    addMagentaOverlay();
  });
  $(".additive-btn").click(() => {
    if (activeSynthTechnique.length != 0) {
      const activeTechnique = activeSynthTechnique.pop();

      $(`.${activeTechnique}`).removeClass("active-btn");
      $(`.${activeTechnique}`).removeClass("active-btn-label");
    }
    $(".additive-btn").addClass("active-btn");
    $(".additive-btn-label").addClass("active-btn-label");
    activeSynthTechnique.push("additive-btn");
  });

  $(".am-btn").click(() => {
    if (activeSynthTechnique.length != 0) {
      const activeTechnique = activeSynthTechnique.pop();

      $(`.${activeTechnique}`).removeClass("active-btn");
      $(`.${activeTechnique}`).removeClass("active-btn-label");
    }
    $(".am-btn").addClass("active-btn");
    $(".am-btn-label").addClass("active-btn-label");
    activeSynthTechnique.push("am-btn");
  });

  $(".fm-btn").click(() => {
    if (activeSynthTechnique.length != 0) {
      const activeTechnique = activeSynthTechnique.pop();

      $(`.${activeTechnique}`).removeClass("active-btn");
      $(`.${activeTechnique}`).removeClass("active-btn-label");
    }
    $(".fm-btn").addClass("active-btn");
    $(".fm-btn-label").addClass("active-btn-label");
    activeSynthTechnique.push("fm-btn");
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
    selectedNotes = [];
  });
};

$(document).ready(() => {
  handleKeyPress();
  handleBtnClick();
});

export { selectedNotes, frequencyHistory, keyboardFrequencyMap };
