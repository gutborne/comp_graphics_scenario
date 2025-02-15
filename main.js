let gl;
let shaderProgram;
let meshes = {}; // Store multiple meshes
let meshTextures = {}; // Store textures for each model
let vertexPositionAttribute, vertexTexCoordAttribute;
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
    //await loadOBJ("pineapple", "/pineapple2.obj", "/pineapple2.jpeg", [-1.6, -2.0, -5.0]);
    await loadOBJ("vase_A", "/vase_A.obj", "/textures/Vase_A_16Bits_BaseColor.png", [0.0, -0.18, -0.5]);

    render();
}

async function initShaders() {
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTexCoord;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uPerspectiveMatrix;
        varying highp vec2 vTexCoord;
        void main(void) {
            gl_Position = uPerspectiveMatrix * uModelViewMatrix * aVertexPosition;
            vTexCoord = aTexCoord;
        }
    `;
    const fsSource = `
        varying highp vec2 vTexCoord;
        uniform sampler2D uTexture;
        void main(void) {
            gl_FragColor = texture2D(uTexture, vTexCoord);
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
    vertexTexCoordAttribute = gl.getAttribLocation(shaderProgram, "aTexCoord");
    gl.enableVertexAttribArray(vertexTexCoordAttribute);
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

async function loadOBJ(name, modelPath, texturePath, position) {
    const response = await fetch(modelPath);
    const text = await response.text();
    const obj = new OBJ.Mesh(text);
    OBJ.initMeshBuffers(gl, obj);

    // Load Texture
    const texture = await loadTexture(texturePath);
    meshTextures[name] = texture;

    meshes[name] = obj;
    modelViewMatrices[name] = mat4.create();
    mat4.translate(modelViewMatrices[name], modelViewMatrices[name], position);
}

function loadTexture(url) {
    return new Promise((resolve) => {
        const texture = gl.createTexture();
        const image = new Image();
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            resolve(texture);
        };
        image.src = url;
    });
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
    
    for (const name in meshes) {
        gl.bindBuffer(gl.ARRAY_BUFFER, meshes[name].vertexBuffer);
        gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, meshes[name].textureBuffer);
        gl.vertexAttribPointer(vertexTexCoordAttribute, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes[name].indexBuffer);

        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uPerspectiveMatrix'), false, perspectiveMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'), false, modelViewMatrices[name]);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, meshTextures[name]);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "uTexture"), 0);

        gl.drawElements(gl.TRIANGLES, meshes[name].indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    requestAnimationFrame(render);
}

init();

//textures
//camera: rotation control, translation control and depth
