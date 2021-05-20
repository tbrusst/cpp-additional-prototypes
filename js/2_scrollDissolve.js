import * as dat from 'dat.gui';
const createRegl = require('regl');

import frag from '../shaders/2_frag.frag';

import fullVert from '../shaders/full.vert';
import skullImage from '../images/skulls-illo.png';

const gui = new dat.GUI();

const data = {
  animateGrain: true,
  grainAmount: 0.15,
  noiseSpeed: 0.05,
  noiseFreq: 18,
  maskLowEnd: 0.89,
  maskHighEnd: 1,
  bkColor: [250, 250, 250],
  maskClamp: 0.5,
  maskGradient: 0.61,
  maskEdgeColor: [165, 0, 255],
  maskEdgeSize: 0.1,
};

gui.add(data, 'animateGrain');
gui.add(data, 'grainAmount', 0, 1);
gui.add(data, 'noiseSpeed', 0, 10);
gui.add(data, 'noiseFreq', 0, 100);
gui.add(data, 'maskLowEnd', 0, 1);
gui.add(data, 'maskHighEnd', 0, 1);
gui.add(data, 'maskClamp', 0, 10);
gui.add(data, 'maskGradient', 0.1, 2);
gui.add(data, 'maskEdgeSize', 0, 1);

gui.addColor(data, 'bkColor');
gui.addColor(data, 'maskEdgeColor');

let scrollTarget = 0;
let scrollPos = 0;

let imageLoaded = false;
let imageTexture;

var image = new Image();
image.src = skullImage;
image.onload = function () {
  imageLoaded = true;
  imageTexture = regl.texture(image);
};

function lerp(position, targetPosition, speed = 0.2) {
  return position + ((targetPosition - position) / 2) * speed;
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
    u_scroll: () => scrollPos / window.innerHeight,
    u_image: () => imageTexture,
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
  scrollTarget = window.scrollY;
  scrollPos = lerp(scrollPos, scrollTarget);

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
