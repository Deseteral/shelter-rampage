import { createRenderer, injectStyles } from './renderer';
import globalScopeInject from './global-scope-inject';

const DEFAULT_CONFIG = {
  renderer: {
    width: 360,
    height: 400,
    background: '#000000',
  },
};

function createInstance() {
  return {
    renderer: null,
    scene: null,
  };
}

function initialize(instance, config = DEFAULT_CONFIG) {
  createRenderer(config.renderer.width, config.renderer.height, instance);
  injectStyles(config);
  globalScopeInject(instance, 'engine');
  console.info('Initialized engine instance');
}

function loadScene(scene, instance) {
  instance.scene = scene;
}

function run() {
  engine.renderer
    .getContext('2d')
    .clearRect(0, 0, engine.renderer.width, engine.renderer.height);

  engine.scene.update();
  engine.scene.render();

  window.requestAnimationFrame(run);
}

export {
  createInstance,
  initialize,
  loadScene,
  run,
  globalScopeInject,
};
