import * as dat from 'dat.gui';
const createRegl = require('regl');

import frag from '../shaders/3_frag.frag';
import fullVert from '../shaders/full.vert';
import image1Src from '../images/vein-texture.png';
import image2Src from '../images/bg.png';

// E3E2DC

const gui = new dat.GUI();

const data = {
  animateGrain: true,
  grainAmount: 0.15,
  noiseSpeed: 0,
  noiseFreq: 1,
  maskLowEnd: 0.85,
  maskHighEnd: 0.85,
  bkColor: [57, 48, 42],
  maskGradient: 0.5,
  maskEdgeColor: [227, 226, 220],
  maskEdgeSize: 0.1,
};

gui.add(data, 'animateGrain');
gui.add(data, 'grainAmount', 0, 1);
gui.add(data, 'noiseSpeed', 0, 10);
gui.add(data, 'noiseFreq', 0, 100);
gui.add(data, 'maskLowEnd', 0, 1);
gui.add(data, 'maskHighEnd', 0, 1);
gui.add(data, 'maskGradient', 0.1, 2);
gui.add(data, 'maskEdgeSize', 0, 1);

gui.addColor(data, 'bkColor');
gui.addColor(data, 'maskEdgeColor');

let mouseTarget = [0, 0];
let mousePos = [0, 0];

let imageLoaded1 = false;
let imageTexture1;
let imageLoaded2 = false;
let imageTexture2;

var image1 = new Image();
var image2 = new Image();

image1.onload = function () {
  imageLoaded1 = true;
  imageTexture1 = regl.texture(image1);
};
image2.onload = function () {
  imageLoaded2 = true;
  imageTexture2 = regl.texture(image2);
};

image1.src = image1Src;
image2.src = image2Src;

const mouse = createMouse({
  onMove: () => {
    mouseTarget = mouse.position;
  },
});

function lerp(position, targetPosition, speed = 0.1) {
  position[0] += ((targetPosition[0] - position[0]) / 2) * speed;
  position[1] += ((targetPosition[1] - position[1]) / 2) * speed;
}
function lerpSimple(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}
function createMouse(opts = {}) {
  const mouse = {
    moved: false,
    position: [0, 0],
    dispose,
  };

  window.addEventListener('mousemove', move);

  return mouse;

  function move(ev) {
    const cx = ev.clientX || 0;
    const cy = ev.clientY || 0;
    mouse.position = [cx, cy];
    if (opts.onMove) opts.onMove();
  }

  function dispose() {
    window.removeEventListener('mousemove', move);
  }
}

const regl = createRegl({ canvas: canvas });

canvas.setAttribute('width', window.innerWidth);
canvas.setAttribute('height', window.innerHeight);

const drawQuad = regl({
  frag: frag,
  vert: fullVert,
  attributes: {
    position: (context, props) =>
      regl.buffer([
        [1, -1],
        [1, 1],
        [-1, -1],
        [-1, 1],
      ]),
  },

  uniforms: {
    u_resolution: [window.innerWidth, window.innerHeight],
    u_screenDimensions: [window.innerWidth, window.innerHeight],
    u_time: (context, props, batchId) => context.time,
    u_noiseFreq: () => data.noiseFreq,
    u_noiseSpeed: () => data.noiseSpeed,
    u_maskLowEnd: () => data.maskLowEnd,
    u_maskHighEnd: () => data.maskHighEnd,
    u_animateGrain: () => data.animateGrain,
    u_grainAmount: () => data.grainAmount,
    u_maskGradient: () => data.maskGradient,
    u_mouse: () => mousePos,
    u_image1: () => imageTexture1,
    u_image2: () => imageTexture2,
    u_bkColor: () => data.bkColor.map((n) => n / 255),
    u_maskEdgeColor: () => data.maskEdgeColor.map((n) => n / 255),
    u_maskEdgeSize: () => data.maskEdgeSize,
  },
  primitive: 'triangle strip',
  count: 4,
});

// -----------
// Animation Loop
// -----------

function update() {
  // update mouse
  if (mouseTarget[0] > window.innerWidth / 2) {
    lerp(mousePos, [window.innerWidth, window.innerHeight / 2]);
  } else {
    lerp(mousePos, [0, window.innerHeight / 2]);
  }

  // Do webgl Draw call
  if (imageLoaded1 && imageLoaded2) {
    regl.poll();
    regl.clear({
      color: [1, 1, 1, 0],
    });
    drawQuad();
  }

  // animation loop
  requestAnimationFrame(update);
}
requestAnimationFrame(update);
