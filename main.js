let gl; // WebGL rendering context
let shaderProgram; // Shader program for rendering
let mesh; // Will hold the loaded OBJ mesh
let vertexPositionAttribute, vertexColorAttribute; // Attributes for vertex position and color
let perspectiveMatrix, modelViewMatrix; // Matrices for perspective and model-view transformations

async function init() {
    // Get the canvas element and initialize WebGL context
    const canvas = document.getElementById("glCanvas");
    gl = canvas.getContext("webgl");

    // Check if WebGL is supported
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // Set the clear color to grey (background color)
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    // Enable depth testing to ensure proper rendering of 3D objects
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Use LEQUAL for depth testing

    // Initialize shaders (vertex and fragment shaders)
    await initShaders();

    // Load the OBJ model
    await loadOBJ('/pokeball.obj'); // Replace with the path to your OBJ file

    // Start the rendering loop
    render();
}

async function initShaders() {
    // Vertex shader source code
    const vsSource = `
        attribute vec4 aVertexPosition; // Vertex position attribute
        attribute vec4 aVertexColor; // Vertex color attribute

        uniform mat4 uModelViewMatrix; // Model-view matrix
        uniform mat4 uPerspectiveMatrix; // Perspective matrix

        varying lowp vec4 vColor; // Pass color to fragment shader

        void main(void) {
            // Transform vertex position using perspective and model-view matrices
            gl_Position = uPerspectiveMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor; // Pass vertex color to fragment shader
        }
    `;

    // Fragment shader source code
    const fsSource = `
        varying lowp vec4 vColor; // Receive color from vertex shader

        void main(void) {
            // Set the fragment color to the interpolated vertex color
            gl_FragColor = vColor;
        }
    `;

    // Create and compile the vertex shader
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);

    // Create and compile the fragment shader
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create a shader program and attach the shaders
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    // Link the shader program
    gl.linkProgram(shaderProgram);

    // Check if the shader program linked successfully
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    // Use the shader program for rendering
    gl.useProgram(shaderProgram);

    // Get the attribute location for vertex position
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute); // Enable the attribute

    // Get the attribute location for vertex color
    vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute); // Enable the attribute
}

function createShader(gl, type, source) {
    // Create a shader of the given type (vertex or fragment)
    const shader = gl.createShader(type);

    // Attach the shader source code
    gl.shaderSource(shader, source);

    // Compile the shader
    gl.compileShader(shader);

    // Check if the shader compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

async function loadOBJ(modelPath) {
    // Fetch the OBJ file
    const response = await fetch(modelPath);
    const text = await response.text();

    // Parse the OBJ file into a mesh
    const obj = new OBJ.Mesh(text);

    // Initialize WebGL buffers for the mesh
    OBJ.initMeshBuffers(gl, obj);

    // Create a default color buffer (dark grey color for all vertices)
    const colors = [];
    for (let i = 0; i < obj.vertices.length / 3; i++) {
        colors.push(0.2, 0.2, 0.2, 0.89); // RGBA (dark grey with some transparency)
    }

    // Create and bind a buffer for vertex colors
    obj.vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Store metadata about the color buffer
    obj.vertexColorBuffer.itemSize = 4; // RGBA = 4 components
    obj.vertexColorBuffer.numItems = colors.length / 4;

    // Store the mesh for rendering
    mesh = obj;
}

function render() {
    // Clear the canvas with the clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix for the camera
    perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix,
        45 * Math.PI / 180, // Field of view (45 degrees)
        gl.canvas.clientWidth / gl.canvas.clientHeight, // Aspect ratio
        0.1, // Near clipping plane
        100.0 // Far clipping plane
    );

    // Create a model-view matrix and translate the object back along the Z-axis
    modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -4.0]);

    // Bind the vertex position buffer and set the attribute pointer
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Bind the vertex color buffer and set the attribute pointer
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexColorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    // Bind the index buffer for rendering
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);

    // Pass the perspective and model-view matrices to the shader
    gl.uniformMatrix4fv(
        gl.getUniformLocation(shaderProgram, 'uPerspectiveMatrix'),
        false,
        perspectiveMatrix
    );
    gl.uniformMatrix4fv(
        gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        false,
        modelViewMatrix
    );

    // Draw the mesh using the index buffer
    gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    // Request the next frame for continuous rendering
    requestAnimationFrame(render);
}

// Start the initialization process
init();
