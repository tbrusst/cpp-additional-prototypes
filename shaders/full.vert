precision mediump float;
attribute vec2 position;
varying vec2 v_texCoord;

void main() {
  vec2 texFlipped = (vec2(position.x, position.y * -1.) + 1.) / 2.;
  v_texCoord = texFlipped;
  gl_Position = vec4(position, 0, 1);
}