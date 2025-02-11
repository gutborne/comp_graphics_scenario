import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );


const loader = new GLTFLoader();

loader.load( 'cube.glb', function ( gltf ) {
    const model = gltf.scene;
    model.position.set(0, -50, -50);  // ✅ Center the model
    model.scale.set(1, 1, 1);  // ✅ Adjust scale if needed
    scene.add(model);
	const light = new THREE.AmbientLight(0xffffff, 1); // Soft white light
	scene.add(light);
	const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
	directionalLight.position.set(5, 5, 5);
	scene.add(directionalLight);
}, undefined, function ( error ) {
    console.error("GLTF Loading Error:", error);
});
loader.load( 'sphere_bot.glb', function ( gltf ) {
    const model = gltf.scene;
    model.position.set(0, 0, 0);  // ✅ Center the model
    model.scale.set(1, 1, 1);  // ✅ Adjust scale if needed
    scene.add(model);
	const light = new THREE.AmbientLight(0xffffff, 1); // Soft white light
	scene.add(light);
	const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
	directionalLight.position.set(5, 5, 5);
	scene.add(directionalLight);
}, undefined, function ( error ) {
	console.error("GLTF Loading Error:", error);
});
camera.position.set(0, 3, 7); // ✅ Move camera back
function animate() {
	requestAnimationFrame( animate );  // ✅ Keeps updating the scene
	renderer.render( scene, camera );
}
animate();
