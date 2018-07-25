const keyState = {
  up: false,
  down: false,
  left: false,
  right: false,
  rotateLeft: false,
  rotateRight: false,
};

const KEY_CODE_A = 65;
const KEY_CODE_W = 87;
const KEY_CODE_D = 68;
const KEY_CODE_S = 83;
const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;

document.addEventListener('keydown', (event) => {
  if (event.keyCode === KEY_CODE_W) keyState.up = true;
  if (event.keyCode === KEY_CODE_S) keyState.down = true;
  if (event.keyCode === KEY_CODE_A) keyState.left = true;
  if (event.keyCode === KEY_CODE_D) keyState.right = true;
  if (event.keyCode === KEY_CODE_LEFT) keyState.rotateLeft = true;
  if (event.keyCode === KEY_CODE_RIGHT) keyState.rotateRight = true;
});

document.addEventListener('keyup', (event) => {
  if (event.keyCode === KEY_CODE_W) keyState.up = false;
  if (event.keyCode === KEY_CODE_S) keyState.down = false;
  if (event.keyCode === KEY_CODE_A) keyState.left = false;
  if (event.keyCode === KEY_CODE_D) keyState.right = false;
  if (event.keyCode === KEY_CODE_LEFT) keyState.rotateLeft = false;
  if (event.keyCode === KEY_CODE_RIGHT) keyState.rotateRight = false;
});

function getKeyState() {
  return keyState;
}

export default getKeyState;
