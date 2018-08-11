let state = {
  up: false,
  down: false,
  left: false,
  right: false,
  shoot: false,
  debug: false,
  debugSpawnEnemy: false, // TODO: DEBUG: Remove
  rotate: 0,
};

let KEY_CODES = {
  87: 'up',
  83: 'down',
  65: 'left',
  68: 'right',
  32: 'shoot',
  75: 'debugSpawnEnemy', // TODO: DEBUG: Remove
  191: 'debug',
};

document.addEventListener('mousemove', e => {
  state.rotate = e.movementX;
});

document.addEventListener('mousedown', e => {
  state.shoot = (e.button === 0);
});

document.addEventListener('mouseup', () => {
  state.shoot = false;
});

document.addEventListener('keydown', e => {
  state[KEY_CODES[e.keyCode]] = true;
});

document.addEventListener('keyup', e => {
  state[KEY_CODES[e.keyCode]] = false;
});

export default () => state;
