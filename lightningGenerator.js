// Worker: generates a lightning bolt and returns an ImageBitmap (fast transfer) + shake info.
// Optimizations made to reduce runtime work and avoid per-segment costly canvas state changes:
// - Build all polylines (main path + branches) into an in-memory list first.
// - Render in exactly two passes (glow pass and core pass) with minimal state changes.
// - Avoid repeated ctx.save()/ctx.restore() and avoid many per-segment stroke calls.
// - Prefer createImageBitmap(canvas) and transfer the bitmap (much faster than getImageData).
// - Cap branch recursion and step counts to keep generation bounded.

onmessage = async (event) => {
  const msg = event.data || {};
  const width = msg.width || 800;
  const height = msg.height || 600;

  try {
    const result = await generateLightningBolt(width, height);

    // Prefer transferring ImageBitmap (fast). If not available, fall back to imageData.
    if (result.imageBitmap) {
      // Transfer the ImageBitmap for best performance.
      postMessage(
        {
          imageBitmap: result.imageBitmap,
          shakeIntensity: result.shakeIntensity,
          didStrike: result.didStrike
        },
        // transferables array
        [result.imageBitmap]
      );
    } else {
      postMessage({
        imageData: result.imageData,
        shakeIntensity: result.shakeIntensity,
        didStrike: result.didStrike
      });
    }
  } catch (err) {
    // in case of unexpected error, return a no-op result
    postMessage({
      imageData: null,
      imageBitmap: null,
      shakeIntensity: 0,
      didStrike: false,
      error: (err && err.message) || String(err)
    });
  }
};

async function generateLightningBolt(width, height) {
  const lightningCanvas = new OffscreenCanvas(width, height);
  const ctx = lightningCanvas.getContext('2d');

  // clear
  ctx.clearRect(0, 0, width, height);

  // visual params
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // accumulators
  let maxLineWidthSeen = 0;
  let didStrike = false;

  // segments: each entry {points: [x,y,...], width}
  const segments = [];

  function addSegment(points, w) {
    if (!points || points.length < 4) return;
    segments.push({ points, width: Math.max(0.5, w) });
    maxLineWidthSeen = Math.max(maxLineWidthSeen, w);
    didStrike = true;
  }

  function genLightningColor(lineWidth) {
    const normalized = Math.max(0, Math.min(1, lineWidth / 12));
    const brightness = Math.pow(normalized, 0.9) * 0.95 + 0.05;
    const col = Math.round(255 * brightness);
    const alpha = Math.max(0.25, brightness);
    return `rgba(${col}, ${col}, ${col}, ${alpha})`;
  }

  // generation parameters (kept reasonable to avoid long loops)
  const MAX_MAIN_STEPS = Math.max(40, Math.floor(height / 4)); // cap main path steps
  const MAX_BRANCH_STEPS = 140;
  const BRANCH_CHANCE = 0.03;

  // generate main path points (accumulate into a single polyline)
  (function genMain() {
    const points = [];
    let x = width / 2.0;
    let y = 0;
    let angle = Math.PI / 6.0;
    let lineWidth = 8.0;
    const targetAngle = (Math.random() - 0.5) * (Math.PI / 3);
    const stepScale = 2.0 + Math.random() * 2.0;

    points.push(x, y);

    let steps = 0;
    while (y < height && steps < MAX_MAIN_STEPS) {
      const step = stepScale * (0.8 + Math.random() * 1.2);
      const nx = x + Math.sin(angle) * step;
      const ny = y + Math.cos(angle) * step;

      angle += (Math.random() - 0.5) * 1.0; // slightly reduced wander
      angle -= (angle - targetAngle) * 0.07;

      points.push(nx, ny);

      // occasionally spawn a branch from this point
      if (Math.random() < BRANCH_CHANCE * (1.0 - ny / height)) {
        // branch width relative to main
        const bw = lineWidth * (0.4 + Math.random() * 0.5);
        generateBranch(nx, ny, targetAngle + (Math.random() - 0.5) * 2.0, bw, 0);
      }

      x = nx; y = ny;
      steps++;
    }

    addSegment(points, lineWidth);
  })();

  // recursive branch generator that accumulates branch polylines into `segments`
  function generateBranch(startX, startY, branchTargetAngle, line_width, depth) {
    // depth cap to avoid explosion
    if (depth > 2) return;

    const points = [startX, startY];
    let a = branchTargetAngle;
    let x = startX, y = startY;
    let steps = 0;

    while (y < height && steps < MAX_BRANCH_STEPS) {
      const step = 1.0 + Math.random() * 1.6;
      const nx = x + Math.sin(a) * step;
      const ny = y + Math.cos(a) * step;

      a += (Math.random() - 0.5) * 0.8;
      a -= (a - branchTargetAngle) * 0.06;

      points.push(nx, ny);

      // occasionally split the branch further or thin it
      if (Math.random() < 0.02) {
        addSegment(points.slice(), line_width); // commit current branch segment

        // shrink width and maybe spawn a nested branch
        line_width *= (0.6 + Math.random() * 0.35);
        if (line_width < 0.35) return;

        if (Math.random() < 0.12) {
          generateBranch(nx, ny, branchTargetAngle + (Math.random() - 0.5) * 1.2, line_width * 0.8, depth + 1);
        }

        // start a fresh segment continuing from this point
        points.length = 0;
        points.push(nx, ny);
      }

      x = nx; y = ny; steps++;
    }

    // commit remaining branch points
    addSegment(points, line_width);
  }

  // Render: two passes to keep draw calls minimal (glow then core)
  if (segments.length > 0) {
    // Glow pass
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Tuned glow parameters for performance & visual result (not too heavy blur)
    ctx.shadowColor = 'rgba(200,220,255,0.9)';
    ctx.shadowBlur = 12; // lowered from high values to reduce GPU work
    ctx.strokeStyle = 'rgba(220,230,255,0.9)';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      ctx.lineWidth = Math.max(1, seg.width * 2.4);
      ctx.beginPath();
      const pts = seg.points;
      ctx.moveTo(pts[0], pts[1]);
      for (let p = 2; p < pts.length; p += 2) ctx.lineTo(pts[p], pts[p + 1]);
      ctx.stroke();
    }
    ctx.restore();

    // Core pass (bright thin lines without blur)
    ctx.save();
    ctx.shadowBlur = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      ctx.lineWidth = Math.max(0.6, seg.width);
      ctx.strokeStyle = genLightningColor(seg.width);
      ctx.beginPath();
      const pts = seg.points;
      ctx.moveTo(pts[0], pts[1]);
      for (let p = 2; p < pts.length; p += 2) ctx.lineTo(pts[p], pts[p + 1]);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // No segments -> nothing drawn
  }

  // Attempt to produce ImageBitmap (fast transferable). If not supported, fallback to ImageData.
  try {
    // createImageBitmap is asynchronous
    const bitmap = await createImageBitmap(lightningCanvas);
    // decide shake intensity from width seen
    const shakeIntensity = didStrike ? Math.max(0.04, Math.min(1, maxLineWidthSeen / 12)) : 0;
    return {
      imageBitmap: bitmap,
      imageData: null,
      shakeIntensity,
      didStrike
    };
  } catch (e) {
    // fallback: readImageData (slower)
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const shakeIntensity = didStrike ? Math.max(0.04, Math.min(1, maxLineWidthSeen / 12)) : 0;
      return {
        imageBitmap: null,
        imageData,
        shakeIntensity,
        didStrike
      };
    } catch (ex) {
      // ultimate fallback, return nothing
      return {
        imageBitmap: null,
        imageData: null,
        shakeIntensity: 0,
        didStrike: false,
        error: ex && ex.message
      };
    }
  }
  }​
