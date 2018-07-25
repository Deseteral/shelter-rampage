const keyState = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const KEY_CODE_LEFT = 37;
const KEY_CODE_UP = 38;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_DOWN = 40;

document.addEventListener('keydown', (event) => {
  if (event.keyCode === KEY_CODE_UP) keyState.up = true;
  if (event.keyCode === KEY_CODE_DOWN) keyState.down = true;
  if (event.keyCode === KEY_CODE_RIGHT) keyState.right = true;
  if (event.keyCode === KEY_CODE_LEFT) keyState.left = true;
});

document.addEventListener('keyup', (event) => {
  if (event.keyCode === KEY_CODE_UP) keyState.up = false;
  if (event.keyCode === KEY_CODE_DOWN) keyState.down = false;
  if (event.keyCode === KEY_CODE_RIGHT) keyState.right = false;
  if (event.keyCode === KEY_CODE_LEFT) keyState.left = false;
});

function getKeyState() {
  return keyState;
}

export default getKeyState;
