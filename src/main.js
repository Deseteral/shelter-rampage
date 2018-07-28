import gameScene from './game/game-scene';

window.engine = {
  c: document.getElementById('c'),
  gl: null,
  scene: gameScene,
};

window.gameData = {
  pos: { x: 22, y: 12 },
  dir: { x: -1, y: 0 },
  plane: { x: 0, y: 0.66 },
};

// engine.gl = engine.c.getContext('2d', { alpha: false });
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
