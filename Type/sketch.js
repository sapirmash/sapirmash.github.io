
let font;


// ==================================================
// ALPHABET
// ==================================================

let alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

let currentLetterIndex = 0;


// ==================================================
// LETTER
// ==================================================

let letters = [];

let col = "#ffffff";

let fontSize = 350;


// ==================================================
// PHYSICS
// ==================================================

let springK = 0.125;
let damping = 0.85;


// ==================================================
// DEFORMATION
// ==================================================

let dragSpeed = 1.25;

let mainRadiusMin = 145;
let mainRadiusMax = 195;

let secondaryRadiusMin = 120;
let secondaryRadiusMax = 165;


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

let isMobile =
  /iPhone|iPad|iPod|Android/i.test(
    navigator.userAgent
  );


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
    "Rubik-ExtraBold.ttf"
  );


  buildWord();
}


// ==================================================
// DRAW
// ==================================================

function draw() {


  background(0);


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

  drawBoundaryGuide();

  drawNavigation();

}


// ==================================================
// CURRENT LETTER
// ==================================================

function getCurrentLetter() {

  return alphabet[
    currentLetterIndex
  ];
}


// ==================================================
// RESPONSIVE FONT SIZE
// ==================================================

function getResponsiveFontSize() {

  let currentLetter =
    getCurrentLetter();


  let maxSize =
    width < 500
      ? width * 0.7935
      : 462.875;


  textFont(font);

  textSize(maxSize);


  let availableWidth =
    width - 80;


  let measuredWidth =
    textWidth(
      currentLetter
    );


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
// SAFARI VISIBLE BOTTOM
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
// BUILD WORD
// ==================================================

function buildWord() {
  letters = [];


  fontSize =
    getResponsiveFontSize();


  textFont(font);

  textSize(fontSize);


  let currentLetter =
    getCurrentLetter();


  let letter =
    buildLetter(
      currentLetter,
      0,
      fontSize
    );


  if (
    !letter ||
    letter.points.length === 0
  ) {

    return;
  }


  // ------------------------------------------------
  // ACTUAL GLYPH BOUNDS
  // ------------------------------------------------

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


  // ------------------------------------------------
  // CENTER HORIZONTALLY
  // ------------------------------------------------

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


  // ------------------------------------------------
  // PLACE GLYPH DIRECTLY ON VISIBLE BOTTOM
  // ------------------------------------------------

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


  // ------------------------------------------------
  // APPLY POSITION
  // ------------------------------------------------

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


    for (let p of roundContour(contour)) {

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
        getVisibleBottom()
      ) -
      canvasPaddingBottom -
      bounds.maxY
  };
}


// ==================================================
// CHOOSE REGION
// ==================================================

function chooseRegion(letter) {

  let space =
    getAvailableSpace(
      letter
    );


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

  breathBase = [];


  for (let p of letter.points) {

    breathBase.push({

      x: p.hx,
      y: p.hy
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


  // ------------------------------------------------
  // UPPER LEFT
  // ------------------------------------------------

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
  }


  // ------------------------------------------------
  // UPPER RIGHT
  // ------------------------------------------------

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
  }


  // ------------------------------------------------
  // MIDDLE LEFT
  // ------------------------------------------------

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

  }


  // ------------------------------------------------
  // MIDDLE RIGHT
  // ------------------------------------------------

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

  }


  // ------------------------------------------------
  // LOWER LEFT
  // ------------------------------------------------

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
  }


  // ------------------------------------------------
  // LOWER RIGHT
  // ------------------------------------------------

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
  }

  // ------------------------------------------------
// DIRECTION FROM IMPACT POSITION
// ------------------------------------------------

// Center of the current letter

let centerX =
  minX + w * 0.5;

let centerY =
  minY + h * 0.5;


// Direction from the center of the letter
// toward the point where the breath landed

let directionX =
  anchorX - centerX;

let directionY =
  anchorY - centerY;


// Convert that direction into an angle

angle =
  atan2(
    directionY,
    directionX
  );


// Add only a TINY amount of variation
// so the result doesn't feel mechanical

angle +=
  random(
    -0.12,
    0.12
  );


  // ------------------------------------------------
  // MAIN SMEAR
  // ------------------------------------------------

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


  // ------------------------------------------------
  // SECONDARY SMEAR
  // ------------------------------------------------

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


  // ------------------------------------------------
  // BREATH STRENGTH
  // ------------------------------------------------

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


// ------------------------------------------------
// DEVICE-SPECIFIC BREATH RESPONSE
// ------------------------------------------------

if (isMobile) {

  // iPhone / mobile:
  // expand the compressed microphone range

  breathLevel =
    map(
      breathLevel,
      0.60,
      1.0,
      0.05,
      1.0
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
      1.15
    );

} else {

  // Desktop:
  // keep the original response

  breathLevel =
    pow(
      breathLevel,
      0.85
    );
}


  // ------------------------------------------------
  // START BREATH
  // ------------------------------------------------

  if (
    !isBlowing &&
    aboveAmbient >
      startThreshold
  ) {

    isBlowing = true;

    quietFrames = 0;
    blockedFrames = 0;

    beginBreath(
      letter
    );
  }


  // ------------------------------------------------
  // STOP BREATH
  // ------------------------------------------------

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


// ------------------------------------------------
// ADVANCE SMEAR
// Breath strength affects deformation amount
// ------------------------------------------------

// Create more separation between
// weak, medium and strong breaths.

let breathPower =
  pow(
    breathLevel,
    1.6
  );


// Weak breath  → slower deformation
// Strong breath → much faster deformation

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


  // ------------------------------------------------
  // ORIGINAL BOTTOM OF CURRENT BREATH
  // ------------------------------------------------

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


  // ------------------------------------------------
  // CALCULATE ORGANIC TARGET SHAPE
  // ------------------------------------------------

  let proposedTargets = [];


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


    // ----------------------------------------------
    // MAIN SMEAR
    // ----------------------------------------------

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


    // ----------------------------------------------
    // SECONDARY SMEAR
    // ----------------------------------------------

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


    // ----------------------------------------------
    // SMALL ORGANIC VARIATION
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


  // ------------------------------------------------
  // KEEP WHOLE ORGANIC SHAPE ON BASELINE
  //
  // No points are pinned.
  // The shape is translated as one unit vertically.
  // ------------------------------------------------

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


  // Limit each point independently. Contact on one side must not stop
  // points that can still move elsewhere inside the canvas.
  const bounds=deformationBounds();
  let requested=0,available=0;
  for(let i=0;i<letter.points.length;i++){
    const p=letter.points[i],target=proposedTargets[i];
    const x=constrain(target.x,bounds.left,bounds.right);
    const y=constrain(target.y,bounds.top,bounds.bottom);
    requested+=Math.hypot(target.x-p.hx,target.y-p.hy);
    available+=Math.hypot(x-p.hx,y-p.hy);
    p.hx=lerp(p.hx,x,.11);
    p.hy=lerp(p.hy,y,.11);
  }
  // Choose another region only when this entire gesture runs out of room.
  if(requested>letter.points.length*.05 && available/requested<.08)blockedFrames++;
  else blockedFrames=0;
  if(blockedFrames>=blockedFramesBeforeNewDrag){blockedFrames=0;beginBreath(letter);}
}
function deformationBounds(){
  return {left:canvasPaddingX,right:width-canvasPaddingX,top:canvasPaddingTop,
    bottom:Math.min(height,getVisibleBottom())-canvasPaddingBottom};
}


// ==================================================
// PHYSICS
// ==================================================

function updatePhysics() {
  if(!letters.length)return;
  const bounds=deformationBounds();
  for(const p of letters[0].points){
    p.vx=(p.vx+(p.hx-p.x)*springK)*damping;
    p.vy=(p.vy+(p.hy-p.y)*springK)*damping;
    const x=p.x+p.vx,y=p.y+p.vy;
    p.x=constrain(x,bounds.left,bounds.right);
    p.y=constrain(y,bounds.top,bounds.bottom);
    // Stop only the outward component at contact, preserving sliding and
    // all other points' motion. Inward motion stays free on the next frame.
    if(x<bounds.left || x>bounds.right)p.vx=0;
    if(y<bounds.top || y>bounds.bottom)p.vy=0;
  }
}


// ==================================================
// DRAW WORD
// ==================================================

function drawWord() {
  const ctx = drawingContext;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (const letter of letters) for (const pts of letter.contours) {
    if (!pts.length) continue;
    const last=pts[pts.length-1],first=pts[0];
    ctx.moveTo((last.x+first.x)/2,(last.y+first.y)/2);
    for (let i=0;i<pts.length;i++) {
      const p=pts[i],next=pts[(i+1)%pts.length];
      ctx.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2);
    }
    ctx.closePath();
  }
  // Nonzero fill merges overlapping glyph parts without carving false holes.
  ctx.fill('nonzero');
  ctx.restore();
}

// Smooth evenly spaced vector points once when constructing the letter.
function roundContour(contour) {
  if (contour.length<3) return contour;
  const samples=[];
  const lengths=contour.map((p,i)=>{
    const q=contour[(i+1)%contour.length];return Math.hypot(q.x-p.x,q.y-p.y);
  });
  const total=lengths.reduce((a,b)=>a+b,0);
  if (!total) return contour;
  const count=Math.max(12,Math.ceil(total/2));
  const spacing=total/count;
  let segment=0,start=0;
  for(let i=0;i<count;i++){
    const at=i*spacing;
    while(segment<lengths.length-1 && start+lengths[segment]<at){start+=lengths[segment++];}
    const p=contour[segment],q=contour[(segment+1)%contour.length];
    const t=lengths[segment] ? (at-start)/lengths[segment] : 0;
    samples.push({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});
  }
  const sigma=Math.min(7,fontSize*0.018),radius=Math.ceil(3*sigma/spacing);
  return samples.map((_,i)=>{
    let x=0,y=0,sum=0;
    for(let k=-radius;k<=radius;k++){
      const weight=Math.exp(-0.5*(k*spacing/sigma)**2);
      const p=samples[((i+k)%count+count)%count];
      x+=p.x*weight;y+=p.y*weight;sum+=weight;
    }
    return {x:x/sum,y:y/sum};
  });
}

function strokeLetter(ctx, letter, color, thickness) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const contour of letter.contours) {
    if (!contour.length) continue;
    ctx.moveTo(contour[0].x, contour[0].y);
    for (let i = 1; i < contour.length; i++) ctx.lineTo(contour[i].x, contour[i].y);
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}


// ==================================================
// NAVIGATION LAYOUT
// ==================================================

function getNavigationLayout() {

  let buttonSize =
    width < 500
      ? 28
      : 32;

  let margin =
    width < 500
      ? 16
      : 24;

  let visibleBottom =
    min(
      height,
      getVisibleBottom()
    );

  // Bottom of buttons = bottom of letter
  let buttonY =
  visibleBottom -
  buttonSize -
  2;

  return {

    buttonSize:
      buttonSize,

    margin:
      margin,

    radius:
      7,

    leftX:
      margin,

    rightX:
      width -
      margin -
      buttonSize,

    y:
      buttonY
  };
}


// ==================================================
// DRAW NAVIGATION
// ==================================================

function drawNavigation() {

  let nav =
    getNavigationLayout();


  push();

  noFill();

  stroke(255);

  strokeWeight(1.5);

  strokeCap(ROUND);

  strokeJoin(ROUND);


  // LEFT BUTTON

  rect(
    nav.leftX,
    nav.y,
    nav.buttonSize,
    nav.buttonSize,
    nav.radius
  );


  drawArrow(
    nav.leftX +
      nav.buttonSize / 2,

    nav.y +
      nav.buttonSize / 2,

    -1,

    nav.buttonSize
  );


  // RIGHT BUTTON

  rect(
    nav.rightX,
    nav.y,
    nav.buttonSize,
    nav.buttonSize,
    nav.radius
  );


  drawArrow(
    nav.rightX +
      nav.buttonSize / 2,

    nav.y +
      nav.buttonSize / 2,

    1,

    nav.buttonSize
  );


  pop();
}


// ==================================================
// DRAW ARROW
// ==================================================

function drawArrow(
  cx,
  cy,
  direction,
  buttonSize
) {

  let shaft =
    buttonSize * 0.30;


  let head =
    buttonSize * 0.11;


  let startX =
    cx -
    direction *
    shaft / 2;


  let endX =
    cx +
    direction *
    shaft / 2;


  line(
    startX,
    cy,
    endX,
    cy
  );


  line(
    endX,
    cy,

    endX -
      direction *
      head,

    cy -
      head
  );


  line(
    endX,
    cy,

    endX -
      direction *
      head,

    cy +
      head
  );
}


// ==================================================
// NEXT LETTER
// ==================================================

function nextLetter() {

  currentLetterIndex =
    (
      currentLetterIndex + 1
    ) %
    alphabet.length;


  buildWord();

  resetBreathState();
}


// ==================================================
// PREVIOUS LETTER
// ==================================================

function previousLetter() {

  currentLetterIndex--;


  if (
    currentLetterIndex < 0
  ) {

    currentLetterIndex =
      alphabet.length - 1;
  }


  buildWord();

  resetBreathState();
}


// ==================================================
// NAVIGATION HIT TEST
// ==================================================

function navigationHitTest() {

  let nav =
    getNavigationLayout();


  let extra =
    width < 500
      ? 10
      : 4;


  // LEFT

  if (
    mouseX >=
      nav.leftX - extra &&

    mouseX <=
      nav.leftX +
      nav.buttonSize +
      extra &&

    mouseY >=
      nav.y - extra &&

    mouseY <=
      nav.y +
      nav.buttonSize +
      extra
  ) {

    previousLetter();

    return true;
  }


  // RIGHT

  if (
    mouseX >=
      nav.rightX - extra &&

    mouseX <=
      nav.rightX +
      nav.buttonSize +
      extra &&

    mouseY >=
      nav.y - extra &&

    mouseY <=
      nav.y +
      nav.buttonSize +
      extra
  ) {

    nextLetter();

    return true;
  }


  return false;
}


// ==================================================
// KEYBOARD NAVIGATION
// ==================================================

function keyPressed() {

  if (
    keyCode === RIGHT_ARROW
  ) {

    nextLetter();

    return false;
  }


  if (
    keyCode === LEFT_ARROW
  ) {

    previousLetter();

    return false;
  }
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
// MOUSE / TOUCH
// ==================================================

function mousePressed() {

  if (
    navigationHitTest()
  ) {

    return false;
  }


  if (
    !audioStarted
  ) {

    startAudio();
  }


  return false;
}


function touchStarted() {

  if (
    navigationHitTest()
  ) {

    return false;
  }


  if (
    !audioStarted
  ) {

    startAudio();
  }


  return false;
}


// ==================================================
// RESET BREATH
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


  breathLevel =
    0;
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
// SAFARI VISUAL VIEWPORT
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

// Preview guide: the same limits used by deformation and physics.
function drawBoundaryGuide() {
  const ctx=drawingContext;
  const left=canvasPaddingX,right=width-canvasPaddingX;
  const top=canvasPaddingTop,bottom=Math.min(height,getVisibleBottom())-canvasPaddingBottom;
  ctx.save();
  ctx.strokeStyle='#ff7070';
  ctx.lineWidth=1;
  ctx.setLineDash([6,5]);
  // Keep the bottom stroke visible when the limit coincides with the canvas edge.
  ctx.strokeRect(left,top,right-left,Math.min(bottom,height-.5)-top);
  ctx.setLineDash([]);
  ctx.fillStyle='#ff7070';
  ctx.font='11px system-ui';
  ctx.fillText('DEFORMATION BOUNDARY',left+8,top+17);
  ctx.restore();
}
