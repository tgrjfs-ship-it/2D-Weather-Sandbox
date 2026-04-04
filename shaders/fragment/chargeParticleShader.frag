#version 300 es
precision highp float;

in float vSign;
out vec4 fragmentColor;

void main()
{
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = dot(uv, uv);
  if (d > 1.0)
    discard;

  vec3 col = vSign > 0.0 ? vec3(1.0, 0.45, 0.45) : vec3(0.45, 0.75, 1.0);
  float a = smoothstep(1.0, 0.2, d) * 0.85;
  fragmentColor = vec4(col, a);
}
