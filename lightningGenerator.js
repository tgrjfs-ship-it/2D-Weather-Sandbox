onmessage = (event) => {
  const msg = event.data;
  // console.log(msg);
  let imgElement = generateLightningBolt(msg.width, msg.height, msg.branchStrength || 1.0);
  postMessage(imgElement);
};


function generateLightningBolt(width, height, branchStrength = 1.0)
{
  const lightningCanvas = new OffscreenCanvas(width, height);
  const ctx = lightningCanvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);


  function genLightningColor(lineWidth, alpha = 1.0)
  {
    const brightness = Math.min(255, 80 + Math.pow(lineWidth, 1.35) * 22);
    const glowBoost = Math.min(255, brightness * 1.15);
    return `rgba(${glowBoost}, ${glowBoost}, 255, ${alpha})`;
  }


  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 14;
  ctx.shadowColor = 'rgba(180, 210, 255, 0.95)';
  ctx.beginPath();

  let startX = width / 2.0;
  let startY = 0;
  let angle = Math.PI / 6.;
  let lineWidth = 6.4;
  const targetAngle = 0.0;

  ctx.moveTo(startX, startY);

  ctx.lineWidth = lineWidth;

  while (startY < height) {

    const stepLength = 7.0 + Math.random() * 11.0;
    const nextX = startX + Math.sin(angle) * stepLength;
    const nextY = startY + Math.cos(angle) * stepLength;

    angle += (Math.random() - 0.5) * (1.15 + branchStrength * 0.55);

    angle -= (angle - targetAngle) * 0.08; // keep it going in a general direction

    ctx.lineTo(nextX, nextY);

    startX = nextX;
    startY = nextY;


    ctx.lineWidth = Math.max(1.4, lineWidth * (1.0 - nextY / height * 0.55));

    if (Math.random() < (0.028 + branchStrength * 0.018) * (1. - nextY / height * 0.55)) { // branch
      ctx.strokeStyle = genLightningColor(lineWidth, 0.9);
      ctx.stroke();
      drawBranch(nextX, nextY, targetAngle + (Math.random() - 0.5) * (2.4 + branchStrength * 0.9), Math.max(1.15, lineWidth * mapBranchWidth(nextY / height)));
      ctx.beginPath();
      ctx.moveTo(nextX, nextY); // move back to last position after drawing branch
      ctx.lineWidth = lineWidth;
    }
  }
  ctx.strokeStyle = genLightningColor(lineWidth, 0.95);
  ctx.stroke();


  const output = ctx.getImageData(0, 0, width, height);
  const data = output.data;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = Math.max(data[i], data[i + 1], data[i + 2]);
    const alpha = data[i + 3];

    if (alpha < 10 || luminance < 12) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    } else {
      data[i] = luminance;
      data[i + 1] = luminance;
      data[i + 2] = 255;
      data[i + 3] = Math.min(255, Math.max((luminance - 20) * 2, alpha));
    }
  }

  return output;


  function mapBranchWidth(heightRatio) { return 0.34 + (1.0 - heightRatio) * 0.30 * branchStrength; }

  function drawBranch(startX, startY, targetAngle, line_width)
  {
    let angle = targetAngle;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineWidth = line_width;

    while (startY < height) {

      const stepLength = 5.0 + Math.random() * (7.0 + branchStrength * 1.8);
      const nextX = startX + Math.sin(angle) * stepLength;
      const nextY = startY + Math.cos(angle) * stepLength;

      angle += (Math.random() - 0.5) * (0.8 + branchStrength * 0.35);

      angle -= (angle - targetAngle) * 0.08; // keep it going in a general direction

      ctx.lineTo(nextX, nextY);

      startX = nextX;
      startY = nextY;

      if (Math.random() < 0.022) { // reduce width

        ctx.strokeStyle = genLightningColor(line_width, 0.75);
        ctx.stroke();
        line_width -= 0.22;

        if (line_width < 0.1)
          return;

        if (Math.random() < 0.16 + branchStrength * 0.08) { // recursive branch

          drawBranch(nextX, nextY, targetAngle + (Math.random() - 0.5) * (1.6 + branchStrength * 0.45), Math.max(0.35, line_width * 0.92));
        }

        ctx.beginPath();
        ctx.moveTo(nextX, nextY); // move back to last position after drawing branch
        ctx.lineWidth = line_width;
      }
    }
    ctx.strokeStyle = genLightningColor(line_width, 0.75);
    ctx.stroke();
  }
}