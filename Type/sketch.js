let font;

let letters = [];
let word = "a";

let col = "#d11515";
let fontSize = 350;


// --------------------------------------------------
// PHYSICS
// --------------------------------------------------

let springK = 0.125;
let damping = 0.85;


// --------------------------------------------------
// DEFORMATION
// --------------------------------------------------

let dragSpeed = 0.9;

// Broader than before = softer / more fluid
let mainRadiusMin = 145;
let mainRadiusMax = 195;

let secondaryRadiusMin = 120;
let secondaryRadiusMax = 165;


// Fluid propagation along the contour
let fluidPasses = 3;
let fluidBlend = 0.24;


// --------------------------------------------------
// SAFE AREA
// --------------------------------------------------

let canvasPaddingX = 20;
let canvasPaddingTop = 20;
let canvasPaddingBottom = 20;


// --------------------------------------------------
// AUDIO
// --------------------------------------------------

let audioContext;
let analyser;
let microphone;
let audioData;

let micLevel = 0;
let smoothLevel = 0;

let audioStarted = false;


// --------------------------------------------------
// CALIBRATION
// --------------------------------------------------

let isCalibrating = false;
let calibrationStartTime = 0;

let calibrationDuration = 1200;

let calibrationSamples = [];
let ambientLevel = 0;

let calibrated = false;


// --------------------------------------------------
// BREATH DETECTION
// --------------------------------------------------

let breathLevel = 0;

let startThreshold = 0;
let stopThreshold = 0;


// --------------------------------------------------
// BREATH
// --------------------------------------------------

let isBlowing = false;
let quietFrames = 0;

let breathBase = [];

let activeDrag = null;
let secondaryDrag = null;


// --------------------------------------------------
// AUTO CHANGE DIRECTION
// --------------------------------------------------

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


  buildWord();
}


// ==================================================
// DRAW
// ==================================================

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


  // Uncomment if you want to see mic values:
  // drawAudioDebug();
}


// ==================================================
// RESPONSIVE SIZE
// ==================================================

function getResponsiveFontSize() {

  if (width < 500) {

    return width * 0.88;
  }


  return 350;
}


// ==================================================
// VISIBLE HEIGHT
// Safari can report a different visual viewport
// ==================================================

function getVisibleHeight() {

  if (window.visualViewport) {

    return window.visualViewport.height;
  }


  return window.innerHeight;
}


// ==================================================
// BUILD WORD
// ==================================================

function buildWord() {

  letters = [];


  fontSize =
    getResponsiveFontSize();


  textFont(font);

  textSize(fontSize);


  // Build the A at a safe temporary position.

  let letter =
    buildLetter(
      word,
      0,
      fontSize
    );


  if (
    !letter ||
    letter.points.length === 0
  ) {

    return;
  }


  // ------------------------------------------
  // Actual glyph bounds
  // ------------------------------------------

  let minX = Infinity;
  let maxX = -Infinity;

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


    maxY =
      max(
        maxY,
        p.hy
      );
  }


  // ------------------------------------------
  // Horizontal centering
  // ------------------------------------------

  let glyphWidth =
    maxX - minX;


  let desiredLeft =
    (
      width -
      glyphWidth
    ) / 2;


  let shiftX =
    desiredLeft -
    minX;


  // ------------------------------------------
  // Bottom positioning
  // ------------------------------------------

  let bottomGap =
    width < 500
      ? 15
      : 20;


  let visibleHeight =
    min(
      height,
      getVisibleHeight()
    );


  let desiredBottom =
    visibleHeight -
    bottomGap;


  let shiftY =
    desiredBottom -
    maxY;


  // ------------------------------------------
  // Apply positioning
  // ------------------------------------------

  for (let p of letter.points) {

    p.hx += shiftX;
    p.hy += shiftY;

    p.x += shiftX;
    p.y += shiftY;
  }


  letters.push(letter);
}


// ==================================================
// BUILD LETTER
// ==================================================

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
      fontSize,
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
// AVAILABLE SPACE
// ==================================================

function getAvailableSpace(letter) {

  let bounds =
    getLetterBounds(
      letter
    );


  return {

    left:
      bounds.minX -
      canvasPaddingX,


    right:
      width -
      canvasPaddingX -
      bounds.maxX,


    top:
      bounds.minY -
      canvasPaddingTop,


    bottom:
      min(
        height,
        getVisibleHeight()
      ) -
      canvasPaddingBottom -
      bounds.maxY
  };
}


// ==================================================
// CHOOSE DEFORMATION REGION
//
// Uses actual free space so the A doesn't become
// stuck after several breaths.
// ==================================================

function chooseRegion(letter) {

  let space =
    getAvailableSpace(
      letter
    );


  let regions = [

    // upper-left
    {
      id: 0,

      score:
        max(
          space.left,
          0
        ) +
        max(
          space.top,
          0
        )
    },


    // upper-right
    {
      id: 1,

      score:
        max(
          space.right,
          0
        ) +
        max(
          space.top,
          0
        )
    },


    // middle-left
    {
      id: 2,

      score:
        max(
          space.left,
          0
        ) * 2
    },


    // middle-right
    {
      id: 3,

      score:
        max(
          space.right,
          0
        ) * 2
    },


    // lower-left
    {
      id: 4,

      score:
        max(
          space.left,
          0
        ) +
        max(
          space.bottom,
          0
        )
    },


    // lower-right
    {
      id: 5,

      score:
        max(
          space.right,
          0
        ) +
        max(
          space.bottom,
          0
        )
    }
  ];


  // Avoid repeating the previous area.

  let available =
    regions.filter(
      r =>
        r.id !== lastRegion &&
        r.score > 10
    );


  // If space is becoming tight,
  // allow more regions.

  if (
    available.length === 0
  ) {

    available =
      regions.filter(
        r =>
          r.score > 5
      );
  }


  // Final fallback.

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


  // Prefer directions with meaningful room.

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
// BEGIN BREATH / NEW SMEAR
// ==================================================

function beginBreath(letter) {

  breathBase = [];


  for (let p of letter.points) {

    breathBase.push({

      x:
        p.hx,

      y:
        p.hy
    });
  }


  let bounds =
    getLetterBounds(
      letter
    );


  let minX =
    bounds.minX;

  let minY =
    bounds.minY;

  let w =
    bounds.w;

  let h =
    bounds.h;


  let region =
    chooseRegion(
      letter
    );


  lastRegion =
    region;


  let anchorX;
  let anchorY;
  let angle;


  // ------------------------------------------
  // UPPER LEFT
  // More upward movement than before
  // ------------------------------------------

  if (
    region === 0
  ) {

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
        -2.45,
        -1.55
      );
  }


  // ------------------------------------------
  // UPPER RIGHT
  // ------------------------------------------

  else if (
    region === 1
  ) {

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
        -1.55,
        -0.65
      );
  }


  // ------------------------------------------
  // MIDDLE LEFT
  // ------------------------------------------

  else if (
    region === 2
  ) {

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


  // ------------------------------------------
  // MIDDLE RIGHT
  // ------------------------------------------

  else if (
    region === 3
  ) {

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


  // ------------------------------------------
  // LOWER LEFT
  // ------------------------------------------

  else if (
    region === 4
  ) {

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


  // ------------------------------------------
  // LOWER RIGHT
  // ------------------------------------------

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


  // ------------------------------------------
  // MAIN SMEAR
  // ------------------------------------------

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


  // ------------------------------------------
  // SECONDARY SMEAR
  // ------------------------------------------

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


  // ------------------------------------------
  // Breath strength
  // ------------------------------------------

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


  // ------------------------------------------
  // Start breath
  // ------------------------------------------

  if (
    !isBlowing &&
    aboveAmbient >
    startThreshold
  ) {

    isBlowing =
      true;


    quietFrames =
      0;


    blockedFrames =
      0;


    beginBreath(
      letter
    );
  }


  // ------------------------------------------
  // Stop breath
  // ------------------------------------------

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


      blockedFrames =
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


  // ------------------------------------------
  // Advance smear
  // ------------------------------------------

  activeDrag.distance +=
    breathLevel *
    dragSpeed *
    activeDrag.strength;


  secondaryDrag.distance +=
    breathLevel *
    dragSpeed *
    secondaryDrag.strength;


  // ------------------------------------------
  // Calculate target shape
  // ------------------------------------------

  let proposedTargets =
    [];


  for (
    let i = 0;
    i < letter.points.length;
    i++
  ) {

    let base =
      breathBase[i];


    let targetX =
      base.x;


    let targetY =
      base.y;


    // ----------------------------------------
    // MAIN SMEAR
    // ----------------------------------------

    let mainDX =
      base.x -
      activeDrag.ax;


    let mainDY =
      base.y -
      activeDrag.ay;


    let mainDistance =
      sqrt(
        mainDX * mainDX +
        mainDY * mainDY
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


    // Lower exponent =
    // broader, softer propagation.

    mainInfluence =
      pow(
        mainInfluence,
        0.95
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


    // ----------------------------------------
    // SECONDARY SMEAR
    // ----------------------------------------

    let secondaryDX =
      base.x -
      secondaryDrag.ax;


    let secondaryDY =
      base.y -
      secondaryDrag.ay;


    let secondaryDistance =
      sqrt(
        secondaryDX * secondaryDX +
        secondaryDY * secondaryDY
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
    // SMALL ORGANIC VARIATION
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


    // Reduced from 2.5 to 1.5.
    // This keeps the contour cleaner.

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

      x:
        targetX,

      y:
        targetY
    });
  }


  // ------------------------------------------
  // NEW:
  // FLUID PROPAGATION
  // ------------------------------------------

  proposedTargets =
    smoothFluidTargets(
      letter,
      proposedTargets
    );


  // ------------------------------------------
  // Safe deformation
  // ------------------------------------------

  let safeScale =
    getSafeDeformationScale(
      breathBase,
      proposedTargets
    );


  // ------------------------------------------
  // Detect blocked direction earlier
  // ------------------------------------------

  if (
    safeScale <
    0.15
  ) {

    blockedFrames++;

  } else {

    blockedFrames =
      0;
  }


  // ------------------------------------------
  // Same breath can move into another region
  // ------------------------------------------

  if (
    blockedFrames >=
    blockedFramesBeforeNewDrag
  ) {

    blockedFrames =
      0;


    beginBreath(
      letter
    );


    return;
  }


  // ------------------------------------------
  // Apply target
  // ------------------------------------------

  for (
    let i = 0;
    i < letter.points.length;
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
// FLUID TARGET SMOOTHING
//
// Important:
// This smooths the MOTION of neighboring contour
// points, not the original shape of the A.
// ==================================================

function smoothFluidTargets(
  letter,
  targets
) {

  let result =
    targets.map(
      pt => ({
        x: pt.x,
        y: pt.y
      })
    );


  // Point object -> index in letter.points

  let pointIndex =
    new Map();


  for (
    let i = 0;
    i < letter.points.length;
    i++
  ) {

    pointIndex.set(
      letter.points[i],
      i
    );
  }


  // ------------------------------------------
  // Multiple gentle smoothing passes
  // ------------------------------------------

  for (
    let pass = 0;
    pass < fluidPasses;
    pass++
  ) {

    let previous =
      result.map(
        pt => ({
          x: pt.x,
          y: pt.y
        })
      );


    for (
      let contour
      of letter.contours
    ) {

      let count =
        contour.length;


      if (
        count < 3
      ) {

        continue;
      }


      for (
        let j = 0;
        j < count;
        j++
      ) {

        let previousPoint =
          contour[
            (
              j -
              1 +
              count
            ) %
            count
          ];


        let currentPoint =
          contour[j];


        let nextPoint =
          contour[
            (
              j +
              1
            ) %
            count
          ];


        let previousIndex =
          pointIndex.get(
            previousPoint
          );


        let currentIndex =
          pointIndex.get(
            currentPoint
          );


        let nextIndex =
          pointIndex.get(
            nextPoint
          );


        let averageX =
          (
            previous[previousIndex].x +
            previous[currentIndex].x * 2 +
            previous[nextIndex].x
          ) / 4;


        let averageY =
          (
            previous[previousIndex].y +
            previous[currentIndex].y * 2 +
            previous[nextIndex].y
          ) / 4;


        result[currentIndex].x =
          lerp(
            previous[currentIndex].x,
            averageX,
            fluidBlend
          );


        result[currentIndex].y =
          lerp(
            previous[currentIndex].y,
            averageY,
            fluidBlend
          );
      }
    }
  }


  return result;
}


// ==================================================
// SAFE DEFORMATION SCALE
// ==================================================

function getSafeDeformationScale(
  basePoints,
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
      getVisibleHeight()
    ) -
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
      base.x;


    let dy =
      target.y -
      base.y;


    // ----------------------------------------
    // LEFT
    // ----------------------------------------

    if (
      dx < 0
    ) {

      let available =
        base.x -
        leftBoundary;


      if (
        available <= 0
      ) {

        safeScale =
          0;

      } else {

        safeScale =
          min(
            safeScale,
            available /
            -dx
          );
      }
    }


    // ----------------------------------------
    // RIGHT
    // ----------------------------------------

    if (
      dx > 0
    ) {

      let available =
        rightBoundary -
        base.x;


      if (
        available <= 0
      ) {

        safeScale =
          0;

      } else {

        safeScale =
          min(
            safeScale,
            available /
            dx
          );
      }
    }


    // ----------------------------------------
    // TOP
    // ----------------------------------------

    if (
      dy < 0
    ) {

      let available =
        base.y -
        topBoundary;


      if (
        available <= 0
      ) {

        safeScale =
          0;

      } else {

        safeScale =
          min(
            safeScale,
            available /
            -dy
          );
      }
    }


    // ----------------------------------------
    // BOTTOM
    // ----------------------------------------

    if (
      dy > 0
    ) {

      let available =
        bottomBoundary -
        base.y;


      if (
        available <= 0
      ) {

        safeScale =
          0;

      } else {

        safeScale =
          min(
            safeScale,
            available /
            dy
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


  let nextPositions =
    [];


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


  // ------------------------------------------
  // Safe physics
  // ------------------------------------------

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
      getVisibleHeight()
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


    // LEFT

    if (
      dx < 0
    ) {

      let available =
        p.x -
        leftBoundary;


      if (
        available <= 0
      ) {

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

    if (
      dx > 0
    ) {

      let available =
        rightBoundary -
        p.x;


      if (
        available <= 0
      ) {

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

    if (
      dy < 0
    ) {

      let available =
        p.y -
        topBoundary;


      if (
        available <= 0
      ) {

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

    if (
      dy > 0
    ) {

      let available =
        bottomBoundary -
        p.y;


      if (
        available <= 0
      ) {

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


  // ------------------------------------------
  // Apply physics
  // ------------------------------------------

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
    let letter
    of letters
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


  // Outer contour

  for (
    let p
    of letter.contours[0]
  ) {

    vertex(
      p.x,
      p.y
    );
  }


  // Inner contours / holes

  for (
    let i = 1;
    i < letter.contours.length;
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
// CALIBRATION
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


  let sum =
    0;


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
// OPTIONAL AUDIO DEBUG
// ==================================================

function drawAudioDebug() {

  noStroke();

  fill(0);

  textSize(14);

  textAlign(
    LEFT,
    TOP
  );


  if (
    !audioStarted
  ) {

    text(
      "tap to start microphone",
      20,
      20
    );

    return;
  }


  if (
    isCalibrating
  ) {

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


// ==================================================
// START MICROPHONE FROM USER GESTURE
// ==================================================

function mousePressed() {

  if (
    !audioStarted
  ) {

    startAudio();
  }
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


// Safari's visible viewport can change when
// its browser bars appear/disappear.

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


// ==================================================
// RESET BREATH STATE
// ==================================================

function resetBreathState() {

  isBlowing =
    false;


  quietFrames =
    0;


  blockedFrames =
    0;


  breathBase =
    [];


  activeDrag =
    null;


  secondaryDrag =
    null;


  lastRegion =
    -1;
}
