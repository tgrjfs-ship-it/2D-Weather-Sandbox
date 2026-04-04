#version 300 es
precision highp float;

in float vSign;
out vec4 fragmentColor;

void main()
{
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);
  if (d > 1.0)
    discard;

  float horiz = smoothstep(0.30, 0.05, abs(uv.y)) * smoothstep(1.0, 0.0, abs(uv.x));
  float vert = smoothstep(0.30, 0.05, abs(uv.x)) * smoothstep(1.0, 0.0, abs(uv.y));
  float symbol = vSign > 0.0 ? max(horiz, vert) : horiz;
  if (symbol < 0.02)
    discard;

  float edgeFade = smoothstep(1.0, 0.45, d);
  vec3 col = vSign > 0.0 ? vec3(1.0, 0.45, 0.45) : vec3(0.45, 0.75, 1.0);
  float a = symbol * edgeFade * 0.92;
  fragmentColor = vec4(col, a);
}
