// @ts-check

const main2dCanvas = document.createElement("canvas");
document.body.appendChild(main2dCanvas);

/** @type {CanvasRenderingContext2D} */
// @ts-ignore
const ctx = main2dCanvas.getContext("2d");

const resizeCanvas = () => {
    main2dCanvas.width = main2dCanvas.getBoundingClientRect().width;
    main2dCanvas.height = main2dCanvas.getBoundingClientRect().height;
    ctx.resetTransform();
    const width = main2dCanvas.width;
    const height = main2dCanvas.height;
    ctx.translate(width / 2, height / 2);
    // Scale to normalize the coordinate space to -1 to 1
    ctx.scale(width / 2, -height / 2);
    ctx.fillRect(0, 0, 0.5, 0.5);
};

const clear = () => {
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, main2dCanvas.width, main2dCanvas.height);
    ctx.restore();
    // TODO code to clear other canvases
};

const camera = () => {
    let position = [0, 0];
    let targetPosition = [0, 0];
    let zoom = 1;

    let getMatrix = () => {
        
    }

}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let oldTime = -1;
/**
 *
 * @param {number} timeMs
 * @returns
 */
const frame = (timeMs) => {
    if (oldTime < 0) {
        oldTime = timeMs;
        return;
    }
    const deltaTimeMs = timeMs - oldTime;
    oldTime = timeMs;

    draw(deltaTimeMs);
    requestAnimationFrame(frame);
};

/**
 *
 * @param {number} deltaMs Time since last frame in milliseconds
 */
const draw = (deltaMs) => {
    clear();
};

requestAnimationFrame(frame);
