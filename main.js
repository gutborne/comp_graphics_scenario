let gl;
let shaderProgram;
let meshes = {}; // Store multiple meshes
let meshTextures = {}; // Store textures for each model
let vertexPositionAttribute, vertexTexCoordAttribute;
let perspectiveMatrix;
let modelViewMatrices = {}; // Store different model positions

// Camera parameters
let cameraDepth = 5.0; // Distance from the scene
let cameraRotateX = 0; // Rotation around the X-axis (pitch)
let cameraRotateY = 0; // Rotation around the Y-axis (yaw)
let cameraTranslateX = 0; // Translation along the X-axis
let cameraTranslateY = 0; // Translation along the Y-axis
let fov = 45; // Field of view
let aspectRatio = 1.0; // Aspect ratio

// View matrix for the camera
let viewMatrix = mat4.create();

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
    await loadOBJ("vase_A", "/vase_A.obj", "/textures/Vase_A_16Bits_BaseColor.png", [0.0, -0.18, -0.5]);
    await loadOBJ("vase_B", "/vase_B.obj", "/textures/Vase_B_16Bits_BaseColor.png", [0.1, -0.18, -0.5]);
    await loadOBJ("vase_C", "/vase_C.obj", "/textures/Vase_C_16Bits_BaseColor.png", [-0.1, -0.18, -0.5]);

    // Add event listeners for sliders
    document.getElementById("depthSlider").addEventListener("input", (event) => {
        cameraDepth = parseFloat(event.target.value);
    });
    document.getElementById("rotateXSlider").addEventListener("input", (event) => {
        cameraRotateX = parseFloat(event.target.value);
    });
    document.getElementById("rotateYSlider").addEventListener("input", (event) => {
        cameraRotateY = parseFloat(event.target.value);
    });
    document.getElementById("translateXSlider").addEventListener("input", (event) => {
        cameraTranslateX = parseFloat(event.target.value);
    });
    document.getElementById("translateYSlider").addEventListener("input", (event) => {
        cameraTranslateY = parseFloat(event.target.value);
    });
    document.getElementById("fovSlider").addEventListener("input", (event) => {
        fov = parseFloat(event.target.value);
    });
    document.getElementById("aspectRatioSlider").addEventListener("input", (event) => {
        aspectRatio = parseFloat(event.target.value);
    });

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

function updateViewMatrix() {
    // Reset the view matrix
    mat4.identity(viewMatrix);

    // Translate the camera back by `cameraDepth`
    mat4.translate(viewMatrix, viewMatrix, [0, 0, -cameraDepth]);

    // Rotate the camera around the X and Y axes
    mat4.rotateX(viewMatrix, viewMatrix, cameraRotateX * Math.PI / 180);
    mat4.rotateY(viewMatrix, viewMatrix, cameraRotateY * Math.PI / 180);

    // Translate the camera horizontally and vertically
    mat4.translate(viewMatrix, viewMatrix, [cameraTranslateX, cameraTranslateY, 0]);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update the perspective matrix
    perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, fov * Math.PI / 180, aspectRatio, 0.1, 100.0);

    // Update the view matrix based on camera parameters
    updateViewMatrix();

    for (const name in meshes) {
        gl.bindBuffer(gl.ARRAY_BUFFER, meshes[name].vertexBuffer);
        gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, meshes[name].textureBuffer);
        gl.vertexAttribPointer(vertexTexCoordAttribute, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes[name].indexBuffer);

        // Combine the view matrix with the model matrix
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, viewMatrix, modelViewMatrices[name]);

        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uPerspectiveMatrix'), false, perspectiveMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'), false, modelViewMatrix);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, meshTextures[name]);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "uTexture"), 0);

        gl.drawElements(gl.TRIANGLES, meshes[name].indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    requestAnimationFrame(render);
}

init();

//problems:
//1.objects are in low-definition
//2.problems with rotation and translation
