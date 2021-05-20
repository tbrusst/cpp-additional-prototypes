import * as dat from 'dat.gui';
const createRegl = require('regl');

import frag from '../shaders/1_frag.frag';
import fullVert from '../shaders/full.vert';
import skullImage from '../images/skulls-illo.png';

const gui = new dat.GUI();

const data = {
  animateGrain: true,
  grainAmount: 0.15,
  noiseSpeed: 0.1,
  noiseFreq: 18,
  maskLowEnd: 0.7,
  maskHighEnd: 0.85,
  bkColor: [45, 36, 27],
  maskClamp: 2,
  maskGradient: 0.5,
};

gui.add(data, 'animateGrain');
gui.add(data, 'grainAmount', 0, 1);
gui.add(data, 'noiseSpeed', 0, 10);
gui.add(data, 'noiseFreq', 0, 100);
gui.add(data, 'maskLowEnd', 0, 1);
gui.add(data, 'maskHighEnd', 0, 1);
gui.add(data, 'maskClamp', 0, 10);
gui.add(data, 'maskGradient', 0.1, 2);

gui.addColor(data, 'bkColor');

let mouseTarget = [0, 0];
let mousePos = [0, 0];

let imageLoaded = false;
let imageTexture;

var image = new Image();
image.src = skullImage;
image.onload = function () {
  imageLoaded = true;
  imageTexture = regl.texture(image);
};

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
    u_maskClamp: () => data.maskClamp,
    u_maskGradient: () => data.maskGradient,
    u_mouse: () => mousePos,
    u_image: () => imageTexture,
    u_bkColor: () => data.bkColor.map((n) => n / 255),
  },
  primitive: 'triangle strip',
  count: 4,
});

// -----------
// Animation Loop
// -----------

function update() {
  // update mouse
  lerp(mousePos, mouseTarget);

  // Do webgl Draw call
  if (imageLoaded) {
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
