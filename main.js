let gl;
let shaderProgram;
let meshes = {}; // Store multiple meshes
let vertexPositionAttribute, vertexColorAttribute;
let perspectiveMatrix;
let modelViewMatrices = {}; // Store different model positions

async function init() {
    const canvas = document.getElementById("glCanvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Unable to initialize WebGL.");
        return;
    }
    gl.clearColor(0.1, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    await initShaders();
    await loadOBJ("bowling", "/bowling.obj", [-1.6, -2.0, -5.0]);
    await loadOBJ("vase_A", "/vase_A.obj", [0.0, -0.18, -0.5]);

    render();
}

async function initShaders() {
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uPerspectiveMatrix;
        varying lowp vec4 vColor;
        void main(void) {
            gl_Position = uPerspectiveMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
    `;
    const fsSource = `
        varying lowp vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
        }
    `;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Shader program failed to initialize: " + gl.getProgramInfoLog(shaderProgram));
        return;
    }
    gl.useProgram(shaderProgram);
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);
    vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Shader compilation error: " + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

async function loadOBJ(name, modelPath, position) {
    const response = await fetch(modelPath);
    const text = await response.text();
    const obj = new OBJ.Mesh(text);
    OBJ.initMeshBuffers(gl, obj);
    const colors = [];
    for (let i = 0; i < obj.vertices.length / 3; i++) {
        colors.push(0.5, 0.5, 0.5, 1.0);
    }
    obj.vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    obj.vertexColorBuffer.itemSize = 4;
    obj.vertexColorBuffer.numItems = colors.length / 4;
    meshes[name] = obj;
    modelViewMatrices[name] = mat4.create();
    mat4.translate(modelViewMatrices[name], modelViewMatrices[name], position);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
    
    for (const name in meshes) {
        gl.bindBuffer(gl.ARRAY_BUFFER, meshes[name].vertexBuffer);
        gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, meshes[name].vertexColorBuffer);
        gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes[name].indexBuffer);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uPerspectiveMatrix'), false, perspectiveMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'), false, modelViewMatrices[name]);
        gl.drawElements(gl.TRIANGLES, meshes[name].indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    requestAnimationFrame(render);
}

init();
