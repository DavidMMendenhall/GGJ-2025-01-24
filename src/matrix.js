// @ts-check
/**
 *
 * @param {number[]} mat
 * @param {number[]} vec
 * @returns
 */
let vectorMatrix3x3Multiply = (mat, vec) => {
    return [
        mat[0] * vec[0] + mat[1] * vec[1] + mat[2],
        mat[3] * vec[0] + mat[4] * vec[1] + mat[5],
        mat[6] * vec[0] + mat[7] * vec[1] + mat[8],
    ];
};

/**
 *
 * @param {number[]} matrixA
 * @param {number[]} matrixB
 * @returns
 */
let matrix3x3Multiply = (matrixA, matrixB) => {
    const result = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    // Multiply the matrices
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            for (let k = 0; k < 3; k++) {
                result[row * 3 + col] +=
                    matrixA[row * 3 + k] * matrixB[k * 3 + col];
            }
        }
    }

    return result;
};

/**
 *
 * @param {number[]} matrix
 * @returns
 */
let inverseMatrix3x3 = (matrix) => {
    const [a, b, c, d, e, f, g, h, i] = matrix;

    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

    if (det === 0) {
        throw new Error("Matrix is singular and cannot be inverted.");
    }

    const adjugate = [
        e * i - f * h,
        -(b * i - c * h),
        b * f - c * e,
        -(d * i - f * g),
        a * i - c * g,
        -(a * f - c * d),
        d * h - e * g,
        -(a * h - b * g),
        a * e - b * d,
    ];

    const inverse = adjugate.map((value) => value / det);

    return inverse;
};

export { inverseMatrix3x3, matrix3x3Multiply, vectorMatrix3x3Multiply };
