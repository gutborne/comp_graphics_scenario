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