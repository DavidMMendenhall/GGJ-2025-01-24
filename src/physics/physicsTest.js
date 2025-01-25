// @ts-check
import { line, arc, project, ball } from "./collision.js";
import { Controls } from "../controls.js";
const controls = new Controls();


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
    ctx.scale(height / 2, -height / 2);
    // ctx.fillRect(0, 0, 0.5, 0.5);
};

const clear = () => {
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, main2dCanvas.width, main2dCanvas.height);
    ctx.restore();
    // TODO code to clear other canvases
};

/**
 * 
 * @param {import("./collision.js").Ball} ball 
 * @param {string} color 
 */
const drawBall = (ball, color) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let lineData = [ [0.1, 0.5], [0.9, 0.75]];
let arcData = [0, -0.75, 0.25, 0, Math.PI];
let myLine = line(lineData[0], lineData[1]);
let myArc = arc([arcData[0], arcData[1]], arcData[2], arcData[3], arcData[4]);

let myBall = ball([0, 0], 0.25);

let oldTime = -1;
/**
 *
 * @param {number} timeMs
 * @returns
 */
const frame = (timeMs) => {
    if (oldTime < 0) {
        oldTime = timeMs;
        requestAnimationFrame(frame);
        return;
    }
    const deltaTimeMs = timeMs - oldTime;
    oldTime = timeMs;

    controls.update(deltaTimeMs);
    if(controls.held.has("R1")){
        myBall.velocity = [0, 0]
        myBall.center = [0, 0]
    }
    myBall.ax += controls.leftStick[0];
    myBall.ay += controls.leftStick[1];
    myBall.update(deltaTimeMs, [myArc, myLine], [0, 0]);
    draw(deltaTimeMs);
    requestAnimationFrame(frame);

};

/**
 *
 * @param {number} deltaMs Time since last frame in milliseconds
 */
const draw = (deltaMs) => {
    clear();
    drawBall(myBall, "green");
    ctx.save();
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.arc(arcData[0], arcData[1], arcData[2], arcData[3], arcData[4]);
    ctx.moveTo(lineData[0][0], lineData[0][1]);
    ctx.lineTo(lineData[1][0], lineData[1][1]);
    ctx.stroke();
    ctx.restore();

};

requestAnimationFrame(frame);



