let font;
let letters = [];
let col = "#ffffff";


// ==================================================
// PHYSICS — ORIGINAL
// ==================================================

let springK = 0.125;
let damping = 0.85;


// ==================================================
// ORIGINAL DEFORMATION
// ==================================================

let dragSpeed = 1.25;

let mainRadiusMin = 145;
let mainRadiusMax = 195;

let secondaryRadiusMin = 120;
let secondaryRadiusMax = 165;


// ==================================================
// CANVAS
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

let activeDrag = null;
let secondaryDrag = null;


// ==================================================
// REGION / BOUNDARY LOGIC
// ==================================================

let blockedFrames = 0;
let blockedFramesBeforeNewDrag = 5;

let lastRegion = -1;


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

  buildLetter();
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
}


// ==================================================
// VISIBLE MOBILE VIEWPORT
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

  let currentLetter = "A";

  let maxSize =
    width < 500
      ? width * 0.88
      : 350;

  textFont(font);
  textSize(maxSize);

  let availableWidth =
    width - 80;

  let measuredWidth =
    textWidth(currentLetter);

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
// BUILD LETTER
// ==================================================

function buildLetter() {

  letters = [];

  let char = "A";

  let fontSize =
    getResponsiveFontSize();


  let contours =
    font.textToContours(
      char,
      0,
      0,
      fontSize,
      {
        sampleFactor: 0.35,
        simplifyThreshold: 0
      }
    );


  if (
    !contours ||
    contours.length === 0
  ) {

    return;
  }


  // --------------------------------------------------
  // FIND ORIGINAL BOUNDS
  // --------------------------------------------------

  let minX = Infinity;
  let maxX = -Infinity;

  let minY = Infinity;
  let maxY = -Infinity;


  for (let contour of contours) {

    for (let p of contour) {

      minX = min(minX, p.x);
      maxX = max(maxX, p.x);

      minY = min(minY, p.y);
      maxY = max(maxY, p.y);
    }
  }


  let glyphWidth =
    maxX - minX;


  // --------------------------------------------------
  // CENTER HORIZONTALLY
  // --------------------------------------------------

  let desiredLeft =
    (
      width -
      glyphWidth
    ) / 2;


  let shiftX =
    desiredLeft -
    minX;


  // --------------------------------------------------
  // PLACE ON BOTTOM
  // --------------------------------------------------

  let visibleBottom =
    min(
      height,
      getVisibleBottom()
    );


  let desiredBottom =
    visibleBottom;


  let shiftY =
    desiredBottom -
    maxY;


  // --------------------------------------------------
  // CREATE POINTS
  // --------------------------------------------------

  let processedContours = [];
  let allPoints = [];


  for (let contour of contours) {

    let pts = [];


    for (let p of contour) {

      let finalX =
        p.x + shiftX;


      let finalY =
        p.y + shiftY;


      let pt = {

        hx: finalX,
        hy: finalY,

        x: finalX,
        y: finalY,

        vx: 0,
        vy: 0
      };


      pts.push(pt);

      allPoints.push(pt);
    }


    processedContours.push(
      pts
    );
  }


  letters.push({

    char: char,

    contours:
      processedContours,

    points:
      allPoints
  });


  resetBreathState();
}


// ==================================================
// AVAILABLE SPACE
// ==================================================

function getAvailableSpace(letter) {

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


  let visibleBottom =
    min(
      height,
      getVisibleBottom()
    );


  return {

    left:
      minX -
      canvasPaddingX,

    right:
      width -
      canvasPaddingX -
      maxX,

    top:
      minY -
      canvasPaddingTop,

    bottom:
      visibleBottom -
      canvasPaddingBottom -
      maxY,

    minX,
    maxX,
    minY,
    maxY
  };
}


// ==================================================
// CHOOSE REGION
// ==================================================

function chooseRegion(letter) {

  let space =
    getAvailableSpace(letter);


  let regions = [

    {
      id: 0,
      score:
        max(space.left, 0) +
        max(space.top, 0)
    },

    {
      id: 1,
      score:
        max(space.right, 0) +
        max(space.top, 0)
    },

    {
      id: 2,
      score:
        max(space.left, 0) * 2
    },

    {
      id: 3,
      score:
        max(space.right, 0) * 2
    },

    {
      id: 4,
      score:
        max(space.left, 0) +
        max(space.bottom, 0)
    },

    {
      id: 5,
      score:
        max(space.right, 0) +
        max(space.bottom, 0)
    }
  ];


  let available =
    regions.filter(
      r =>
        r.id !== lastRegion &&
        r.score > 10
    );


  if (
    available.length === 0
  ) {

    available =
      regions.filter(
        r =>
          r.score > 5
      );
  }


  if (
    available.length === 0
  ) {

    available =
      regions;
  }


  let maxScore =
    max(
      available.map(
        r => r.score
      )
    );


  let goodRegions =
    available.filter(
      r =>
        r.score >=
        maxScore * 0.55
    );


  if (
    goodRegions.length === 0
  ) {

    goodRegions =
      available;
  }


  let chosen =
    random(
      goodRegions
    );


  return chosen.id;
}


// ==================================================
// BEGIN BREATH
// ==================================================

function beginBreath(letter) {

  if (!letter) return;


  breathBase = [];


  for (let p of letter.points) {

    breathBase.push({

      x: p.hx,
      y: p.hy

    });
  }


  let space =
    getAvailableSpace(letter);


  let minX =
    space.minX;

  let maxX =
    space.maxX;

  let minY =
    space.minY;

  let maxY =
    space.maxY;


  let w =
    maxX - minX;

  let h =
    maxY - minY;


  let region =
    chooseRegion(letter);


  lastRegion =
    region;


  let anchorX;
  let anchorY;
  let angle;


  // ==================================================
  // ORIGINAL RANDOM REGION / DIRECTION LOGIC
  // ==================================================

  if (region === 0) {

    // UPPER LEFT

    anchorX =
      random(
        minX + w * 0.10,
        minX + w * 0.45
      );

    anchorY =
      random(
        minY + h * 0.05,
        minY + h * 0.40
      );

    angle =
      random(
        -2.45,
        -1.55
      );

  } else if (region === 1) {

    // UPPER RIGHT

    anchorX =
      random(
        minX + w * 0.55,
        minX + w * 0.90
      );

    anchorY =
      random(
        minY + h * 0.05,
        minY + h * 0.40
      );

    angle =
      random(
        -1.55,
        -0.65
      );

  } else if (region === 2) {

    // MIDDLE LEFT

    anchorX =
      random(
        minX + w * 0.05,
        minX + w * 0.40
      );

    anchorY =
      random(
        minY + h * 0.30,
        minY + h * 0.70
      );

    angle =
      random(
        -PI,
        -PI * 0.72
      );

  } else if (region === 3) {

    // MIDDLE RIGHT

    anchorX =
      random(
        minX + w * 0.60,
        minX + w * 0.95
      );

    anchorY =
      random(
        minY + h * 0.30,
        minY + h * 0.70
      );

    angle =
      random(
        -PI * 0.28,
        0
      );

  } else if (region === 4) {

    // LOWER LEFT

    anchorX =
      random(
        minX + w * 0.08,
        minX + w * 0.45
      );

    anchorY =
      random(
        minY + h * 0.62,
        minY + h * 0.92
      );

    angle =
      random(
        -PI,
        -PI * 0.60
      );

  } else {

    // LOWER RIGHT

    anchorX =
      random(
        minX + w * 0.55,
        minX + w * 0.92
      );

    anchorY =
      random(
        minY + h * 0.62,
        minY + h * 0.92
      );

    angle =
      random(
        -PI * 0.40,
        0
      );
  }


  // ==================================================
  // ORIGINAL MAIN DRAG
  // ==================================================

  activeDrag = {

    ax: anchorX,
    ay: anchorY,

    angle: angle,

    distance: 0,

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


  // ==================================================
  // ORIGINAL SECONDARY DRAG
  // ==================================================

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

    distance: 0,

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


  let aboveAmbient =
    max(
      smoothLevel -
      ambientLevel,
      0
    );


  // ==================================================
  // ORIGINAL MIC MAPPING
  // ==================================================

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


  // ==================================================
  // START BREATH
  // ==================================================

  if (
    !isBlowing &&
    aboveAmbient >
      startThreshold
  ) {

    isBlowing = true;

    quietFrames = 0;

    blockedFrames = 0;

    beginBreath(letter);
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

      quietFrames = 0;
    }


    if (
      quietFrames > 10
    ) {

      isBlowing = false;

      quietFrames = 0;

      blockedFrames = 0;

      breathBase = [];

      activeDrag = null;

      secondaryDrag = null;

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


  // ==================================================
  // ★ ONLY NEW CHANGE
  //
  // Make weak / medium / strong breaths produce
  // more noticeably different deformation speeds.
  //
  // Nothing else in the deformation changes.
  // ==================================================

  let breathPower =
    pow(
      breathLevel,
      1.6
    );


  let strengthMultiplier =
    lerp(
      0.35,
      2.0,
      breathPower
    );


  activeDrag.distance +=
    breathLevel *
    dragSpeed *
    strengthMultiplier *
    activeDrag.strength;


  secondaryDrag.distance +=
    breathLevel *
    dragSpeed *
    strengthMultiplier *
    secondaryDrag.strength;


  // ==================================================
  // ORIGINAL BASELINE
  // ==================================================

  let baseBottom =
    -Infinity;


  for (let pt of breathBase) {

    baseBottom =
      max(
        baseBottom,
        pt.y
      );
  }


  // ==================================================
  // ORIGINAL DEFORMATION
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


    // ------------------------------------------------
    // MAIN DRAG
    // ------------------------------------------------

    let mainDistance =
      dist(
        base.x,
        base.y,
        activeDrag.ax,
        activeDrag.ay
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
        0.95
      );


    let mainDX =
      cos(
        activeDrag.angle
      ) *
      activeDrag.distance;


    let mainDY =
      sin(
        activeDrag.angle
      ) *
      activeDrag.distance;


    // ------------------------------------------------
    // SECONDARY DRAG
    // ------------------------------------------------

    let secondaryDistance =
      dist(
        base.x,
        base.y,
        secondaryDrag.ax,
        secondaryDrag.ay
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
        1.08
      );


    let secondaryDX =
      cos(
        secondaryDrag.angle
      ) *
      secondaryDrag.distance;


    let secondaryDY =
      sin(
        secondaryDrag.angle
      ) *
      secondaryDrag.distance;


    // ------------------------------------------------
    // TARGET
    // ------------------------------------------------

    let targetX =
      base.x +
      mainDX *
      mainInfluence +
      secondaryDX *
      secondaryInfluence;


    let targetY =
      base.y +
      mainDY *
      mainInfluence +
      secondaryDY *
      secondaryInfluence;


    // ------------------------------------------------
    // ORIGINAL SUBTLE NOISE
    // ------------------------------------------------

    let variationX =
      map(
        noise(
          base.x * 0.003,
          base.y * 0.003,
          20
        ),
        0,
        1,
        -1,
        1
      );


    let variationY =
      map(
        noise(
          base.x * 0.003,
          base.y * 0.003,
          70
        ),
        0,
        1,
        -1,
        1
      );


    targetX +=
      variationX *
      breathLevel *
      mainInfluence *
      1.5;


    targetY +=
      variationY *
      breathLevel *
      mainInfluence *
      1.5;


    proposedTargets.push({

      x: targetX,
      y: targetY

    });
  }


  // ==================================================
  // ORIGINAL BASELINE CORRECTION
  //
  // NO individual points are pinned.
  // Move the whole proposed shape together.
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
  // SAFE SCALE
  // ==================================================

  let safeScale =
    getSafeDeformationScale(
      letter.points,
      proposedTargets
    );


  // ==================================================
  // BLOCKED DIRECTION
  // ==================================================

  if (
    safeScale < 0.15
  ) {

    blockedFrames++;

  } else {

    blockedFrames = 0;
  }


  if (
    blockedFrames >=
    blockedFramesBeforeNewDrag
  ) {

    blockedFrames = 0;

    beginBreath(letter);

    return;
  }


  // ==================================================
  // ORIGINAL TARGET EASING
  // ==================================================

  for (
    let i = 0;
    i < letter.points.length;
    i++
  ) {

    let p =
      letter.points[i];


    let base =
      breathBase[i];


    let target =
      proposedTargets[i];


    let safeTargetX =
      base.x +
      (
        target.x -
        base.x
      ) *
      safeScale;


    let safeTargetY =
      base.y +
      (
        target.y -
        base.y
      ) *
      safeScale;


    p.hx =
      lerp(
        p.hx,
        safeTargetX,
        0.11
      );


    p.hy =
      lerp(
        p.hy,
        safeTargetY,
        0.11
      );
  }
}


// ==================================================
// SAFE DEFORMATION SCALE
// ==================================================

function getSafeDeformationScale(
  basePoints,
  targetPoints
) {

  let safeScale = 1;


  let visibleBottom =
    min(
      height,
      getVisibleBottom()
    );


  let minAllowedX =
    canvasPaddingX;


  let maxAllowedX =
    width -
    canvasPaddingX;


  let minAllowedY =
    canvasPaddingTop;


  let maxAllowedY =
    visibleBottom -
    canvasPaddingBottom;


  for (
    let i = 0;
    i < basePoints.length;
    i++
  ) {

    let base =
      basePoints[i];


    let target =
      targetPoints[i];


    let dx =
      target.x -
      base.hx;


    let dy =
      target.y -
      base.hy;


    // LEFT

    if (
      target.x <
      minAllowedX &&
      dx < 0
    ) {

      let possible =
        (
          minAllowedX -
          base.hx
        ) /
        dx;


      safeScale =
        min(
          safeScale,
          possible
        );
    }


    // RIGHT

    if (
      target.x >
      maxAllowedX &&
      dx > 0
    ) {

      let possible =
        (
          maxAllowedX -
          base.hx
        ) /
        dx;


      safeScale =
        min(
          safeScale,
          possible
        );
    }


    // TOP

    if (
      target.y <
      minAllowedY &&
      dy < 0
    ) {

      let possible =
        (
          minAllowedY -
          base.hy
        ) /
        dy;


      safeScale =
        min(
          safeScale,
          possible
        );
    }


    // BOTTOM

    if (
      target.y >
      maxAllowedY &&
      dy > 0
    ) {

      let possible =
        (
          maxAllowedY -
          base.hy
        ) /
        dy;


      safeScale =
        min(
          safeScale,
          possible
        );
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

  for (let letter of letters) {

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


      p.vx += ax;
      p.vy += ay;


      p.vx *= damping;
      p.vy *= damping;


      p.x += p.vx;
      p.y += p.vy;
    }
  }
}


// ==================================================
// DRAW
// ==================================================

function drawWord() {

  noStroke();

  fill(col);


  for (
    let letter of letters
  ) {

    drawLetter(letter);
  }
}


function drawLetter(letter) {

  if (
    letter.contours.length === 0
  ) {

    return;
  }


  beginShape();


  // OUTER CONTOUR

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
// AUDIO
// ==================================================

async function startAudio() {

  if (audioStarted) return;


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


    audioStarted = true;


    beginCalibration();

  } catch (error) {

    console.error(
      "Microphone error:",
      error
    );
  }
}


// ==================================================
// MIC LEVEL
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
// CALIBRATION
// ==================================================

function beginCalibration() {

  isCalibrating = true;

  calibrated = false;

  calibrationSamples = [];

  calibrationStartTime =
    millis();

  ambientLevel = 0;

  smoothLevel = 0;
}


function updateCalibration() {

  if (!isCalibrating) return;


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
    (a, b) =>
      a - b
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


  isCalibrating = false;

  calibrated = true;
}


// ==================================================
// START MIC ON USER INTERACTION
// ==================================================

function mousePressed() {

  if (!audioStarted) {

    startAudio();
  }


  return false;
}


function touchStarted() {

  if (!audioStarted) {

    startAudio();
  }


  return false;
}


// ==================================================
// RESET BREATH
// ==================================================

function resetBreathState() {

  isBlowing = false;

  quietFrames = 0;

  breathLevel = 0;

  breathBase = [];

  activeDrag = null;

  secondaryDrag = null;

  blockedFrames = 0;

  lastRegion = -1;
}


// ==================================================
// RESIZE
// ==================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );


  if (font) {

    buildLetter();
  }
}
