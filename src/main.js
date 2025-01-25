// @ts-check
import {
    matrix3x3Multiply,
    inverseMatrix3x3,
    vectorMatrix3x3Multiply,
} from "./matrix.js";
import { Graphics } from "./webgl/graphics.js";
import { CollisionGenerator } from "./physics/collision.js";
import { Controls } from "./controls.js";
const controls = new Controls();
import { svgImport } from "./svg-import.js";

const main2dCanvas = document.createElement("canvas");
document.body.appendChild(main2dCanvas);
const mainWebGLCanvas = document.createElement("canvas");
document.body.appendChild(mainWebGLCanvas);
mainWebGLCanvas.style.zIndex = "5";

/** @type {CanvasRenderingContext2D} */
// @ts-ignore
const ctx = main2dCanvas.getContext("2d");
/** @type {WebGL2RenderingContext} */
// @ts-ignore
const gl = mainWebGLCanvas.getContext("webgl2");

let backgroundPattern = null;
let backgroundImage = new Image();
backgroundImage.onload = () => {
    backgroundPattern = ctx.createPattern(backgroundImage, "repeat");
};
backgroundImage.src = "/images/background.png";

// load the level
const level = await fetch("/levels/keyhole.svg")
    .then((resp) => resp.text())
    .then((text) => svgImport(text));

/** @type {Set<import("./webgl/graphics.js").GlobRenderData>} */
const particleGlobs = new Set();

const resizeCanvas = () => {
    main2dCanvas.width = main2dCanvas.getBoundingClientRect().width;
    main2dCanvas.height = main2dCanvas.getBoundingClientRect().height;
    ctx.resetTransform();
    const width = main2dCanvas.width;
    const height = main2dCanvas.height;
    ctx.translate(width / 2, height / 2);
    // Scale to normalize the coordinate space to -1 to 1
    ctx.scale(width / 2, -height / 2);

    mainWebGLCanvas.width = width;
    mainWebGLCanvas.height = height;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    Graphics.resize(gl);
};

const clear = () => {
    ctx.save();
    // ctx.resetTransform();
    camera.applyMatrix();
    let mat=camera.getInverse();
    let top_left = vectorMatrix3x3Multiply(mat, [-1, 1]);
    let down_left = vectorMatrix3x3Multiply(mat, [-1, -1]);
    let down_right = vectorMatrix3x3Multiply(mat, [1, -1]);
    let top_right = vectorMatrix3x3Multiply(mat, [1, 1]);

    // ctx.clearRect(0, 0, main2dCanvas.width, main2dCanvas.height);
    if (backgroundPattern) {
        ctx.fillStyle = backgroundPattern;
    } else {
        ctx.fillStyle = "#FFFFFF";
    }
    ctx.beginPath();
    ctx.moveTo(top_left[0], top_left[1]);
    ctx.lineTo(top_right[0], top_right[1]);
    ctx.lineTo(down_right[0], down_right[1]);
    ctx.lineTo(down_left[0], down_left[1]);
    // ctx.fillRect(0, 0, main2dCanvas.width, main2dCanvas.height);
    ctx.fill();
    ctx.restore();
    // TODO code to clear other canvases
};

const camera = (() => {
    let position = [0.5, 0.5];
    let target = [0, 0];
    let targetFrameHard = 0.75;
    let targetFrameSoft = 0.25;
    let frameSize = 3;
    let zoom = 2 / frameSize;

    let getMatrix = () => {
        let aspect = main2dCanvas.height / main2dCanvas.width;
        let aspectMatrix = [aspect * zoom, 0, 0, 0, zoom, 0, 0, 0, 1];
        let translation = [1, 0, -position[0], 0, 1, -position[1], 0, 0, 1];

        return matrix3x3Multiply(aspectMatrix, translation);
    };

    let getInverse = () => {
        return inverseMatrix3x3(getMatrix());
    };

    let applyMatrix = () => {
        let mat = getMatrix();
        ctx.transform(mat[0], mat[3], mat[1], mat[4], mat[2], mat[5]);
    };
    let renderDebug = () => {
        ctx.save();
        let s = 0.025 * frameSize;
        ctx.lineWidth = 0.025 * frameSize;
        let mat = getInverse();

        let top_left = vectorMatrix3x3Multiply(mat, [-1, 1]);
        let down_left = vectorMatrix3x3Multiply(mat, [-1, -1]);
        let down_right = vectorMatrix3x3Multiply(mat, [1, 1]);
        let top_right = vectorMatrix3x3Multiply(mat, [1, -1]);

        let hardFrame = [
            vectorMatrix3x3Multiply(mat, [-targetFrameHard, targetFrameHard]),
            vectorMatrix3x3Multiply(mat, [-targetFrameHard, -targetFrameHard]),
            vectorMatrix3x3Multiply(mat, [targetFrameHard, -targetFrameHard]),
            vectorMatrix3x3Multiply(mat, [targetFrameHard, targetFrameHard]),
        ];
        let softFrame = [
            vectorMatrix3x3Multiply(mat, [-targetFrameSoft, targetFrameSoft]),
            vectorMatrix3x3Multiply(mat, [-targetFrameSoft, -targetFrameSoft]),
            vectorMatrix3x3Multiply(mat, [targetFrameSoft, -targetFrameSoft]),
            vectorMatrix3x3Multiply(mat, [targetFrameSoft, targetFrameSoft]),
        ];

        ctx.fillStyle = "red";
        ctx.fillRect(top_left[0] - s, top_left[1] - s, s * 2, s * 2);
        ctx.fillStyle = "green";
        ctx.fillRect(down_left[0] - s, down_left[1] - s, s * 2, s * 2);
        ctx.fillStyle = "blue";
        ctx.fillRect(down_right[0] - s, down_right[1] - s, s * 2, s * 2);
        ctx.fillStyle = "yellow";
        ctx.fillRect(top_right[0] - s, top_right[1] - s, s * 2, s * 2);

        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(hardFrame[0][0], hardFrame[0][1]);
        hardFrame.forEach((value) => {
            ctx.lineTo(value[0], value[1]);
        });
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = "green";
        ctx.beginPath();
        ctx.moveTo(softFrame[0][0], softFrame[0][1]);
        softFrame.forEach((value) => {
            ctx.lineTo(value[0], value[1]);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    };
    let update = (deltaMs) => {
        let mat = getInverse();
        let hardFrame = [
            vectorMatrix3x3Multiply(mat, [-targetFrameHard, -targetFrameHard]),
            vectorMatrix3x3Multiply(mat, [targetFrameHard, targetFrameHard]),
        ];
        let softFrame = [
            vectorMatrix3x3Multiply(mat, [-targetFrameSoft, -targetFrameSoft]),
            vectorMatrix3x3Multiply(mat, [targetFrameSoft, targetFrameSoft]),
        ];

        // hard frame
        if (target[0] < hardFrame[0][0]) {
            // left of frame
            position[0] += target[0] - hardFrame[0][0];
        }
        if (target[0] > hardFrame[1][0]) {
            // right of frame
            position[0] += target[0] - hardFrame[1][0];
        }
        if (target[1] < hardFrame[0][1]) {
            // below the frame
            position[1] += target[1] - hardFrame[0][1];
        }
        if (target[1] > hardFrame[1][1]) {
            // above frame
            position[1] += target[1] - hardFrame[1][1];
        }

        // soft frame
        if (target[0] < softFrame[0][0]) {
            // left of frame
            position[0] +=
                (target[0] - softFrame[0][0]) * (deltaMs / 300);
        }
        if (target[0] > softFrame[1][0]) {
            // right of frame
            position[0] +=
                (target[0] - softFrame[1][0]) * (deltaMs / 300);
        }
        if (target[1] < softFrame[0][1]) {
            // below the frame
            position[1] +=
                (target[1] - softFrame[0][1]) * (deltaMs / 300);
        }
        if (target[1] > softFrame[1][1]) {
            // above frame
            position[1] +=
                (target[1] - softFrame[1][1]) * (deltaMs / 300);
        }
    };
    return {
        getMatrix,
        getInverse,
        applyMatrix,
        renderDebug,
        set target(value) {
            target = value;
        },
        set frameSize(value) {
            frameSize = value;
            zoom = 2 / frameSize;
        },
        get frameSize() {
            return frameSize;
        },
        center: () => {
            position = target;
        },
        update,
    };
})();

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const myCollisions = level.collisionObjects;
let player = CollisionGenerator.ball(level.spawnpoint, level.playerRadius);
let balls = [player];
let futurePlayer = null;
let futurePositionDirection = [0, 0];
let oldTime = -1;
let playerOnGround = false;
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
    camera.frameSize = 20 * level.playerRadius;
    const deltaTimeMs = timeMs - oldTime;
    oldTime = timeMs;
    controls.update(deltaTimeMs);
    if (controls.held.has("R1")) {
        player.velocity = [0, 0];
        player.center = level.spawnpoint;
        player.r = level.playerRadius;
        while(balls.length > 0 ){
            balls.splice(0, balls.length);
        }
        balls = [player]
        futurePlayer = null;
    }

    if (controls.held.has("L1")) {
        player.velocity = [0, 0];
    }

    if (controls.pressed.has("R2") && playerOnGround) {
        futurePlayer = CollisionGenerator.ball(
            [player.x, player.y],
            player.r / Math.sqrt(2)
        );
        player.r = player.r / Math.sqrt(2);
        futurePlayer.coolDownMs = 1000;

        balls.push(futurePlayer);
    }

    if (futurePlayer) {
        let heldDirection = controls.rightStick;
        let magnitude = Math.sqrt(
            heldDirection[0] ** 2 + heldDirection[1] ** 2
        );
        if (magnitude > 0.2) {
            futurePositionDirection = [
                heldDirection[0] / magnitude,
                heldDirection[1] / magnitude,
            ];
        }
        futurePlayer.center = [
            player.x + futurePositionDirection[0] * player.r,
            player.y + futurePositionDirection[1] * player.r,
        ];
        futurePlayer.coolDownMs = 1000;
        player.coolDownMs = 1000;
        if (!controls.held.has("R2")) {
            // yeet
            futurePlayer.velocity = [
                player.velocity[0] +
                    futurePositionDirection[0] * 8 * level.playerRadius,
                player.velocity[1] +
                    futurePositionDirection[1] * 8 * level.playerRadius,
            ];
            player = futurePlayer;
            for(let k = 0; k < 10; k++){
                particleGlobs.add(
                    {
                        position:[(Math.random() * 2 - 1) * player.r + player.x, (Math.random() * 2 - 1) * player.r + player.y],
                        radii: [player.r, player.r * 1.2],
                        color: [1, 1, 1],
                    }
                )
            }
            futurePlayer = null;
        }
    }

    camera.target = player.center;
    camera.update(deltaTimeMs);
    let verticalAcceleration = controls.leftStick[1] * 2 * level.playerRadius;
    if(verticalAcceleration > 0 && !playerOnGround){
        verticalAcceleration *= 0.5;
    }
    player.ax += controls.leftStick[0] * 2 * level.playerRadius;
    player.ay += verticalAcceleration;
    let ballsToRemove = new Set();
    balls.forEach((ball, index) => {
        let result = ball.update(
            deltaTimeMs,
            [...myCollisions.lines, ...myCollisions.arcs],
            [0, -level.playerRadius]
        );
        if (ball === player){
            playerOnGround = result;
        }
        if(!ballsToRemove.has(ball) && ball.coolDownMs === 0){
            for(let i = 0; i < balls.length; i++){
                if(index != i && ball.collisionCheck_ball(balls[i]) && balls[i].coolDownMs === 0 && balls[i] !== player && !ballsToRemove.has(balls[i]) ){
                    ballsToRemove.add(balls[i]);
                    ball.r = Math.sqrt(ball.r **2 + balls[i].r ** 2);
                    ball.coolDownMs = 1000;
                    for(let k = 0; k < 10; k++){
                        particleGlobs.add(
                            {
                                position:[(Math.random() * 2 - 1) * ball.r + ball.x, (Math.random() * 2 - 1) * ball.r + ball.y],
                                radii: [ball.r, ball.r * 1.2],
                                color: [1, 1, 1],
                            }
                        )
                    }
                }
            }
        }
        
    });

  
    for(let i = 0; i < balls.length; i++){
        if(ballsToRemove.has(balls[i])){
            balls.splice(i, 1);
            i--;
            ballsToRemove.delete(balls[i])

        }

    }
    let globsToRemove = new Set();
    particleGlobs.forEach((glob) => {
        glob.radii[0] *= 0.95;
        glob.radii[1] *= 0.95;
        if(glob.radii[0] < 0.00001){
            globsToRemove.add(glob);
        }
    })

    globsToRemove.forEach((g) => particleGlobs.delete(g));
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
    camera.applyMatrix();
    ctx.lineCap = "round";
    ctx.lineWidth = 0.5;
    myCollisions.arcs.forEach((ad) => {
        ctx.beginPath();
        ctx.arc(ad.data[0], ad.data[1], ad.data[2], ad.data[3], ad.data[4]);
        ctx.stroke();
    });

    myCollisions.lines.forEach((ld) => {
        ctx.moveTo(ld.data[0], ld.data[1]);
        ctx.lineTo(ld.data[2], ld.data[3]);
    });
    ctx.stroke();

    // camera.renderDebug();
    Graphics.drawGlobs(
        gl,
        camera.getMatrix(),
        [...balls.map((ball) => ({
            position: ball.center,
            radii: [ball.r, ball.r * 2],
            color: ball === player ? [0.5,1,0.5]:[0.5,0.25,0.25]
        })), ...particleGlobs.values()],
        deltaMs,
        main2dCanvas
    );
    ctx.restore();
};

await Graphics.startWebgl(gl);
requestAnimationFrame(frame);
