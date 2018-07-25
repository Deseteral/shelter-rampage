function createRenderer(width, height, instance) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  instance.renderer = canvas;
  canvas.requestPointerLock();
  document.body.appendChild(canvas);
}

function injectStyles(config) {
  const element = document.createElement('style');
  const style = `
    body {
      background-color: ${config.renderer.background};
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      margin: 0;
    }

    canvas {
      image-rendering: pixelated;
      width: 100vw;
      height: 100vh;
    }
  `;

  element.innerHTML = style;
  document.head.appendChild(element);
}

export { createRenderer, injectStyles };
