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

  ctx.beginPath();

  let startX = width / 2.0;
  let startY = 0;
  let angle = Math.PI / 6.0;
  let lineWidth = 8.0; // adjust initial thickness
  const targetAngle = (Math.random() - 0.5) * (Math.PI / 3); // random small bias
  const stepScale = 2.0 + Math.random() * 2.0; // step length multiplier

  ctx.moveTo(startX, startY);
  ctx.lineWidth = lineWidth;

  // add a subtle glow for the lightning
  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(255,255,255,0.9)';

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
      ctx.strokeStyle = genLightningColor(lineWidth);
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      drawBranch(nextX, nextY, targetAngle + (Math.random() - 0.5) * 2.5, lineWidth * (0.4 + Math.random() * 0.6));
      ctx.beginPath();
      ctx.moveTo(nextX, nextY); // move back after branch
      ctx.lineWidth = lineWidth;
    }
  }

  ctx.strokeStyle = genLightningColor(lineWidth);
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // final ImageData
  const imageData = ctx.getImageData(0, 0, width, height);

  // decide shake intensity from maxLineWidthSeen (0..1)
  const shakeIntensity = Math.max(0, Math.min(1, maxLineWidthSeen / 12));

  return {
    imageData: imageData,
    shakeIntensity: shakeIntensity
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
        ctx.strokeStyle = genLightningColor(line_width);
        ctx.lineWidth = line_width;
        ctx.stroke();

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

    ctx.strokeStyle = genLightningColor(line_width);
    ctx.lineWidth = line_width;
    ctx.stroke();
  }
}
