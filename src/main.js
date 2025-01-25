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
};

const clear = () => {
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, main2dCanvas.width, main2dCanvas.height);
    ctx.restore();
    // TODO code to clear other canvases
};

const camera = (() => {
    let position = [0.5, 0.5];
    let target = [0, 0];
    let targetFrameHard = 0.75;
    let targetFrameSoft = 0.5;
    let frameSize = 3;
    let zoom = 2/frameSize;

    let vectorMatrixMultiply = (mat, vec) => {
        return [
            mat[0] * vec[0] + mat[1] * vec[1] + mat[2],
            mat[3] * vec[0] + mat[4] * vec[1] + mat[5],
            mat[6] * vec[0] + mat[7] * vec[1] + mat[8],
        ]
    }

    let matrix3x3Multiply = (matrixA, matrixB) => {
        const result = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        // Multiply the matrices
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            for (let k = 0; k < 3; k++) {
              result[row * 3 + col] += matrixA[row * 3 + k] * matrixB[k * 3 + col];
            }
          }
        }
      
        return result;
    }

    let getMatrix = () => {
        let aspect = main2dCanvas.height / main2dCanvas.width;
        let aspectMatrix = [
            aspect*zoom, 0, 0,
            0, zoom, 0, 
            0, 0, 1,
        ];
        let translation = [
            1, 0, -position[0],
            0, 1, -position[1], 
            0, 0, 1,
        ];

        return matrix3x3Multiply(aspectMatrix, translation)
    }

    let inverseMatrix3x3 = (matrix) => {
        const [a, b, c, d, e, f, g, h, i] = matrix;

        const det =
          a * (e * i - f * h) -
          b * (d * i - f * g) +
          c * (d * h - e * g);
      
        if (det === 0) {
          throw new Error("Matrix is singular and cannot be inverted.");
        }
      
        const adjugate = [
          e * i - f * h, -(b * i - c * h), b * f - c * e,
          -(d * i - f * g), a * i - c * g, -(a * f - c * d),
          d * h - e * g, -(a * h - b * g), a * e - b * d
        ];
      
        const inverse = adjugate.map(value => value / det);
      
        return inverse;
    }

    let getInverse = () => {
        return inverseMatrix3x3(getMatrix());
    }

    let applyMatrix = () => {
        let mat = getMatrix();
        ctx.transform(mat[0], mat[3], mat[1], mat[4], mat[2], mat[5]);
    }
    let renderDebug = () => {
        ctx.save();
        let s = 0.025 * frameSize;
        ctx.lineWidth = 0.025 * frameSize;
        let mat = getInverse();

        let top_left = vectorMatrixMultiply(mat, [-1, 1]);
        let down_left = vectorMatrixMultiply(mat, [-1, -1]); 
        let down_right = vectorMatrixMultiply(mat, [1, 1]); 
        let top_right = vectorMatrixMultiply(mat, [1,-1]); 
        
        let hardFrame = [
            vectorMatrixMultiply(mat, [-targetFrameHard, targetFrameHard]),
            vectorMatrixMultiply(mat, [-targetFrameHard,-targetFrameHard]),
            vectorMatrixMultiply(mat, [ targetFrameHard,-targetFrameHard]),
            vectorMatrixMultiply(mat, [ targetFrameHard, targetFrameHard])];
        let softFrame = [
            vectorMatrixMultiply(mat, [-targetFrameSoft, targetFrameSoft]),
            vectorMatrixMultiply(mat, [-targetFrameSoft,-targetFrameSoft]),
            vectorMatrixMultiply(mat, [ targetFrameSoft,-targetFrameSoft]),
            vectorMatrixMultiply(mat, [ targetFrameSoft, targetFrameSoft])];

        ctx.fillStyle = "red";
        ctx.fillRect(top_left[0] - s, top_left[1] - s, s * 2, s * 2);
        ctx.fillStyle = "green";
        ctx.fillRect(down_left[0] - s, down_left[1] - s, s * 2, s * 2);
        ctx.fillStyle = "blue";
        ctx.fillRect(down_right[0] - s, down_right[1] - s, s * 2, s * 2);
        ctx.fillStyle = "yellow";
        ctx.fillRect(top_right[0] - s, top_right[1] - s, s * 2, s * 2);

        ctx.strokeStyle = "red"
        ctx.beginPath();
        ctx.moveTo(hardFrame[0][0], hardFrame[0][1]);
        hardFrame.forEach((value) => {
            ctx.lineTo(value[0], value[1]);
        })
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = "green"
        ctx.beginPath();
        ctx.moveTo(softFrame[0][0], softFrame[0][1]);
        softFrame.forEach((value) => {
            ctx.lineTo(value[0], value[1]);
        })
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    let update = (deltaMs) => {
        let mat = getInverse();
        let hardFrame = [
            vectorMatrixMultiply(mat, [-targetFrameHard,-targetFrameHard]),
            vectorMatrixMultiply(mat, [ targetFrameHard, targetFrameHard])];
        let softFrame = [
            vectorMatrixMultiply(mat, [-targetFrameSoft,-targetFrameSoft]),
            vectorMatrixMultiply(mat, [ targetFrameSoft, targetFrameSoft])];

        // hard frame
        if(target[0] < hardFrame[0][0]){ // left of frame
            position[0] += target[0] - hardFrame[0][0];
        }
        if(target[0] > hardFrame[1][0]){ // right of frame
            position[0] += target[0] - hardFrame[1][0];
        }
        if(target[1] < hardFrame[0][1]){ // below the frame
            position[1] += target[1] - hardFrame[0][1];
        }
        if(target[1] > hardFrame[1][1]){ // above frame
            position[1] += target[1] - hardFrame[1][1];
        }

        // soft frame
        if(target[0] < softFrame[0][0]){ // left of frame
            position[0] += (target[0] - softFrame[0][0]) * (deltaMs / 1000) * frameSize;
        }
        if(target[0] > softFrame[1][0]){ // right of frame
            position[0] += (target[0] - softFrame[1][0]) * (deltaMs / 1000)* frameSize;
        }
        if(target[1] < softFrame[0][1]){ // below the frame
            position[1] += (target[1] - softFrame[0][1]) * (deltaMs / 1000)* frameSize;
        }
        if(target[1] > softFrame[1][1]){ // above frame
            position[1] += (target[1] - softFrame[1][1]) * (deltaMs / 1000)* frameSize;
        }

    }
    return {
        getMatrix,
        applyMatrix,
        renderDebug,
        set target(value){
            target = value;
        },
        set frameSize(value){
            frameSize = value;
        },
        center: ()=>{
            position = target;
        },
        update,
    }
})();

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
let ob = [0, 0];
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
    ob = [2 * Math.cos(timeMs / 2000), 2 * Math.sin(timeMs / 2000)];
    camera.target = ob;
    camera.update(deltaTimeMs);
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
    ctx.fillStyle = "orange"
    ctx.fillRect(ob[0], ob[1], 0.05, 0.05);
    camera.renderDebug();
    ctx.restore();

};

requestAnimationFrame(frame);
