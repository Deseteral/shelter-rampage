import gameScene from './game/game-scene';

window.engine = {
  c: document.getElementById('c'),
  gl: null,
  scene: gameScene,
};

window.gameData = {
  player: {
    pos: { x: 2, y: 2 },
    dir: { x: -1, y: 0 },
  },
  plane: { x: 0, y: 0.66 },
  map: null,
};

// TODO: DEBUG: Remove minimap
const minimap = document.createElement('canvas');
minimap.id = 'minimap';
minimap.width = 32;
minimap.height = 32;
minimap.style.position = 'absolute';
minimap.style.width = '256px';
minimap.style['image-rendering'] = 'pixelated';
document.body.insertBefore(minimap, document.body.firstChild);
window.gameData.minimap = minimap;

window.gameData.map = gameScene.generateMap();

window.engine.c.onclick = () => window.engine.c.requestPointerLock();

engine.gl = engine.c.getContext('2d');
engine.gl.imageSmoothingEnabled = false;

function run() {
  engine.scene.update();

  window.requestAnimationFrame(run);
}

run();


// TODO: Remove this on dist
if (module.hot) {
  module.hot.accept('./game/game-scene', () => {
    const newScene = require('./game/game-scene').default; // eslint-disable-line global-require
    engine.scene = newScene;
    console.clear();
  });
}


// TODO: Make all consts - lets
// TODO: Remove all DEBUG stuff
// TODO: Find more vector operations to replace with vec* functions
