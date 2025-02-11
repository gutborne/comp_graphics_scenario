import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth-200, window.innerHeight-200);
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );


const loader = new GLTFLoader();
const light = new THREE.AmbientLight(0xffffff, 1); // Soft white light
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);

loader.load('cube.glb', function (gltf) {
    const cube = gltf.scene;
    cube.position.set(0, -50, -50);  
    cube.scale.set(1, 1, 1);

    // Traverse the cube and apply grey material
    cube.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Grey color
        }
    });

    scene.add(cube);

    // Add lights (only once, not in both loaders)
}, undefined, function (error) {
    console.error("GLTF Loading Error:", error);
});

loader.load( 'sphere_bot.glb', function ( gltf ) {
	const sphere = gltf.scene;
    sphere.position.set(-2, 0, 0);  // Center the sphere
	console.log(sphere.position);
    sphere.scale.set(1, 1, 1);  // Adjust scale if needed
    scene.add(sphere);
}, undefined, function ( error ) {
	console.error("GLTF Loading Error:", error);
});
scene.add(light);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);
camera.position.set(0, 3, 7); //  Move camera back
function animate() {
	requestAnimationFrame( animate );  // Keeps updating the scene
	renderer.render( scene, camera );
}
animate();
