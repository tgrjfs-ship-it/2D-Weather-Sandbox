onmessage = (event) => {
  const msg = event.data;
  // generate image + intensity and post back to main thread
  const result = generateLightningBolt(msg.width, msg.height);
  // Transfer the ImageData buffer for performance (if supported)
  try {
    postMessage(result, [result.imageData.data.buffer]);
  } catch (e) {
    postMessage(result);
  }
};

function generateLightningBolt(width, height) {
  const lightningCanvas = new OffscreenCanvas(width, height);
  const ctx = lightningCanvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  // visual params
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // track the maximum line width used so we can derive a shake intensity
  let maxLineWidthSeen = 0;
  let didStrike = false; // whether we actually drew any visible bolt

  function genLightningColor(lineWidth) {
    // Normalize lineWidth to [0,1] (assuming 0..12 typical range)
    const normalized = Math.max(0, Math.min(1, lineWidth / 12));
    // Use a non-linear brightness curve but keep values <= 1
    const brightness = Math.pow(normalized, 0.9) * 0.95 + 0.05;
    const colR = 255;
    const colG = 255;
    const colB = 255;
    // Use rgba so we can control alpha
    const alpha = Math.max(0.3, brightness);
    return `rgba(${Math.round(colR * brightness)}, ${Math.round(colG * brightness)}, ${Math.round(colB * brightness)}, ${alpha})`;
  }

  // helper to stroke current path with a glow + core so the bolt is visible
  function applyStroke(line_w) {
    // Glow pass (wider, soft)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = line_w * 2.6;
    ctx.shadowBlur = Math.max(6, line_w * 3);
    ctx.shadowColor = 'rgba(200,220,255,0.9)';
    ctx.strokeStyle = genLightningColor(line_w * 1.2);
    ctx.stroke();
    ctx.restore();

    // Core pass (thin, bright)
    ctx.save();
    ctx.lineWidth = line_w;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = genLightningColor(line_w);
    ctx.stroke();
    ctx.restore();

    maxLineWidthSeen = Math.max(maxLineWidthSeen, line_w);
    didStrike = true;
  }

  ctx.beginPath();

  let startX = width / 2.0;
  let startY = 0;
  let angle = Math.PI / 6.0;
  let lineWidth = 8.0; // adjust initial thickness
  // track initial width for shake intensity
  maxLineWidthSeen = Math.max(maxLineWidthSeen, lineWidth);
  const targetAngle = (Math.random() - 0.5) * (Math.PI / 3); // random small bias
  const stepScale = 2.0 + Math.random() * 2.0; // step length multiplier

  ctx.moveTo(startX, startY);
  ctx.lineWidth = lineWidth;

  while (startY < height) {
    // step length varies so bolt is more visible
    const step = stepScale * (0.8 + Math.random() * 1.4);
    const nextX = startX + Math.sin(angle) * step;
    const nextY = startY + Math.cos(angle) * step;

    angle += (Math.random() - 0.5) * 1.2; // wander
    angle -= (angle - targetAngle) * 0.08; // bias toward target

    ctx.lineTo(nextX, nextY);

    startX = nextX;
    startY = nextY;

    // occasionally branch
    if (Math.random() < 0.03 * (1.0 - nextY / height)) {
      // draw what we have so far (main path segment) with glow+core
      applyStroke(lineWidth);

      drawBranch(nextX, nextY, targetAngle + (Math.random() - 0.5) * 2.5, lineWidth * (0.4 + Math.random() * 0.6));

      // continue main path after branch
      ctx.beginPath();
      ctx.moveTo(nextX, nextY);
      ctx.lineWidth = lineWidth;
    }
  }

  // final stroke of the main bolt
  applyStroke(lineWidth);

  // final ImageData
  const imageData = ctx.getImageData(0, 0, width, height);

  // decide shake intensity from maxLineWidthSeen (0..1)
  // ensure a small shake if there was any lightning
  const shakeIntensity = didStrike ? Math.max(0.05, Math.min(1, maxLineWidthSeen / 12)) : 0;

  return {
    imageData: imageData,
    shakeIntensity: shakeIntensity,
    didStrike: didStrike
  };

  function drawBranch(startX, startY, branchTargetAngle, line_width) {
    let a = branchTargetAngle;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineWidth = line_width;

    // also locally track width seen for shake intensity
    maxLineWidthSeen = Math.max(maxLineWidthSeen, line_width);

    // branch draws shorter
    let branchSteps = 0;
    while (startY < height && branchSteps < 200) {
      const step = 1.0 + Math.random() * 1.6;
      const nextX = startX + Math.sin(a) * step;
      const nextY = startY + Math.cos(a) * step;

      a += (Math.random() - 0.5) * 0.8;
      a -= (a - branchTargetAngle) * 0.06; // bias

      ctx.lineTo(nextX, nextY);

      startX = nextX;
      startY = nextY;

      // occasionally decrease width and possibly branch again
      if (Math.random() < 0.02) {
        applyStroke(line_width);

        line_width *= (0.6 + Math.random() * 0.35); // shrink
        maxLineWidthSeen = Math.max(maxLineWidthSeen, line_width);

        if (line_width < 0.4) return;

        if (Math.random() < 0.12) {
          drawBranch(nextX, nextY, branchTargetAngle + (Math.random() - 0.5) * 1.4, line_width * 0.8);
        }

        ctx.beginPath();
        ctx.moveTo(nextX, nextY);
        ctx.lineWidth = line_width;
      }

      branchSteps++;
    }

    applyStroke(line_width);
  }
}
