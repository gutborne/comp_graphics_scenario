var gl;
var canvas;
var program;
var modelViewMatrix;
var projectionMatrix;
var normalMatrix;
var cameraPosition = vec3(3, 3, 3); // Posição inicial da câmera
var target = vec3(0, 0, 0); // Ponto para onde a câmera está olhando
var up = vec3(0, 1, 0); // Vetor "para cima" da câmera
var lightPosition = vec3(1, 2, 3); // Posição da luz

var radius = 3; // Distância da câmera ao alvo
var theta = 0; // Rotação horizontal
var phi = 0; // Rotação vertical
var zNear = 0.1;
var zFar = 100;
var fov = 45;
var aspect = 1;

var objData = null; // Variável para armazenar os dados do objeto carregado

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // Configurações do WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Fundo preto
    gl.enable(gl.DEPTH_TEST);

    // Carrega os shaders e inicializa os buffers de atributos
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Inicializa as matrizes
    modelViewMatrix = mat4();
    projectionMatrix = mat4();
    normalMatrix = mat4();

    // Configura a matriz de projeção
    updateProjectionMatrix();

    // Configura a matriz de visualização
    updateCamera();

    // Obtém as localizações das variáveis uniformes
    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    var normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    var lightPositionLoc = gl.getUniformLocation(program, "lightPosition");

    // Passa as matrizes e a posição da luz para os shaders
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
    gl.uniform3fv(lightPositionLoc, flatten(lightPosition));

    // Atualiza os valores dos controles deslizantes
    document.getElementById("zNearValue").textContent = zNear;
    document.getElementById("zFarValue").textContent = zFar;
    document.getElementById("radiusValue").textContent = radius;
    document.getElementById("thetaValue").textContent = theta;
    document.getElementById("phiValue").textContent = phi;
    document.getElementById("fovValue").textContent = fov;
    document.getElementById("aspectValue").textContent = aspect;

    // Configura os eventos dos controles deslizantes
    document.getElementById("zNear").addEventListener("input", function (event) {
        zNear = parseFloat(event.target.value);
        document.getElementById("zNearValue").textContent = zNear;
        updateProjectionMatrix();
    });

    document.getElementById("zFar").addEventListener("input", function (event) {
        zFar = parseFloat(event.target.value);
        document.getElementById("zFarValue").textContent = zFar;
        updateProjectionMatrix();
    });

    document.getElementById("radius").addEventListener("input", function (event) {
        radius = parseFloat(event.target.value);
        document.getElementById("radiusValue").textContent = radius;
        updateCamera();
    });

    document.getElementById("theta").addEventListener("input", function (event) {
        theta = parseFloat(event.target.value);
        document.getElementById("thetaValue").textContent = theta;
        updateCamera();
    });

    document.getElementById("phi").addEventListener("input", function (event) {
        phi = parseFloat(event.target.value);
        document.getElementById("phiValue").textContent = phi;
        updateCamera();
    });

    document.getElementById("fov").addEventListener("input", function (event) {
        fov = parseFloat(event.target.value);
        document.getElementById("fovValue").textContent = fov;
        updateProjectionMatrix();
    });

    document.getElementById("aspect").addEventListener("input", function (event) {
        aspect = parseFloat(event.target.value);
        document.getElementById("aspectValue").textContent = aspect;
        updateProjectionMatrix();
    });

    // Configura o evento para carregar o arquivo .obj
    document.getElementById("file-input").addEventListener("change", function (event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var objContent = e.target.result;
                objData = parseOBJ(objContent);
                setupOBJBuffers(objData);
            };
            reader.readAsText(file);
        }
    });

    render();
};

function parseOBJ(text) {
    var vertices = [];
    var normals = [];
    var indices = [];

    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith('v ')) {
            var parts = line.split(/\s+/);
            // Ajusta a escala do
            vertices.push(parseFloat(parts[1]) * 0.1, parseFloat(parts[2]) * 0.1, parseFloat(parts[3]) * 0.1);
        } else if (line.startsWith('vn ')) {
            var parts = line.split(/\s+/);
            normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (line.startsWith('f ')) {
            var parts = line.split(/\s+/);
            for (var j = 1; j < parts.length; j++) {
                var vertex = parts[j].split('/');
                indices.push(parseInt(vertex[0]) - 1);
            }
        }
    }

    return {
        vertices: vertices,
        normals: normals,
        indices: indices
    };
}

function setupOBJBuffers(objData) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertices), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.normals), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objData.indices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    objData.indexBuffer = indexBuffer;
}

function updateCamera() {
    // Atualiza a posição da câmera com base no raio, theta e phi
    cameraPosition = vec3(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(phi),
        radius * Math.cos(theta) * Math.cos(phi)
    );

    // Atualiza a matriz de visualização
    modelViewMatrix = lookAt(cameraPosition, target, up);

    // Passa a matriz de visualização atualizada para o shader
    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

function updateProjectionMatrix() {
    // Atualiza a matriz de projeção com base em zNear, zFar, fov e aspect
    projectionMatrix = perspective(fov, aspect, zNear, zFar);

    // Passa a matriz de projeção atualizada para o shader
    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (objData) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objData.indexBuffer);
        gl.drawElements(gl.TRIANGLES, objData.indices.length, gl.UNSIGNED_SHORT, 0); // Desenha o objeto carregado
    }

    requestAnimationFrame(render);
}
