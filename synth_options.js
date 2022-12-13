let numOfPartials = 3;
let randomnessFactor = 15;
let k = 50;
let lfoFreq = 10;
let modFreq = 50;
let modIndex = 25;

const handleSubmit = () => {
  $(document).on("submit", "#k-form", (e) => {
    e.preventDefault();

    k = Number($("#k-form input[name='k']").val());

    $("#k-form input").blur();
  });

  $(document).on("submit", "#partials-form", (e) => {
    e.preventDefault();

    numOfPartials = Number($("#partials-form input[name='partials']").val());

    $("#partials-form input").blur();
  });

  $(document).on("submit", "#randomness-form", (e) => {
    e.preventDefault();

    randomnessFactor = Number(
      $("#randomness-form input[name='randomness']").val()
    );

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

export { numOfPartials, randomnessFactor, k, lfoFreq, modFreq, modIndex };
