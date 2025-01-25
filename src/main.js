// @ts-check
import {
    matrix3x3Multiply,
    inverseMatrix3x3,
    vectorMatrix3x3Multiply,
} from "./matrix.js";
import { Graphics} from "./webgl/graphics.js";
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
    ctx.resetTransform();
    // ctx.clearRect(0, 0, main2dCanvas.width, main2dCanvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, main2dCanvas.width, main2dCanvas.height);
    ctx.restore();
    // TODO code to clear other canvases
};

const camera = (() => {
    let position = [0.5, 0.5];
    let target = [0, 0];
    let targetFrameHard = 0.75;
    let targetFrameSoft = 0.5;
    let frameSize = 10;
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
                (target[0] - softFrame[0][0]) * (deltaMs / 1000) * frameSize;
        }
        if (target[0] > softFrame[1][0]) {
            // right of frame
            position[0] +=
                (target[0] - softFrame[1][0]) * (deltaMs / 1000) * frameSize;
        }
        if (target[1] < softFrame[0][1]) {
            // below the frame
            position[1] +=
                (target[1] - softFrame[0][1]) * (deltaMs / 1000) * frameSize;
        }
        if (target[1] > softFrame[1][1]) {
            // above frame
            position[1] +=
                (target[1] - softFrame[1][1]) * (deltaMs / 1000) * frameSize;
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
        },
        center: () => {
            position = target;
        },
        update,
    };
})();

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
let ob = [0, 0];
let testGlobs = [];
let testGlobsVel = [];
for(let i = 0; i < 100; i++){
    testGlobs.push({
        radii:[0.2, 0.3],
        position:[Math.random(), Math.random()],
    })
    testGlobsVel.push([Math.random(), Math.random()])
}
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
    ob = [Math.cos(timeMs / 2000), 2 * Math.sin(timeMs / 2000)];
    camera.target = ob;
    camera.update(deltaTimeMs);
    testGlobs.forEach((glob, index)=>{
        glob.position[0] += deltaTimeMs / 1000 * testGlobsVel[index][0];
        glob.position[1] += deltaTimeMs / 1000 * testGlobsVel[index][1];

        if(glob.position[0] > 3){
            testGlobsVel[index][0] = -Math.abs(testGlobsVel[index][0]);
        }
        if(glob.position[0] < -3){
            testGlobsVel[index][0] = Math.abs(testGlobsVel[index][0]);
        }
        if(glob.position[1] > 3){
            testGlobsVel[index][1] = -Math.abs(testGlobsVel[index][1]);
        }
        if(glob.position[1] < -3){
            testGlobsVel[index][1] = Math.abs(testGlobsVel[index][1]);
        }
    })
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
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = "orange";
    ctx.fillRect(ob[0], ob[1], 0.05, 0.05);
    camera.renderDebug();
    Graphics.drawGlobs(gl, camera.getMatrix(), testGlobs, main2dCanvas)
    ctx.restore();
};

await Graphics.startWebgl(gl);
requestAnimationFrame(frame);
