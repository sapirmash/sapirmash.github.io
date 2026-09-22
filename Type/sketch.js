let font;


// ==================================================
// LETTER
// ==================================================

let word = "A";

let letters = [];

let col = "#ffffff";

let fontSize = 350;


// ==================================================
// PHYSICS
// ==================================================

let springK = 0.125;
let damping = 0.85;


// ==================================================
// NEW BREATH RESPONSE
// ==================================================

// Weak breath = local
// Strong breath = broad
let breathRadiusMin = 55;
let breathRadiusMax = 210;

// Weak breath = slow
// Strong breath = much faster
let breathSpeedMin = 0.18;
let breathSpeedMax = 2.4;

// Slight sideways/material bias.
// Keeps the pressure from looking like
// a perfectly symmetrical balloon.
let flowBias = 0.28;

// Very subtle organic irregularity
let organicAmount = 1.2;


// ==================================================
// SAFE AREA
// ==================================================

let canvasPaddingX = 20;
let canvasPaddingTop = 20;
let canvasPaddingBottom = 0;


// ==================================================
// AUDIO
// ==================================================

let audioContext;

let analyser;
let microphone;
let audioData;

let micLevel = 0;
let smoothLevel = 0;

let audioStarted = false;


// ==================================================
// CALIBRATION
// ==================================================

let isCalibrating = false;

let calibrationStartTime = 0;
let calibrationDuration = 1200;

let calibrationSamples = [];

let ambientLevel = 0;

let calibrated = false;


// ==================================================
// BREATH
// ==================================================

let breathLevel = 0;

let startThreshold = 0;
let stopThreshold = 0;

let isBlowing = false;

let quietFrames = 0;

let breathBase = [];


// ==================================================
// PRESSURE POINT
// ==================================================

let breathImpact = null;


// ==================================================
// DEBUG BREATH METER
//
// Keep this true while we tune sensitivity.
// Later we can turn it off.
// ==================================================

let showBreathMeter = true;


// ==================================================
// SETUP
// ==================================================

async function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );


  font = await loadFont(
    "https://fonts.gstatic.com/s/dmsans/v16/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAC5thTmf3ZGMZpg.ttf"
  );


  buildWord();
}


// ==================================================
// DRAW
// ==================================================

function draw() {

  background("#000000");


  if (audioStarted) {

    updateMicLevel();

    updateCalibration();
  }


  if (
    audioStarted &&
    calibrated
  ) {

    updateBreath();
  }


  updatePhysics();

  drawWord();


  if (
    showBreathMeter &&
    audioStarted &&
    calibrated
  ) {

    drawBreathMeter();
  }
}


// ==================================================
// VISIBLE BOTTOM
// ==================================================

function getVisibleBottom() {

  if (window.visualViewport) {

    return (
      window.visualViewport.offsetTop +
      window.visualViewport.height
    );
  }


  return window.innerHeight;
}


// ==================================================
// RESPONSIVE FONT SIZE
// ==================================================

function getResponsiveFontSize() {

  let maxSize =
    width < 500
      ? width * 0.88
      : 350;


  textFont(font);

  textSize(maxSize);


  let availableWidth =
    width - 80;


  let measuredWidth =
    textWidth(word);


  if (
    measuredWidth >
    availableWidth
  ) {

    maxSize *=
      availableWidth /
      measuredWidth;
  }


  return maxSize;
}


// ==================================================
// BUILD WORD
// ==================================================

function buildWord() {

  letters = [];


  fontSize =
    getResponsiveFontSize();


  let letter =
    buildLetter(
      word,
      0,
      0,
      fontSize
    );


  if (
    !letter ||
    letter.points.length === 0
  ) {

    return;
  }


  // ----------------------------------------------
  // GLYPH BOUNDS
  // ----------------------------------------------

  let minX = Infinity;
  let maxX = -Infinity;

  let minY = Infinity;
  let maxY = -Infinity;


  for (
    let p of letter.points
  ) {

    minX =
      min(
        minX,
        p.hx
      );


    maxX =
      max(
        maxX,
        p.hx
      );


    minY =
      min(
        minY,
        p.hy
      );


    maxY =
      max(
        maxY,
        p.hy
      );
  }


  let glyphWidth =
    maxX - minX;


  // ----------------------------------------------
  // CENTER HORIZONTALLY
  // ----------------------------------------------

  let desiredLeft =
    (
      width -
      glyphWidth
    ) / 2;


  let shiftX =
    desiredLeft -
    minX;


  // ----------------------------------------------
  // SIT DIRECTLY ON BOTTOM
  // ----------------------------------------------

  let visibleBottom =
    min(
      height,
      getVisibleBottom()
    );


  let shiftY =
    visibleBottom -
    maxY;


  // ----------------------------------------------
  // APPLY POSITION
  // ----------------------------------------------

  for (
    let p of letter.points
  ) {

    p.hx += shiftX;
    p.hy += shiftY;

    p.x += shiftX;
    p.y += shiftY;
  }


  letters.push(
    letter
  );
}


// ==================================================
// BUILD LETTER
// ==================================================

function buildLetter(
  char,
  x,
  y,
  size
) {

  let contours =
    font.textToContours(
      char,
      x,
      y,
      size,
      {
        sampleFactor: 0.35,
        simplifyThreshold: 0
      }
    );


  let processedContours = [];

  let allPoints = [];


  for (
    let contour of contours
  ) {

    let pts = [];


    for (
      let p of contour
    ) {

      let pt = {

        hx: p.x,
        hy: p.y,

        x: p.x,
        y: p.y,

        vx: 0,
        vy: 0
      };


      pts.push(
        pt
      );


      allPoints.push(
        pt
      );
    }


    processedContours.push(
      pts
    );
  }


  return {

    char: char,

    contours:
      processedContours,

    points:
      allPoints
  };
}


// ==================================================
// LETTER BOUNDS
// ==================================================

function getLetterBounds(letter) {

  let minX = Infinity;
  let maxX = -Infinity;

  let minY = Infinity;
  let maxY = -Infinity;


  for (
    let p of letter.points
  ) {

    minX =
      min(
        minX,
        p.hx
      );


    maxX =
      max(
        maxX,
        p.hx
      );


    minY =
      min(
        minY,
        p.hy
      );


    maxY =
      max(
        maxY,
        p.hy
      );
  }


  return {

    minX,
    maxX,

    minY,
    maxY,

    w:
      maxX -
      minX,

    h:
      maxY -
      minY
  };
}


// ==================================================
// CHOOSE PRESSURE POINT
// ==================================================

function chooseImpactPoint(letter) {

  let bounds =
    getLetterBounds(
      letter
    );


  // We still need a position where the breath
  // "lands", because a microphone cannot detect
  // spatial position.
  //
  // But unlike before, this does NOT choose
  // a random movement direction.
  //
  // Keep the point away from extreme edges.

  let x =
    random(
      bounds.minX +
      bounds.w * 0.22,

      bounds.maxX -
      bounds.w * 0.22
    );


  let y =
    random(
      bounds.minY +
      bounds.h * 0.18,

      bounds.maxY -
      bounds.h * 0.18
    );


  return {

    x: x,
    y: y,

    // Each breath gets only a tiny material bias.
    // This is NOT the main direction.
    biasAngle:
      random(
        -PI,
        PI
      )
  };
}


// ==================================================
// BEGIN BREATH
// ==================================================

function beginBreath(letter) {

  breathBase = [];


  for (
    let p of letter.points
  ) {

    breathBase.push({

      x: p.hx,
      y: p.hy

    });
  }


  breathImpact =
    chooseImpactPoint(
      letter
    );
}
// ==================================================
// UPDATE BREATH
// ==================================================

function updateBreath() {

  if (
    letters.length === 0
  ) {

    return;
  }


  let letter =
    letters[0];


  // ==================================================
  // RAW BREATH ABOVE AMBIENT
  // ==================================================

  let aboveAmbient =
    max(
      smoothLevel -
      ambientLevel,
      0
    );


  // ==================================================
  // MORE SENSITIVE BREATH MAPPING
  // ==================================================
  //
  // We want much more useful separation between:
  //
  // soft
  // medium
  // strong
  //
  // rather than quickly reaching 1.
  // ==================================================

  let sensitivityRange =
    max(
      startThreshold * 3.8,
      0.035
    );


  breathLevel =
    map(
      aboveAmbient,
      stopThreshold,
      sensitivityRange,
      0,
      1
    );


  breathLevel =
    constrain(
      breathLevel,
      0,
      1
    );


  // Slight curve gives us more resolution
  // in the weak / medium range.

  breathLevel =
    pow(
      breathLevel,
      1.15
    );


  // ==================================================
  // START BREATH
  // ==================================================

  if (
    !isBlowing &&
    aboveAmbient >
      startThreshold
  ) {

    isBlowing =
      true;


    quietFrames =
      0;


    beginBreath(
      letter
    );
  }


  // ==================================================
  // STOP BREATH
  // ==================================================

  if (isBlowing) {

    if (
      aboveAmbient <
        stopThreshold
    ) {

      quietFrames++;

    } else {

      quietFrames =
        0;
    }


    if (
      quietFrames > 10
    ) {

      isBlowing =
        false;


      quietFrames =
        0;


      breathBase =
        [];


      breathImpact =
        null;


      return;
    }
  }


  if (
    !isBlowing ||
    !breathImpact ||
    breathBase.length === 0
  ) {

    return;
  }


  // ==================================================
  // BREATH POWER
  // ==================================================
  //
  // This is where weak and strong breaths
  // become visually different.
  // ==================================================

  let breathPower =
    pow(
      breathLevel,
      1.35
    );


  // ==================================================
  // STRENGTH CONTROLS RADIUS
  // ==================================================

  let currentRadius =
    lerp(
      breathRadiusMin,
      breathRadiusMax,
      breathPower
    );


  // ==================================================
  // STRENGTH CONTROLS SPEED
  // ==================================================

  let currentSpeed =
    lerp(
      breathSpeedMin,
      breathSpeedMax,
      breathPower
    );


  // At extremely tiny levels,
  // don't continue accumulating movement.

  if (
    breathLevel < 0.025
  ) {

    currentSpeed = 0;
  }


  // ==================================================
  // ORIGINAL BOTTOM
  // ==================================================

  let baseBottom =
    -Infinity;


  for (
    let pt of breathBase
  ) {

    baseBottom =
      max(
        baseBottom,
        pt.y
      );
  }


  // ==================================================
  // PROPOSED SHAPE
  // ==================================================

  let proposedTargets = [];


  for (
    let i = 0;
    i < letter.points.length;
    i++
  ) {

    let p =
      letter.points[i];


    let base =
      breathBase[i];


    // ----------------------------------------------
    // DISTANCE FROM BREATH IMPACT
    // ----------------------------------------------

    let dx =
      base.x -
      breathImpact.x;


    let dy =
      base.y -
      breathImpact.y;


    let distance =
      sqrt(
        dx * dx +
        dy * dy
      );


    // ----------------------------------------------
    // OUTWARD DIRECTION
    // ----------------------------------------------

    let safeDistance =
      max(
        distance,
        0.001
      );


    let dirX =
      dx /
      safeDistance;


    let dirY =
      dy /
      safeDistance;


    // ----------------------------------------------
    // GAUSSIAN PRESSURE
    //
    // Same soft falloff concept we liked before.
    // ----------------------------------------------

    let influence =
      Math.exp(
        -(
          distance *
          distance
        ) /
        (
          2 *
          currentRadius *
          currentRadius
        )
      );


    influence =
      pow(
        influence,
        0.95
      );


    // ----------------------------------------------
    // CUMULATIVE PRESSURE
    //
    // Start from current hx/hy so pressure
    // keeps accumulating while blowing.
    // ----------------------------------------------

    let targetX =
      p.hx;


    let targetY =
      p.hy;


    targetX +=
      dirX *
      currentSpeed *
      influence;


    targetY +=
      dirY *
      currentSpeed *
      influence;


    // ----------------------------------------------
    // SUBTLE MATERIAL FLOW BIAS
    //
    // Prevents a mathematically perfect
    // radial balloon effect.
    //
    // It is deliberately much weaker than
    // the outward pressure.
    // ----------------------------------------------

    let biasX =
      cos(
        breathImpact.biasAngle
      );


    let biasY =
      sin(
        breathImpact.biasAngle
      );


    targetX +=
      biasX *
      currentSpeed *
      influence *
      flowBias;


    targetY +=
      biasY *
      currentSpeed *
      influence *
      flowBias;


    // ----------------------------------------------
    // TINY ORGANIC IRREGULARITY
    // ----------------------------------------------

    let variationX =
      noise(
        base.x * 0.003,
        base.y * 0.003,
        40
      );


    let variationY =
      noise(
        base.x * 0.003,
        base.y * 0.003,
        90
      );


    variationX =
      map(
        variationX,
        0,
        1,
        -1,
        1
      );


    variationY =
      map(
        variationY,
        0,
        1,
        -1,
        1
      );


    targetX +=
      variationX *
      organicAmount *
      currentSpeed *
      influence *
      0.15;


    targetY +=
      variationY *
      organicAmount *
      currentSpeed *
      influence *
      0.15;


    proposedTargets.push({

      x: targetX,
      y: targetY

    });
  }


  // ==================================================
  // KEEP THE WHOLE LETTER ON THE BASELINE
  //
  // Same successful logic as before.
  // No individual points are pinned.
  // ==================================================

  let proposedBottom =
    -Infinity;


  for (
    let target of proposedTargets
  ) {

    proposedBottom =
      max(
        proposedBottom,
        target.y
      );
  }


  let verticalCorrection =
    baseBottom -
    proposedBottom;


  for (
    let target of proposedTargets
  ) {

    target.y +=
      verticalCorrection;
  }


  // ==================================================
  // SAFE DEFORMATION
  // ==================================================

  let safeScale =
    getSafeDeformationScale(
      letter.points,
      proposedTargets
    );


  // ==================================================
  // APPLY TARGET
  // ==================================================

  for (
    let i = 0;
    i < letter.points.length;
    i++
  ) {

    let p =
      letter.points[i];


    let target =
      proposedTargets[i];


    let dx =
      target.x -
      p.hx;


    let dy =
      target.y -
      p.hy;


    p.hx +=
      dx *
      safeScale;


    p.hy +=
      dy *
      safeScale;
  }
}


// ==================================================
// SAFE DEFORMATION SCALE
// ==================================================

function getSafeDeformationScale(
  currentPoints,
  targetPoints
) {

  let safeScale =
    1;


  let leftBoundary =
    canvasPaddingX;


  let rightBoundary =
    width -
    canvasPaddingX;


  let topBoundary =
    canvasPaddingTop;


  let bottomBoundary =
    min(
      height,
      getVisibleBottom()
    ) -
    canvasPaddingBottom;


  for (
    let i = 0;
    i < currentPoints.length;
    i++
  ) {

    let current =
      currentPoints[i];


    let target =
      targetPoints[i];


    let dx =
      target.x -
      current.hx;


    let dy =
      target.y -
      current.hy;


    // LEFT

    if (dx < 0) {

      let available =
        current.hx -
        leftBoundary;


      if (
        available <= 0
      ) {

        safeScale = 0;

      } else {

        safeScale =
          min(
            safeScale,
            available / -dx
          );
      }
    }


    // RIGHT

    if (dx > 0) {

      let available =
        rightBoundary -
        current.hx;


      if (
        available <= 0
      ) {

        safeScale = 0;

      } else {

        safeScale =
          min(
            safeScale,
            available / dx
          );
      }
    }


    // TOP

    if (dy < 0) {

      let available =
        current.hy -
        topBoundary;


      if (
        available <= 0
      ) {

        safeScale = 0;

      } else {

        safeScale =
          min(
            safeScale,
            available / -dy
          );
      }
    }


    // BOTTOM

    if (dy > 0) {

      let available =
        bottomBoundary -
        current.hy;


      if (
        available <= 0
      ) {

        safeScale = 0;

      } else {

        safeScale =
          min(
            safeScale,
            available / dy
          );
      }
    }
  }


  return constrain(
    safeScale,
    0,
    1
  );
}


// ==================================================
// PHYSICS
// ==================================================

function updatePhysics() {

  if (
    letters.length === 0
  ) {

    return;
  }


  let letter =
    letters[0];


  let nextPositions = [];


  for (
    let p of letter.points
  ) {

    let ax =
      (
        p.hx -
        p.x
      ) *
      springK;


    let ay =
      (
        p.hy -
        p.y
      ) *
      springK;


    let nextVX =
      (
        p.vx +
        ax
      ) *
      damping;


    let nextVY =
      (
        p.vy +
        ay
      ) *
      damping;


    nextPositions.push({

      x:
        p.x +
        nextVX,

      y:
        p.y +
        nextVY,

      vx:
        nextVX,

      vy:
        nextVY
    });
  }


  // ==================================================
  // KEEP PHYSICS INSIDE CANVAS
  // ==================================================

  let physicsScale =
    1;


  let leftBoundary =
    canvasPaddingX;


  let rightBoundary =
    width -
    canvasPaddingX;


  let topBoundary =
    canvasPaddingTop;


  let bottomBoundary =
    min(
      height,
      getVisibleBottom()
    ) -
    canvasPaddingBottom;


  for (
    let i = 0;
    i < letter.points.length;
    i++
  ) {

    let p =
      letter.points[i];


    let next =
      nextPositions[i];


    let dx =
      next.x -
      p.x;


    let dy =
      next.y -
      p.y;


    if (dx < 0) {

      let available =
        p.x -
        leftBoundary;


      if (available <= 0) {

        physicsScale = 0;

      } else {

        physicsScale =
          min(
            physicsScale,
            available / -dx
          );
      }
    }


    if (dx > 0) {

      let available =
        rightBoundary -
        p.x;


      if (available <= 0) {

        physicsScale = 0;

      } else {

        physicsScale =
          min(
            physicsScale,
            available / dx
          );
      }
    }


    if (dy < 0) {

      let available =
        p.y -
        topBoundary;


      if (available <= 0) {

        physicsScale = 0;

      } else {

        physicsScale =
          min(
            physicsScale,
            available / -dy
          );
      }
    }


    if (dy > 0) {

      let available =
        bottomBoundary -
        p.y;


      if (available <= 0) {

        physicsScale = 0;

      } else {

        physicsScale =
          min(
            physicsScale,
            available / dy
          );
      }
    }
  }


  physicsScale =
    constrain(
      physicsScale,
      0,
      1
    );


  // ==================================================
  // APPLY
  // ==================================================

  for (
    let i = 0;
    i < letter.points.length;
    i++
  ) {

    let p =
      letter.points[i];


    let next =
      nextPositions[i];


    p.vx =
      next.vx *
      physicsScale;


    p.vy =
      next.vy *
      physicsScale;


    p.x +=
      p.vx;


    p.y +=
      p.vy;
  }
}
// ==================================================
// DRAW WORD
// ==================================================

function drawWord() {

  noStroke();

  fill(col);


  for (
    let letter of letters
  ) {

    drawLetter(
      letter
    );
  }
}


// ==================================================
// DRAW LETTER
// ==================================================

function drawLetter(letter) {

  if (
    letter.contours.length === 0
  ) {

    return;
  }


  beginShape();


  // OUTER

  for (
    let p of letter.contours[0]
  ) {

    vertex(
      p.x,
      p.y
    );
  }


  // HOLES

  for (
    let i = 1;
    i < letter.contours.length;
    i++
  ) {

    beginContour();


    for (
      let p of letter.contours[i]
    ) {

      vertex(
        p.x,
        p.y
      );
    }


    endContour();
  }


  endShape(CLOSE);
}


// ==================================================
// BREATH METER
// ==================================================

function drawBreathMeter() {

  let meterWidth =
    min(
      180,
      width - 40
    );


  let meterHeight =
    5;


  let x =
    20;


  let y =
    24;


  push();


  // Background

  noStroke();

  fill(
    255,
    35
  );


  rect(
    x,
    y,
    meterWidth,
    meterHeight,
    meterHeight / 2
  );


  // Current breath

  fill(255);


  rect(
    x,
    y,
    meterWidth *
      breathLevel,
    meterHeight,
    meterHeight / 2
  );


  pop();
}


// ==================================================
// START AUDIO
// ==================================================

async function startAudio() {

  if (
    audioStarted
  ) {

    return;
  }


  try {

    let AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    audioContext =
      new AudioContextClass();


    if (
      audioContext.state ===
      "suspended"
    ) {

      await audioContext.resume();
    }


    let stream =
      await navigator.mediaDevices.getUserMedia({

        audio: {

          echoCancellation:
            false,

          noiseSuppression:
            false,

          autoGainControl:
            false
        }
      });


    microphone =
      audioContext.createMediaStreamSource(
        stream
      );


    analyser =
      audioContext.createAnalyser();


    analyser.fftSize =
      1024;


    analyser.smoothingTimeConstant =
      0.15;


    audioData =
      new Uint8Array(
        analyser.fftSize
      );


    microphone.connect(
      analyser
    );


    audioStarted =
      true;


    beginCalibration();

  } catch (error) {

    console.error(
      "Microphone error:",
      error
    );
  }
}


// ==================================================
// BEGIN CALIBRATION
// ==================================================

function beginCalibration() {

  isCalibrating =
    true;


  calibrated =
    false;


  calibrationSamples =
    [];


  calibrationStartTime =
    millis();


  ambientLevel =
    0;


  smoothLevel =
    0;
}


// ==================================================
// UPDATE CALIBRATION
// ==================================================

function updateCalibration() {

  if (
    !isCalibrating
  ) {

    return;
  }


  calibrationSamples.push(
    micLevel
  );


  let elapsed =
    millis() -
    calibrationStartTime;


  if (
    elapsed <
    calibrationDuration
  ) {

    return;
  }


  calibrationSamples.sort(
    function(a, b) {

      return a - b;
    }
  );


  let middle =
    floor(
      calibrationSamples.length /
      2
    );


  ambientLevel =
    calibrationSamples[
      middle
    ];


  startThreshold =
    max(
      0.012,
      ambientLevel * 1.8
    );


  stopThreshold =
    max(
      0.006,
      ambientLevel * 0.8
    );


  isCalibrating =
    false;


  calibrated =
    true;
}


// ==================================================
// UPDATE MIC LEVEL
// ==================================================

function updateMicLevel() {

  if (
    !analyser ||
    !audioData
  ) {

    return;
  }


  analyser.getByteTimeDomainData(
    audioData
  );


  let sum = 0;


  for (
    let i = 0;
    i < audioData.length;
    i++
  ) {

    let value =
      (
        audioData[i] -
        128
      ) /
      128;


    sum +=
      value *
      value;
  }


  micLevel =
    Math.sqrt(
      sum /
      audioData.length
    );


  smoothLevel =
    lerp(
      smoothLevel,
      micLevel,
      0.08
    );
}


// ==================================================
// START ON TAP
// ==================================================

function mousePressed() {

  if (
    !audioStarted
  ) {

    startAudio();
  }


  return false;
}


function touchStarted() {

  if (
    !audioStarted
  ) {

    startAudio();
  }


  return false;
}


// ==================================================
// RESET
// ==================================================

function resetBreathState() {

  isBlowing =
    false;


  quietFrames =
    0;


  breathLevel =
    0;


  breathBase =
    [];


  breathImpact =
    null;
}


// ==================================================
// RESIZE
// ==================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );


  buildWord();

  resetBreathState();
}


// ==================================================
// SAFARI VIEWPORT
// ==================================================

if (
  window.visualViewport
) {

  window.visualViewport.addEventListener(
    "resize",
    function() {

      if (
        font &&
        letters.length > 0
      ) {

        buildWord();

        resetBreathState();
      }
    }
  );
}
