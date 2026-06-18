/* ShapeGrid — fundo animado em canvas pra seções de fundo escuro. Adaptado do componente React Bits pra vanilla JS. */
function createShapeGrid(canvas, options = {}) {
  const {
    direction = 'diagonal',
    speed = 0.35,
    borderColor = 'rgba(255,199,0,.35)',
    squareSize = 42,
    hoverFillColor = 'rgba(255,199,0,.18)',
    shape = 'square',
    hoverTrailAmount = 6,
  } = options;

  const ctx = canvas.getContext('2d');
  const isHex = shape === 'hexagon';
  const isTri = shape === 'triangle';
  const hexHoriz = squareSize * 1.5;
  const hexVert = squareSize * Math.sqrt(3);

  let numSquaresX, numSquaresY;
  const gridOffset = { x: 0, y: 0 };
  let hoveredSquare = null;
  const trailCells = [];
  const cellOpacities = new Map();
  let rafId = null;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    numSquaresX = Math.ceil(canvas.width / squareSize) + 1;
    numSquaresY = Math.ceil(canvas.height / squareSize) + 1;
  }

  function drawHex(cx, cy, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const vx = cx + size * Math.cos(angle);
      const vy = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
  }

  function drawCircle(cx, cy, size) {
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.closePath();
  }

  function drawTriangle(cx, cy, size, flip) {
    ctx.beginPath();
    if (flip) {
      ctx.moveTo(cx, cy + size / 2);
      ctx.lineTo(cx + size / 2, cy - size / 2);
      ctx.lineTo(cx - size / 2, cy - size / 2);
    } else {
      ctx.moveTo(cx, cy - size / 2);
      ctx.lineTo(cx + size / 2, cy + size / 2);
      ctx.lineTo(cx - size / 2, cy + size / 2);
    }
    ctx.closePath();
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isHex) {
      const colShift = Math.floor(gridOffset.x / hexHoriz);
      const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
      const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;
      const cols = Math.ceil(canvas.width / hexHoriz) + 3;
      const rows = Math.ceil(canvas.height / hexVert) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * hexHoriz + offsetX;
          const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;
          paintCell(`${col},${row}`, () => drawHex(cx, cy, squareSize));
        }
      }
    } else if (isTri) {
      const halfW = squareSize / 2;
      const colShift = Math.floor(gridOffset.x / halfW);
      const rowShift = Math.floor(gridOffset.y / squareSize);
      const offsetX = ((gridOffset.x % halfW) + halfW) % halfW;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const cols = Math.ceil(canvas.width / halfW) + 4;
      const rows = Math.ceil(canvas.height / squareSize) + 4;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * halfW + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;
          const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;
          paintCell(`${col},${row}`, () => drawTriangle(cx, cy, squareSize, flip));
        }
      }
    } else if (shape === 'circle') {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const cols = Math.ceil(canvas.width / squareSize) + 3;
      const rows = Math.ceil(canvas.height / squareSize) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * squareSize + squareSize / 2 + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;
          paintCell(`${col},${row}`, () => drawCircle(cx, cy, squareSize));
        }
      }
    } else {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const cols = Math.ceil(canvas.width / squareSize) + 3;
      const rows = Math.ceil(canvas.height / squareSize) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const sx = col * squareSize + offsetX;
          const sy = row * squareSize + offsetY;
          const cellKey = `${col},${row}`;
          const alpha = cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(sx, sy, squareSize, squareSize);
            ctx.globalAlpha = 1;
          }
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(sx, sy, squareSize, squareSize);
        }
      }
    }
  }

  function paintCell(cellKey, drawPath) {
    const alpha = cellOpacities.get(cellKey);
    if (alpha) {
      ctx.globalAlpha = alpha;
      drawPath();
      ctx.fillStyle = hoverFillColor;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    drawPath();
    ctx.strokeStyle = borderColor;
    ctx.stroke();
  }

  function updateCellOpacities() {
    const targets = new Map();
    if (hoveredSquare) targets.set(`${hoveredSquare.x},${hoveredSquare.y}`, 1);

    if (hoverTrailAmount > 0) {
      for (let i = 0; i < trailCells.length; i++) {
        const t = trailCells[i];
        const key = `${t.x},${t.y}`;
        if (!targets.has(key)) targets.set(key, (trailCells.length - i) / (trailCells.length + 1));
      }
    }

    for (const [key] of targets) {
      if (!cellOpacities.has(key)) cellOpacities.set(key, 0);
    }

    for (const [key, opacity] of cellOpacities) {
      const target = targets.get(key) || 0;
      const next = opacity + (target - opacity) * 0.15;
      if (next < 0.005) cellOpacities.delete(key);
      else cellOpacities.set(key, next);
    }
  }

  function updateAnimation() {
    const effectiveSpeed = Math.max(speed, 0.1);
    const wrapX = isHex ? hexHoriz * 2 : squareSize;
    const wrapY = isHex ? hexVert : isTri ? squareSize * 2 : squareSize;

    switch (direction) {
      case 'right': gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX; break;
      case 'left': gridOffset.x = (gridOffset.x + effectiveSpeed + wrapX) % wrapX; break;
      case 'up': gridOffset.y = (gridOffset.y + effectiveSpeed + wrapY) % wrapY; break;
      case 'down': gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY; break;
      case 'diagonal':
        gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX;
        gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY;
        break;
    }

    updateCellOpacities();
    drawGrid();
    rafId = requestAnimationFrame(updateAnimation);
  }

  function cellFromPoint(mouseX, mouseY) {
    if (isHex) {
      const colShift = Math.floor(gridOffset.x / hexHoriz);
      const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
      const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;
      const col = Math.round((mouseX - offsetX) / hexHoriz);
      const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0;
      const row = Math.round((mouseY - offsetY - rowOffset) / hexVert);
      return { x: col, y: row };
    }
    if (isTri) {
      const halfW = squareSize / 2;
      const offsetX = ((gridOffset.x % halfW) + halfW) % halfW;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const col = Math.round((mouseX - offsetX) / halfW);
      const row = Math.floor((mouseY - offsetY) / squareSize);
      return { x: col, y: row };
    }
    if (shape === 'circle') {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const col = Math.round((mouseX - offsetX) / squareSize);
      const row = Math.round((mouseY - offsetY) / squareSize);
      return { x: col, y: row };
    }
    const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
    const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
    const col = Math.floor((mouseX - offsetX) / squareSize);
    const row = Math.floor((mouseY - offsetY) / squareSize);
    return { x: col, y: row };
  }

  function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const cell = cellFromPoint(event.clientX - rect.left, event.clientY - rect.top);
    if (!hoveredSquare || hoveredSquare.x !== cell.x || hoveredSquare.y !== cell.y) {
      if (hoveredSquare && hoverTrailAmount > 0) {
        trailCells.unshift({ ...hoveredSquare });
        if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
      }
      hoveredSquare = cell;
    }
  }

  function handleMouseLeave() {
    if (hoveredSquare && hoverTrailAmount > 0) {
      trailCells.unshift({ ...hoveredSquare });
      if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
    }
    hoveredSquare = null;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseleave', handleMouseLeave);
  rafId = requestAnimationFrame(updateAnimation);

  return function destroy() {
    window.removeEventListener('resize', resizeCanvas);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    cancelAnimationFrame(rafId);
  };
}
