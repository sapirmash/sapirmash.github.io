let font;

let letters = [];
let word = "A";

let col = "#d11515";
let fontSize = 350;


// ----------------------------------------
// PHYSICS
// ----------------------------------------

let springK = 0.14;
let damping = 0.82;


// ----------------------------------------
// DEFORMATION
// ----------------------------------------

let dragSpeed = 0.9;

let mainRadiusMin = 125;
let mainRadiusMax = 175;

let secondaryRadiusMin = 100;
let secondaryRadiusMax = 145;


// ----------------------------------------
// SCREEN SAFE AREA
// ----------------------------------------

let screenMargin = 12;


// ----------------------------------------
// AUDIO
// ----------------------------------------

let audioContext;
let analyser;
let microphone;
let audioData;

let micLevel = 0;
let smoothLevel = 0;

let audioStarted = false;


// ----------------------------------------
// CALIBRATION
// ----------------------------------------

let isCalibrating = false;
let calibrationStartTime = 0;

let calibrationDuration = 1200;

let calibrationSamples = [];
let ambientLevel = 0;

let calibrated = false;


// ----------------------------------------
// BREATH DETECTION
// ----------------------------------------

let breathLevel = 0;

let startThreshold = 0;
let stopThreshold = 0;


// ----------------------------------------
// BREATH
// ----------------------------------------

let isBlowing = false;
let quietFrames = 0;

let breathBase = [];

let activeDrag = null;
let secondaryDrag = null;


/* ----------------------------------------
   SETUP
---------------------------------------- */

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


/* ----------------------------------------
   DRAW
---------------------------------------- */

function draw() {

  background("#ebc7f5");


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


  // Uncomment while testing:
  // drawAudioDebug();
}


/* ----------------------------------------
   BUILD WORD
---------------------------------------- */

function buildWord() {

  letters = [];


  textFont(font);
  textSize(fontSize);


  let totalWidth =
    textWidth(word);


  let startX =
    width / 2 -
    totalWidth / 2;


  let baselineY =
    height / 2 +
    fontSize * 0.35;


  let letter =
    buildLetter(
      word,
      startX,
      baselineY
    );


  letters.push(letter);
}


/* ----------------------------------------
   BUILD LETTER
---------------------------------------- */

function buildLetter(
  char,
  x,
  y
) {

  let contours =
    font.textToContours(
      char,
      x,
      y,
      {
        sampleFactor: 0.35,
        simplifyThreshold: 0
      }
    );


  let processedContours = [];
  let allPoints = [];


  for (let contour of contours) {

    let pts = [];


    for (let p of contour) {

      let pt = {

        hx: p.x,
        hy: p.y,

        x: p.x,
        y: p.y,

        vx: 0,
        vy: 0
      };


      pts.push(pt);

      allPoints.push(pt);
    }


    processedContours.push(pts);
  }


  return {

    char: char,

    contours:
      processedContours,

    points:
      allPoints
  };
}


/* ----------------------------------------
   BEGIN NEW BREATH
---------------------------------------- */

function beginBreath(letter) {

  breathBase = [];


  // snapshot current deformed shape

  for (let p of letter.points) {

    breathBase.push({
      x: p.hx,
      y: p.hy
    });
  }


  // ----------------------------------------
  // CURRENT LETTER BOUNDS
  // ----------------------------------------

  let minX = Infinity;
  let maxX = -Infinity;

  let minY = Infinity;
  let maxY = -Infinity;


  for (let p of letter.points) {

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


  let w =
    maxX -
    minX;


  let h =
    maxY -
    minY;


  // ----------------------------------------
  // EACH BREATH CHOOSES ONE REGION
  // ----------------------------------------

  let region =
    floor(
      random(6)
    );


  let anchorX;
  let anchorY;

  let angle;


  // ----------------------------------------
  // UPPER LEFT
  // ----------------------------------------

  if (region === 0) {

    anchorX =
      minX +
      w *
      random(
        0.18,
        0.38
      );


    anchorY =
      minY +
      h *
      random(
        0.12,
        0.34
      );


    angle =
      random(
        -2.8,
        -2.1
      );
  }


  // ----------------------------------------
  // UPPER RIGHT
  // ----------------------------------------

  else if (region === 1) {

    anchorX =
      minX +
      w *
      random(
        0.62,
        0.84
      );


    anchorY =
      minY +
      h *
      random(
        0.12,
        0.36
      );


    angle =
      random(
        -1.0,
        -0.25
      );
  }


  // ----------------------------------------
  // MIDDLE LEFT
  // ----------------------------------------

  else if (region === 2) {

    anchorX =
      minX +
      w *
      random(
        0.12,
        0.34
      );


    anchorY =
      minY +
      h *
      random(
        0.38,
        0.62
      );


    angle =
      random(
        2.55,
        3.35
      );
  }


  // ----------------------------------------
  // MIDDLE RIGHT
  // ----------------------------------------

  else if (region === 3) {

    anchorX =
      minX +
      w *
      random(
        0.64,
        0.88
      );


    anchorY =
      minY +
      h *
      random(
        0.38,
        0.64
      );


    angle =
      random(
        -0.35,
        0.45
      );
  }


  // ----------------------------------------
  // LOWER LEFT
  // ----------------------------------------

  else if (region === 4) {

    anchorX =
      minX +
      w *
      random(
        0.18,
        0.44
      );


    anchorY =
      minY +
      h *
      random(
        0.66,
        0.88
      );


    angle =
      random(
        1.8,
        2.55
      );
  }


  // ----------------------------------------
  // LOWER RIGHT
  // ----------------------------------------

  else {

    anchorX =
      minX +
      w *
      random(
        0.56,
        0.82
      );


    anchorY =
      minY +
      h *
      random(
        0.66,
        0.88
      );


    angle =
      random(
        0.55,
        1.25
      );
  }


  // ----------------------------------------
  // MAIN SMEAR
  // ----------------------------------------

  activeDrag = {

    ax:
      anchorX,

    ay:
      anchorY,

    angle:
      angle,

    distance:
      0,

    radius:
      random(
        mainRadiusMin,
        mainRadiusMax
      ),

    strength:
      random(
        0.85,
        1.1
      )
  };


  // ----------------------------------------
  // SECONDARY SMEAR
  // ----------------------------------------

  secondaryDrag = {

    ax:
      anchorX +
      random(
        -45,
        45
      ),

    ay:
      anchorY +
      random(
        -45,
        45
      ),

    angle:
      angle +
      random(
        -0.45,
        0.45
      ),

    distance:
      0,

    radius:
      random(
        secondaryRadiusMin,
        secondaryRadiusMax
      ),

    strength:
      random(
        0.25,
        0.45
      )
  };
}


/* ----------------------------------------
   UPDATE BREATH
---------------------------------------- */

function updateBreath() {

  if (letters.length === 0) {
    return;
  }


  let letter =
    letters[0];


  // ----------------------------------------
  // LEVEL ABOVE AMBIENT
  // ----------------------------------------

  let aboveAmbient =
    max(
      smoothLevel -
      ambientLevel,
      0
    );


  // ----------------------------------------
  // MORE RESPONSIVE PHONE MAPPING
  // ----------------------------------------

  breathLevel =
    map(
      aboveAmbient,
      stopThreshold,
      startThreshold * 2.2,
      0,
      1
    );


  breathLevel =
    constrain(
      breathLevel,
      0,
      1
    );


  breathLevel =
    pow(
      breathLevel,
      0.85
    );


  // ----------------------------------------
  // START NEW BREATH
  // ----------------------------------------

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


  // ----------------------------------------
  // STOP BREATH
  // ----------------------------------------

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
      quietFrames >
      10
    ) {

      isBlowing =
        false;


      quietFrames =
        0;


      breathBase =
        [];


      activeDrag =
        null;


      secondaryDrag =
        null;


      return;
    }
  }


  if (
    !isBlowing ||
    !activeDrag ||
    !secondaryDrag ||
    breathBase.length === 0
  ) {

    return;
  }


  // ----------------------------------------
  // ADVANCE SMEAR
  // ----------------------------------------

  activeDrag.distance +=
    breathLevel *
    dragSpeed *
    activeDrag.strength;


  secondaryDrag.distance +=
    breathLevel *
    dragSpeed *
    secondaryDrag.strength;


  // ----------------------------------------
  // CALCULATE PROPOSED SHAPE FIRST
  // ----------------------------------------

  let proposedTargets = [];


  for (
    let i = 0;
    i <
    letter.points.length;
    i++
  ) {

    let base =
      breathBase[i];


    let targetX =
      base.x;


    let targetY =
      base.y;


    // ========================================
    // MAIN SMEAR
    // ========================================

    let mainDX =
      base.x -
      activeDrag.ax;


    let mainDY =
      base.y -
      activeDrag.ay;


    let mainDistance =
      sqrt(
        mainDX *
        mainDX +
        mainDY *
        mainDY
      );


    let mainInfluence =
      Math.exp(
        -(
          mainDistance *
          mainDistance
        ) /
        (
          2 *
          activeDrag.radius *
          activeDrag.radius
        )
      );


    mainInfluence =
      pow(
        mainInfluence,
        1.25
      );


    targetX +=
      cos(
        activeDrag.angle
      ) *
      activeDrag.distance *
      mainInfluence;


    targetY +=
      sin(
        activeDrag.angle
      ) *
      activeDrag.distance *
      mainInfluence;


    // ========================================
    // SECONDARY SMEAR
    // ========================================

    let secondaryDX =
      base.x -
      secondaryDrag.ax;


    let secondaryDY =
      base.y -
      secondaryDrag.ay;


    let secondaryDistance =
      sqrt(
        secondaryDX *
        secondaryDX +
        secondaryDY *
        secondaryDY
      );


    let secondaryInfluence =
      Math.exp(
        -(
          secondaryDistance *
          secondaryDistance
        ) /
        (
          2 *
          secondaryDrag.radius *
          secondaryDrag.radius
        )
      );


    secondaryInfluence =
      pow(
        secondaryInfluence,
        1.35
      );


    targetX +=
      cos(
        secondaryDrag.angle
      ) *
      secondaryDrag.distance *
      secondaryInfluence;


    targetY +=
      sin(
        secondaryDrag.angle
      ) *
      secondaryDrag.distance *
      secondaryInfluence;


    // ----------------------------------------
    // SUBTLE LOCAL SMEAR VARIATION
    // ----------------------------------------

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
      breathLevel *
      mainInfluence *
      2.5;


    targetY +=
      variationY *
      breathLevel *
      mainInfluence *
      2.5;


    proposedTargets.push({

      x:
        targetX,

      y:
        targetY
    });
  }


  // ----------------------------------------
  // ONE GLOBAL SAFE SCALE
  // ----------------------------------------

  let safeScale =
    getSafeDeformationScale(
      breathBase,
      proposedTargets
    );


  // ----------------------------------------
  // APPLY SAFE DEFORMATION
  // ----------------------------------------

  for (
    let i = 0;
    i <
    letter.points.length;
    i++
  ) {

    let p =
      letter.points[i];


    let base =
      breathBase[i];


    let proposed =
      proposedTargets[i];


    let dx =
      proposed.x -
      base.x;


    let dy =
      proposed.y -
      base.y;


    let safeTargetX =
      base.x +
      dx *
      safeScale;


    let safeTargetY =
      base.y +
      dy *
      safeScale;


    p.hx =
      lerp(
        p.hx,
        safeTargetX,
        0.14
      );


    p.hy =
      lerp(
        p.hy,
        safeTargetY,
        0.14
      );
  }
}


/* ----------------------------------------
   SAFE DEFORMATION SCALE
---------------------------------------- */

function getSafeDeformationScale(
  basePoints,
  targetPoints
) {

  let scale =
    1;


  for (
    let i = 0;
    i <
    basePoints.length;
    i++
  ) {

    let base =
      basePoints[i];


    let target =
      targetPoints[i];


    let dx =
      target.x -
      base.x;


    let dy =
      target.y -
      base.y;


    // ----------------------------------------
    // LEFT
    // ----------------------------------------

    if (dx < 0) {

      let available =
        base.x -
        screenMargin;


      if (available <= 0) {

        scale =
          0;

      } else {

        scale =
          min(
            scale,
            available /
            -dx
          );
      }
    }


    // ----------------------------------------
    // RIGHT
    // ----------------------------------------

    if (dx > 0) {

      let available =
        width -
        screenMargin -
        base.x;


      if (available <= 0) {

        scale =
          0;

      } else {

        scale =
          min(
            scale,
            available /
            dx
          );
      }
    }


    // ----------------------------------------
    // TOP
    // ----------------------------------------

    if (dy < 0) {

      let available =
        base.y -
        screenMargin;


      if (available <= 0) {

        scale =
          0;

      } else {

        scale =
          min(
            scale,
            available /
            -dy
          );
      }
    }


    // ----------------------------------------
    // BOTTOM
    // ----------------------------------------

    if (dy > 0) {

      let available =
        height -
        screenMargin -
        base.y;


      if (available <= 0) {

        scale =
          0;

      } else {

        scale =
          min(
            scale,
            available /
            dy
          );
      }
    }
  }


  return constrain(
    scale,
    0,
    1
  );
}


/* ----------------------------------------
   PHYSICS
---------------------------------------- */

function updatePhysics() {

  if (letters.length === 0) {
    return;
  }


  let letter =
    letters[0];


  let nextPositions =
    [];


  // ----------------------------------------
  // CALCULATE NEXT FRAME
  // ----------------------------------------

  for (let p of letter.points) {

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


  // ----------------------------------------
  // GLOBAL SAFE PHYSICS SCALE
  // ----------------------------------------

  let physicsScale =
    1;


  for (
    let i = 0;
    i <
    letter.points.length;
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


    // LEFT

    if (dx < 0) {

      let available =
        p.x -
        screenMargin;


      if (available <= 0) {

        physicsScale =
          0;

      } else {

        physicsScale =
          min(
            physicsScale,
            available /
            -dx
          );
      }
    }


    // RIGHT

    if (dx > 0) {

      let available =
        width -
        screenMargin -
        p.x;


      if (available <= 0) {

        physicsScale =
          0;

      } else {

        physicsScale =
          min(
            physicsScale,
            available /
            dx
          );
      }
    }


    // TOP

    if (dy < 0) {

      let available =
        p.y -
        screenMargin;


      if (available <= 0) {

        physicsScale =
          0;

      } else {

        physicsScale =
          min(
            physicsScale,
            available /
            -dy
          );
      }
    }


    // BOTTOM

    if (dy > 0) {

      let available =
        height -
        screenMargin -
        p.y;


      if (available <= 0) {

        physicsScale =
          0;

      } else {

        physicsScale =
          min(
            physicsScale,
            available /
            dy
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


  // ----------------------------------------
  // APPLY NEXT FRAME
  // ----------------------------------------

  for (
    let i = 0;
    i <
    letter.points.length;
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


/* ----------------------------------------
   DRAW WORD
---------------------------------------- */

function drawWord() {

  noStroke();

  fill(col);


  for (let letter of letters) {

    drawLetter(
      letter
    );
  }
}


/* ----------------------------------------
   DRAW LETTER
---------------------------------------- */

function drawLetter(
  letter
) {

  if (
    letter.contours.length === 0
  ) {

    return;
  }


  beginShape();


  for (
    let p
    of letter.contours[0]
  ) {

    vertex(
      p.x,
      p.y
    );
  }


  for (
    let i = 1;
    i <
    letter.contours.length;
    i++
  ) {

    beginContour();


    for (
      let p
      of letter.contours[i]
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


/* ----------------------------------------
   START AUDIO
---------------------------------------- */

async function startAudio() {

  if (audioStarted) {
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

          echoCancellation: false,

          noiseSuppression: false,

          autoGainControl: false
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

  }

  catch (error) {

    console.error(
      "Microphone error:",
      error
    );
  }
}


/* ----------------------------------------
   BEGIN CALIBRATION
---------------------------------------- */

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


/* ----------------------------------------
   UPDATE CALIBRATION
---------------------------------------- */

function updateCalibration() {

  if (!isCalibrating) {
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


  console.log(
    "Ambient:",
    ambientLevel
  );


  console.log(
    "Start threshold:",
    startThreshold
  );


  console.log(
    "Stop threshold:",
    stopThreshold
  );
}


/* ----------------------------------------
   MIC LEVEL
---------------------------------------- */

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


  let sum =
    0;


  for (
    let i = 0;
    i <
    audioData.length;
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


/* ----------------------------------------
   OPTIONAL DEBUG
---------------------------------------- */

function drawAudioDebug() {

  noStroke();

  fill(0);

  textSize(14);

  textAlign(
    LEFT,
    TOP
  );


  if (!audioStarted) {

    text(
      "tap to start microphone",
      20,
      20
    );

    return;
  }


  if (isCalibrating) {

    text(
      "calibrating...",
      20,
      20
    );

    return;
  }


  text(
    "level: " +
    smoothLevel.toFixed(4),
    20,
    20
  );


  text(
    "ambient: " +
    ambientLevel.toFixed(4),
    20,
    40
  );


  text(
    "breath: " +
    breathLevel.toFixed(2),
    20,
    60
  );


  text(
    isBlowing
      ? "BLOWING"
      : "waiting",
    20,
    80
  );
}


/* ----------------------------------------
   START MICROPHONE
---------------------------------------- */

function mousePressed() {

  if (!audioStarted) {

    startAudio();
  }
}


function touchStarted() {

  if (!audioStarted) {

    startAudio();
  }


  return false;
}


/* ----------------------------------------
   RESIZE
---------------------------------------- */

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );


  buildWord();


  isBlowing =
    false;


  quietFrames =
    0;


  breathBase =
    [];


  activeDrag =
    null;


  secondaryDrag =
    null;
}
