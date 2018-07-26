import gameScene from './game/game-scene';

window.engine = {
  c: document.getElementById('c'),
  gl: null,
  scene: gameScene,
};

engine.gl = engine.c.getContext('2d');

function run() {
  engine.gl.fillStyle = 'black';
  engine.gl.fillRect(0, 0, 360, 400);

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
