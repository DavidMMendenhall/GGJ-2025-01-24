// @ts-check

import { matrix3x3Multiply, matrix3x3Transpose } from "../matrix.js";


/**
             * Creates a disk model of a given size
             * @param {number} resolution 
             * @param {number} radius
             * @returns 
             */
let createDiskModel = (resolution, radius) => {
    if(resolution < 3){
        throw "resolution must be 3 or greater";
    }
    let step = Math.PI * 2 / resolution;
    let vertices = [0,0];
    let index = [];

    // calculate radius scale needed to inscribe circle
    let p1 = [Math.cos(0) * radius, Math.sin(0) * radius];
    let p2 = [Math.cos(step) * radius, Math.sin(step) * radius];
    let p3 = [(p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5];
    let p3Magnitude = Math.sqrt(p3[0] ** 2 + p3[1] ** 2);
    let radiusScale = radius / p3Magnitude;
    radius *= radiusScale;

    for(let i = 1; i <= resolution; i++){
        vertices.push(Math.cos(-i * step) * radius, Math.sin(-i * step) * radius);
        index.push(0, i, i + 1);
    }
    index[index.length - 1] = 1;

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(index),
    }
}

/**
 * 
 * @param {string} path 
 */
const fetchFile = async (path) => {
    return await fetch(path).then(r => r.text()).then(t => t);
}

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {string} vertexShaderSource 
 * @param {string} fragmentShaderSource 
 * @returns 
 */
const buildProgram = (gl, vertexShaderSource, fragmentShaderSource) => {
			
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    if(!vertShader){
        throw "Failed to build vertex shader";
    }
    gl.shaderSource(vertShader, vertexShaderSource);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        throw "ERROR IN VERTEX SHADER : " + gl.getShaderInfoLog(vertShader);
    }

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    if(!fragShader){
        throw "Failed to build fragment shader";
    }
    gl.shaderSource(fragShader, fragmentShaderSource);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        throw "ERROR IN FRAG SHADER : " + gl.getShaderInfoLog(fragShader);
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw "Unknown error in program";
    }

   return program;
}


/**
 * 
 * @param {WebGL2RenderingContext} gl 
 */
const buildTexture = (gl) => {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}

const diskModel = createDiskModel(5, 1);


/**
 * @type {{frameBuffer: null | WebGLFramebuffer, texture: null | WebGLTexture}}
 */
const densityRenderData = {
    frameBuffer: null,
    texture: null,
};

/** @type {Object.<string, WebGLProgram>} */
const programs = {

}

/** @type {Object.<string, WebGLVertexArrayObject>} */
const vertexArrayBuffers = {

}

/** @type {Object.<string, WebGLBuffer>} */
const vertexBuffers = {

}

/** @type {Object.<string, WebGLUniformLocation | null>} */
const uniforms = {

}



/**
 * 
 * @param {WebGL2RenderingContext} gl 
 */
const startWebgl = async (gl) => {
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    densityRenderData.texture = buildTexture(gl);
    densityRenderData.frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER,densityRenderData.frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, densityRenderData.texture, 0);


    vertexArrayBuffers.density = gl.createVertexArray();
    vertexArrayBuffers.glob = gl.createVertexArray();

    vertexBuffers.position = gl.createBuffer();
    vertexBuffers.centers = gl.createBuffer();
    vertexBuffers.radius = gl.createBuffer();
    vertexBuffers.model = gl.createBuffer();
    vertexBuffers.face = gl.createBuffer();


    vertexBuffers.screenPos = gl.createBuffer();

    let densitySource = [
        await fetchFile("/src/webgl/shaders/density_vert.glsl"),
        await fetchFile("/src/webgl/shaders/density_frag.glsl"),
    ];

    programs.density = buildProgram(gl, densitySource[0], densitySource[1]);
    gl.useProgram(programs.density);
    gl.bindVertexArray(vertexArrayBuffers.density);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const pos_loc = gl.getAttribLocation(programs.density, "pos");
    const center_loc = gl.getAttribLocation(programs.density, "center");
    const rad_loc = gl.getAttribLocation(programs.density, "radius");
    const model_loc = gl.getAttribLocation(programs.density, "model");

    uniforms.camera = gl.getUniformLocation(programs.density, "camera");
    
    gl.enableVertexAttribArray(pos_loc);
    gl.enableVertexAttribArray(center_loc);
    gl.enableVertexAttribArray(rad_loc);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.model);
    gl.bufferData(gl.ARRAY_BUFFER, 3 * 3 * 4, gl.DYNAMIC_DRAW)

    for(let i = 0; i < 3; i++){
        let cLoc = model_loc + i;
        let offset = i * 3 * 4;
        
        gl.enableVertexAttribArray(cLoc);
        gl.vertexAttribPointer(cLoc, 3, gl.FLOAT, false, 3 * 3 * 4, offset);
        gl.vertexAttribDivisor(cLoc, 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, diskModel.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(pos_loc, 2, gl.FLOAT, false, 2 * 4, 0);
    // gl.vertexAttribDivisor(pos_loc, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.centers);
    gl.bufferData(gl.ARRAY_BUFFER, 2 * 4, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(center_loc, 2, gl.FLOAT, false, 2 * 4, 0);
    gl.vertexAttribDivisor(center_loc, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.radius);
    gl.bufferData(gl.ARRAY_BUFFER, 2 * 4, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(rad_loc, 2, gl.FLOAT, false, 2 * 4, 0);
    gl.vertexAttribDivisor(rad_loc, 1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexBuffers.face);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, diskModel.indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);


}

/** 
 * @typedef GlobRenderData 
 * @prop {number[]} position
 * @prop {number[]} radii
 * 
*/

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {number[]} cameraMatrix
 * @param {GlobRenderData[]} globs
 */
const drawGlobs = (gl, cameraMatrix, globs) => {

    let globModelData = new Float32Array(9 * globs.length);
    let globRadiiData = new Float32Array(2 * globs.length);
    let globCenterData = new Float32Array(2 * globs.length);

    globs.forEach((glob, index) => {
        globCenterData[2 * index] = glob.position[0];
        globCenterData[2 * index + 1] = glob.position[1];
        globRadiiData[2 * index] = glob.radii[0];
        globRadiiData[2 * index + 1] = glob.radii[1];
        let scaleMatrix = [globRadiiData[1], 0, 0, 
            0, globRadiiData[1], 0,
            0, 0, 1];
        let translationMatrix = [
            1, 0, glob.position[0],
            0, 1, glob.position[1],
            0, 0, 1
        ];
        // debugger;
        let modelMat = matrix3x3Transpose(matrix3x3Multiply(translationMatrix, scaleMatrix));
        modelMat.forEach((x, i) => {
            globModelData[index * 9 + i] = x;
        })
    })

    gl.useProgram(programs.density);
    gl.bindVertexArray(vertexArrayBuffers.density);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.uniformMatrix3fv(uniforms.camera, true, cameraMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.centers);
    gl.bufferData(gl.ARRAY_BUFFER, globCenterData, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.radius);
    gl.bufferData(gl.ARRAY_BUFFER, globRadiiData, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.model);
    gl.bufferData(gl.ARRAY_BUFFER, globModelData, gl.DYNAMIC_DRAW);
    // debugger
    gl.drawElementsInstanced(gl.TRIANGLES, diskModel.indices.length, gl.UNSIGNED_SHORT, 0, globs.length);
    gl.bindVertexArray(null);
    gl.flush();
}

const Graphics = {
    startWebgl,
    drawGlobs,
}
export {Graphics}