let state = {
  up: false,
  down: false,
  left: false,
  right: false,
  rotateLeft: false,
  rotateRight: false,
};

let KEY_CODES = {
  87: 'up',
  83: 'down',
  65: 'left',
  68: 'right',
  37: 'rotateLeft',
  39: 'rotateRight',
};

document.addEventListener('keydown', e => {
  state[KEY_CODES[e.keyCode]] = true;
});

document.addEventListener('keyup', e => {
  state[KEY_CODES[e.keyCode]] = false;
});

export default () => state;
