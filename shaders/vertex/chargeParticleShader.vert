#version 300 es
precision highp float;

in vec3 particleData; // x, y, sign

uniform vec2 aspectRatios;
uniform vec3 view;
uniform float Xmult;

out float vSign;

void main()
{
  vec2 pos = vec2(particleData.x, particleData.y);
  pos.x = mod(pos.x, 1.0);

  vec2 world;
  world.x = (-pos.x * 2.0 + 1.0) * Xmult;
  world.y = -pos.y * 2.0 * aspectRatios.x + aspectRatios.x;

  vec2 clip;
  clip.x = (world.x + view.x) * view.z;
  clip.y = (world.y + view.y) * view.z;

  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = max(8.0, 11.0 * view.z);
  vSign = particleData.z;
}
