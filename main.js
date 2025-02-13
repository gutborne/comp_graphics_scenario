import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Custom Perspective Camera
function perspective(fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy * Math.PI / 360); // Convert fovy to radians
    const d = far - near;

    const result = new THREE.Matrix4();
    result.set(
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, -(near + far) / d, -1,
        0, 0, (-2 * near * far) / d, 0
    );

    return result;
}

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Shader Material
const vertexShader = document.getElementById('vertexShader').textContent;
const fragmentShader = document.getElementById('fragmentShader').textContent;
const customMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide // Ensure both sides of the mesh are rendered
});

// GLTF Loader
const loader = new GLTFLoader();
const light = new THREE.AmbientLight(0xffffff, 1); // Soft white light
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);

// Load cube.glb
loader.load('cube.glb', function (gltf) {
    const cube = gltf.scene;
    cube.position.set(0, -50, -50);
    cube.scale.set(1, 1, 1);

    // Traverse the cube and apply custom material
    cube.traverse((child) => {
        if (child.isMesh) {
            child.material = customMaterial;
        }
    });

    scene.add(cube);
}, undefined, function (error) {
    console.error("GLTF Loading Error:", error);
});

// Load sphere_bot.glb
loader.load('sphere_bot.glb', function (gltf) {
    const sphere = gltf.scene;
    sphere.position.set(-2, 0, 0);
    sphere.scale.set(1, 1, 1);

    // Traverse the sphere and apply custom material
    sphere.traverse((child) => {
        if (child.isMesh) {
            child.material = customMaterial;
        }
    });

    scene.add(sphere);
}, undefined, function (error) {
    console.error("GLTF Loading Error:", error);
});

// Add lights
scene.add(light);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Set camera position
camera.position.set(0, 3, 7);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Apply custom projection matrix
    const aspect = window.innerWidth / window.innerHeight;
    const projectionMatrix = perspective(75, aspect, 0.1, 1000);
    camera.projectionMatrix = projectionMatrix;

    renderer.render(scene, camera);
}
animate();

/*
var gl;
var canvas;
var program;
var modelViewMatrix;
var projectionMatrix;
var cameraPosition = vec3(3, 3, 3); // Posição inicial da câmera
var target = vec3(0, 0, 0); // Ponto para onde a câmera está olhando
var up = vec3(0, 1, 0); // Vetor "para cima" da câmera

var isDragging = false;
var lastMouseX = null;
var lastMouseY = null;
var yaw = 0; // Rotação horizontal
var pitch = 0; // Rotação vertical
var radius = length(cameraPosition); // Distância da câmera ao alvo

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // Seis vértices para dois triângulos
    var vertices = [
        vec3(-1, -1, 0),
        vec3(0, 1, 0),
        vec3(1, -1, 0),
        vec3(1, 1, -1),
        vec3(2, 3, -1),
        vec3(3, 1, -1)
    ];

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Inicializa as matrizes
    modelViewMatrix = mat4();
    projectionMatrix = mat4();

    // Configura a matriz de projeção
    projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100);

    // Configura a matriz de visualização
    modelViewMatrix = lookAt(cameraPosition, target, up);

    // Obtém as localizações das variáveis uniformes
    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // Passa as matrizes para os shaders
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Configura os eventos de arrastar o mouse
    canvas.addEventListener("mousedown", function (event) {
        isDragging = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });

    canvas.addEventListener("mousemove", function (event) {
        if (isDragging) {
            var deltaX = event.clientX - lastMouseX;
            var deltaY = event.clientY - lastMouseY;

            yaw += deltaX * 0.01; // Atualiza a rotação horizontal
            pitch += deltaY * 0.01; // Atualiza a rotação vertical

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;

            updateCamera();
        }
    });

    canvas.addEventListener("mouseup", function (event) {
        isDragging = false;
    });

    // Configura o evento de teclado para o zoom
    document.addEventListener("keydown", function (event) {
        if (event.key === "ArrowUp") { // Tecla "up" pressionada
            radius -= 0.1; // Aproxima a câmera
        } else if (event.key === "ArrowDown") { // Tecla "down" pressionada
            radius += 0.1; // Afasta a câmera
        }

        updateCamera();
    });

    render();
};

function updateCamera() {
    // Atualiza a posição da câmera com base no raio, yaw e pitch
    cameraPosition = vec3(
        radius * Math.cos(pitch) * Math.sin(yaw),
        radius * Math.sin(pitch),
        radius * Math.cos(pitch) * Math.cos(yaw)
    );

    // Atualiza a matriz de visualização
    modelViewMatrix = lookAt(cameraPosition, target, up);

    // Passa a matriz de visualização atualizada para o shader
    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3); // Desenha o primeiro triângulo
    gl.drawArrays(gl.TRIANGLES, 3, 3); // Desenha o segundo triângulo
    requestAnimationFrame(render);
}*/