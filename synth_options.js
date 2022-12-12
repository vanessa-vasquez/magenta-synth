let numOfPartials = 3;
let randomnessFactor = 15;
let lfoFreq = 10;
let modFreq = 50;
let modIndex = 25;

const handleSubmit = () => {
  $(document).on("submit", "#partials-form", (e) => {
    e.preventDefault();

    numOfPartials = $("#partials-form input[name='partials']").val();

    $("#partials-form input").blur();
  });

  $(document).on("submit", "#randomness-form", (e) => {
    e.preventDefault();

    randomnessFactor = $("#randomness-form input[name='randomness']").val();

    $("#randomness-form input").blur();
  });
};

const updateFreq = () => {
  $(".fm-freq-slider").on("input", function () {
    let newFreq = $("#mod-freq").val();
    modFreq = newFreq;
  });
};

const updateIndex = () => {
  $(".fm-index-slider").on("input", function () {
    let newIndex = $("#mod-index").val();
    modIndex = newIndex;
  });
};

const updateSlider = () => {
  $(".slider").on("input", function () {
    let newFreq = $(".slider").val();
    lfoFreq = newFreq;
  });
};

$(document).ready(() => {
  handleSubmit();
  updateFreq();
  updateIndex();
  updateSlider();
});

export { numOfPartials, randomnessFactor, lfoFreq, modFreq, modIndex };
