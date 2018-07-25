import * as Engine from './engine';
import gameScene, { initializeGameData } from './game/game-scene';

const engine = Engine.createInstance();
Engine.initialize(engine);
initializeGameData();

Engine.loadScene(gameScene, engine);
Engine.run();

if (module.hot) {
  module.hot.accept('./game/game-scene', () => {
    const newScene = require('./game/game-scene').default; // eslint-disable-line global-require
    Engine.loadScene(newScene, engine);
    console.clear();
  });
}
