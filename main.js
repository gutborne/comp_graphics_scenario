let gl;
let shaderProgram;
let mesh; // Will hold the loaded OBJ mesh
let vertexPositionAttribute, vertexColorAttribute;
let perspectiveMatrix, modelViewMatrix;

async function init() {
    const canvas = document.getElementById("glCanvas");
    gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    //it should be grey background, but instead it will change the object's color
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Initialize shaders
    await initShaders();

    // Load the OBJ model
    await loadOBJ('/pokeball.obj'); // Replace 'your_model.obj' with the path to your OBJ file

    // Start rendering
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
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    gl.useProgram(shaderProgram);

    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

   vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute); // Enable the color attribute
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

async function loadOBJ(modelPath) {
    const response = await fetch(modelPath);
    const text = await response.text();

    const obj = new OBJ.Mesh(text);
    OBJ.initMeshBuffers(gl, obj); // Initialize buffers

    // Create a default color buffer (white color for all vertices)
    const colors = [];
    for (let i = 0; i < obj.vertices.length / 3; i++) {
        colors.push(0.2, 0.2, 0.2, 0.89); // RGBA (white)
    }

    obj.vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    obj.vertexColorBuffer.itemSize = 4; // RGBA = 4 components
    obj.vertexColorBuffer.numItems = colors.length / 4;

    mesh = obj;
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix,
        45 * Math.PI / 180,
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        0.1,
        100.0);

    modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]); // Translate back
    
    // Vertex position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Vertex color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexColorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);

    gl.uniformMatrix4fv(
        gl.getUniformLocation(shaderProgram, 'uPerspectiveMatrix'),
        false,
        perspectiveMatrix);
    gl.uniformMatrix4fv(
        gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        false,
        modelViewMatrix);

    gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
}

init();
