#version 300 es
precision highp float;
precision highp sampler2D;
precision highp isampler2D;

in vec2 fragCoord;
in vec2 texCoord;

in vec2 texCoordX0Yp; // up
in vec2 texCoordX0Ym; // down

uniform sampler2D precipFeedbackTex;

uniform vec2 resolution;
uniform vec2 texelSize;
uniform float iterNum;

out vec4 lightningLocation;

uniform float dryLapse;

#include "common.glsl"

void main()
{
  // lightningLocation = vec4(0.5, 0.5, 150, 0); // test
  // return;

  vec4 newLightningLocation = texelFetch(precipFeedbackTex, ivec2(1, 0), 0); // read pixel 1,0 where precipitation writes lightning candidates

  float candidateIter = floor(newLightningLocation[START_ITERNUM] + 0.5);
  float strikeX = clamp(newLightningLocation.x, 0.0, 1.0);
  float strikeY = clamp(newLightningLocation.y, 0.0, 1.0);
  float strikeIntensity = clamp(newLightningLocation[INTENSITY], 0.0, 4.6);

  if (candidateIter < max(iterNum - 1.0, 1.0) || candidateIter > iterNum || strikeIntensity < 0.35) {
    discard; // no new lightning strike, so no update
  }

  lightningLocation = vec4(strikeX, strikeY, candidateIter, strikeIntensity);
}
