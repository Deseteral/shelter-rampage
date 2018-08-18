import gameScene from './game/game-scene';

window.engine = {
  c: document.getElementById('c'),
  scene: gameScene,
};

engine.gl = engine.c.getContext('2d');
engine.gl.imageSmoothingEnabled = false;
engine.c.onclick = () => engine.c.requestPointerLock();

window.gameData = {
  player: { dir: { x: 0.61, y: 0.79 } },
  plane: { x: 0.52, y: -0.40 },
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
gameData.minimap = minimap;

// Generate map
gameData.map = gameScene.generateMap();

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
// TODO: Replace true with 1, false with 0
// TODO: Replace <= with < etc.
// TODO: Alias all Math.* things
