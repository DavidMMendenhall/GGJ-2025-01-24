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

let lineData = [[[0.1, 0.5], [0.9, 0.75]], [[0.1, 0.5], [-0.1, -0.65]]];
let arcData = [[0, -0.75, 0.25, 0, Math.PI], [-2, -0.75, 0.5, 0, Math.PI * 2]];
let myLines = lineData.map((ld)=>line(ld[0], ld[1]));
// let myArc = arc([arcData[0], arcData[1]], arcData[2], arcData[3], arcData[4]);
let myArcs = arcData.map( ad => arc([ad[0], ad[1]], ad[2], ad[3], ad[4]));

let player = ball([0, 0], 0.25);
let balls = [player];

let isYeet = false;
let futurePlayer = null;
let futurePositionDirection = [0, 0];

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
        player.velocity = [0, 0]
        player.center = [0, 0]
    }

    if(controls.held.has("L1")){
        player.velocity = [0, 0];
    }

    if(controls.pressed.has("R2")){
        futurePlayer = ball([player.x, player.y], player.r / Math.sqrt(2));
        player.r = player.r / Math.sqrt(2)

        balls.push(futurePlayer);
    }

    if(futurePlayer){
        let heldDirection = controls.rightStick;
        let magnitude = Math.sqrt(heldDirection[0] ** 2 + heldDirection[1] ** 2);
        if (magnitude > 0.2){
            futurePositionDirection = [heldDirection[0] / magnitude, heldDirection[1] / magnitude];
        }
        futurePlayer.center = [player.x + futurePositionDirection[0] * player.r, player.y + futurePositionDirection[1] * player.r];
        if(!controls.held.has("R2")){
            // yeet
            futurePlayer.velocity = [futurePositionDirection[0] * 2, futurePositionDirection[1] * 2];
            player = futurePlayer;
            futurePlayer = null;
        }
    }
    
    player.ax += controls.leftStick[0];
    player.ay += controls.leftStick[1];
    balls.forEach(element => {
        element.update(deltaTimeMs, [...myArcs, ...myLines], [0, -0.25]);
    });
    draw(deltaTimeMs);
    requestAnimationFrame(frame);

};

/**
 *
 * @param {number} deltaMs Time since last frame in milliseconds
 */
const draw = (deltaMs) => {
    clear();
    ctx.save();
    ctx.translate(-player.x, -player.y);
    // drawBall(player, "green");
    balls.forEach(element => {
        drawBall(element, "green");
    });
    ctx.lineCap = "round";
    ctx.lineWidth = 0.05;
    arcData.forEach(ad => {
        ctx.beginPath();
        ctx.arc(ad[0], ad[1], ad[2], ad[3], ad[4]);
        ctx.stroke();

    })
    lineData.forEach((ld) => {
        ctx.moveTo(ld[0][0], ld[0][1]);
        ctx.lineTo(ld[1][0], ld[1][1]);
    })
    
    ctx.stroke();
    ctx.restore();

};

requestAnimationFrame(frame);



