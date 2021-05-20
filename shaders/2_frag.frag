precision mediump float;
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d) 

#define TWO_PI 6.28318530718

varying vec2 v_texCoord;

uniform float u_time;
uniform float u_noiseFreq;
uniform float u_noiseSpeed;
uniform vec2 u_resolution;
uniform vec2 u_screenDimensions;
uniform float u_scroll;
uniform bool u_animateGrain;
uniform float u_grainAmount;
uniform float u_maskLowEnd;
uniform float u_maskHighEnd;
uniform vec3 u_bkColor; 
uniform sampler2D u_image;
uniform float u_maskClamp;
uniform float u_maskGradient;
uniform float u_maskEdgeSize;
uniform vec3 u_maskEdgeColor;

float freq = u_noiseFreq;
float noiseTimeFactor = u_noiseSpeed;

float random( vec2 p )
{
  vec2 K1 = vec2(
  23.14069263277926, 
  2.665144142690225 
);
  return fract( cos( dot(p,K1) ) * 12345.6789 );
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x / u_resolution.x * 2. - 1., gl_FragCoord.y / u_resolution.x * 2. - u_resolution.y / u_resolution.x );


  // smooth step noise to make clearer blobs
  float noise = snoise3(vec3(uv.x * freq, uv.y * freq, u_time * noiseTimeFactor));
  float n = smoothstep(0.5, 0.6, noise / 2. + 0.5 );  

  vec2 center1A =  vec2(0, 0) + vec2(0, u_scroll * 2.);

  float distCenter1A = distance(uv, center1A );

  float pct1 = smoothstep(u_maskLowEnd, u_maskHighEnd, pow(distCenter1A, 1./u_maskGradient) * (u_maskClamp * u_scroll * 3.) + noise / 2. ) ;
  float pct2 = smoothstep(u_maskLowEnd - u_maskEdgeSize/2., u_maskHighEnd + u_maskEdgeSize/2., pow(distCenter1A, 1./u_maskGradient) * (u_maskClamp * u_scroll * 3.) + noise / 2. ) ;

  vec4 imageColor = texture2D(u_image, v_texCoord);
  vec3 maskEdgeColor = mix(u_maskEdgeColor, imageColor.brg, 0.5);
  // vec3 maskEdgeColor = imageColor.brg;

  vec3 bkHighlight =  mix(maskEdgeColor, u_bkColor,  pct2);

  vec4 maskedImage =  mix(imageColor, vec4(bkHighlight, 1.),  pct1);

  vec4 color = maskedImage;
  
  // add grain noise 
  vec2 uvRandom = uv;
  uvRandom.y *= random(vec2(uvRandom.y, u_time));

  float postNoise = u_animateGrain ?  random(uvRandom)  : random(uv);
  vec4 noiseColor = vec4( postNoise / 4.,  postNoise / 4., postNoise / 4., 1.) * u_grainAmount;




  gl_FragColor = color + noiseColor; 
}