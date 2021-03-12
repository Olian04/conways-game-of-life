const canvas = document.createElement('canvas');
const height = window.innerHeight;
const width = window.innerWidth;
canvas.height = height;
canvas.width = width;
canvas.style.height = `${height}px`;
canvas.style.width = `${width}px`;
document.body.appendChild(canvas);

document.onresize = () => window.location.reload();

// World state
const world = {
  origin: [height / 2, width / 2],
  translate: [0, 0],
  dirty: true,
  tileSize: 30,
}

// Mouse state
const mouse = {
  prev: {
    x: 0,
    y: 0,
  },
  down: false,
}

// Game state
const game = {
  aliveTiles: new Map(),
}

// Mouse logic
const startDrag = (ev) => {
  mouse.down = true;
  mouse.prev.x = ev.clientX;
  mouse.prev.y = ev.clientY;
  canvas.classList.add('drag');
}
const stopDrag = () => {
  mouse.down = false;
  canvas.classList.remove('drag');
}
const handleDrag = (ev) => {
  if (!mouse.down) return;
  world.translate[0] += ev.clientX - mouse.prev.x;
  world.translate[1] += ev.clientY - mouse.prev.y;
  world.dirty = true;

  mouse.prev.x = ev.clientX;
  mouse.prev.y = ev.clientY;
}
document.body.addEventListener('mousedown', startDrag);
document.body.addEventListener('mouseup', stopDrag);
document.body.addEventListener('mouseleave', stopDrag);
document.body.addEventListener('mousemove', handleDrag);
document.body.addEventListener('touchstart', (ev) =>
  startDrag(ev.touches[0])
);
document.body.addEventListener('touchend', (ev) =>
  stopDrag(ev.touches[0])
);
document.body.addEventListener('touchcancel', (ev) =>
  stopDrag(ev.touches[0])
);
document.body.addEventListener('touchmove', (ev) =>
  handleDrag(ev.touches[0])
);


// Render logic
const ctx = canvas.getContext('2d');

const clear = () => {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Will always clear the right space
  ctx.fillStyle = '#171717';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

const box = (x, y, size = world.tileSize) => {

  const centerOffset = size / 2;
  const worldX = Math.floor(
    world.origin[0] +
    world.translate[0] +
    (x * size) - centerOffset
  );

  const worldY = Math.floor(
    world.origin[1] +
    world.translate[1] +
    (y * size) - centerOffset
  );

  ctx.fillStyle = 'white';
  ctx.fillRect(worldX, worldY, size, size);
}

const render = () => {
  // Queue up next animation frame
  requestAnimationFrame(render);

  // Check if world needs to be redrawn
  if (!world.dirty) return;
  world.dirty = false;

  clear();
  for (let { x, y } of game.aliveTiles.values()) {
    box(x, y);
  }
}

render();

const getNeighborCount = (tileMap, x, y) => {
  return [
    tileMap.has(`${x - 1},${y - 1}`),
    tileMap.has(`${x},${y - 1}`),
    tileMap.has(`${x + 1},${y - 1}`),
    tileMap.has(`${x - 1},${y}`),
    tileMap.has(`${x + 1},${y}`),
    tileMap.has(`${x - 1},${y + 1}`),
    tileMap.has(`${x},${y + 1}`),
    tileMap.has(`${x + 1},${y + 1}`),
  ].reduce((a, b) => a + Number(b), 0);
}

/*
Conway's Game of Life
1. Any live cell with fewer than two live neighbors dies, as if by under-population.
2. Any live cell with two or three live neighbors lives on to the next generation.
3. Any live cell with more than three live neighbors dies, as if by overpopulation.
4. Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
*/
const update = () => {
  const tiles = new Map(game.aliveTiles);
  for (let { x, y } of tiles.values()) {
    const neighbors = getNeighborCount(tiles, x, y);

    // Should cell survive
    switch (neighbors) {
      case 2:
      case 3:
        // Cell survives
        break;
      default:
        // Cell dies
        game.aliveTiles.delete(`${x},${y}`);
        break;
    }

    // Should cell give birth to neighbors
    [
      { x: x - 1, y: y - 1 },
      { x: x, y: y - 1 },
      { x: x + 1, y: y - 1 },
      { x: x - 1, y: y },
      { x: x + 1, y: y },
      { x: x - 1, y: y + 1 },
      { x: x, y: y + 1 },
      { x: x + 1, y: y + 1 },
    ].forEach(({ x, y }) => {
      const neighbors = getNeighborCount(tiles, x, y);
      if (neighbors === 3) {
        game.aliveTiles.set(`${x},${y}`, { x, y });
      }
    });

    world.dirty = true;
  }
}

setInterval(update, 500 /* 0.5 second */);

const spawnShape = (origin, shapeArr, setDirty = true) => {
  const offsetX = Math.floor(shapeArr[0].length / 2);
  const offsetY = Math.floor(shapeArr.length / 2);
  for (let dy = 0; dy < shapeArr.length; dy++) {
    for (let dx = 0; dx < shapeArr[dy].length; dx++) {
      const x = dx + origin[0] - offsetX;
      const y = dy + origin[1] - offsetY;
      if (shapeArr[dy][dx] === '#') {
        game.aliveTiles.set(`${x},${y}`, { x, y });
      }
    }
  }
  if (setDirty) {
    world.dirty = true;
  }
}

const stableShapes = {
  'block': [
    '##',
    '##',
  ],
  'beehive': [
    '-##-',
    '#--#',
    '-##-',
  ],
  'loaf': [
    '-##-',
    '#--#',
    '-#-#',
    '--#-',
  ],
  'boat': [
    '##-',
    '#-#',
    '-#-',
  ],
  'tub': [
    '-#-',
    '#-#',
    '-#-',
  ]
}

const oscillatingShapes = {
  'blinker': [
    '###',
  ],
  'toad': [
    '-###',
    '###-',
  ],
  'beacon': [
    '##--',
    '#---',
    '---#',
    '--##'
  ],
  'pulsar': [
    '--###---###--',
    '-------------',
    '#----#-#----#',
    '#----#-#----#',
    '#----#-#----#',
    '--###---###--',
    '-------------',
    '--###---###--',
    '#----#-#----#',
    '#----#-#----#',
    '#----#-#----#',
    '-------------',
    '--###---###--',
  ],
  'pentadecathlon': [
    '###',
    '#-#',
    '###',
    '###',
    '###',
    '###',
    '#-#',
    '###',
  ]
}

const shipShapes = {
  'glider': [
    '--#',
    '#-#',
    '-##',
  ]
}

spawnShape([-8, 0], oscillatingShapes.pentadecathlon, false);
spawnShape([8, 0], oscillatingShapes.pulsar, false);
spawnShape([-5, -10], shipShapes.glider, false);

world.dirty = true;