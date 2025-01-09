import { useEffect } from 'react';
import {
	AmbientLight,
	AxesHelper,
	Clock,
	Color,
	DirectionalLight,
	DirectionalLightHelper,
	DoubleSide,
	InstancedMesh,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Object3D,
	PerspectiveCamera,
	PlaneGeometry,
	Scene,
	ShaderMaterialParameters,
	SphereGeometry,
	SRGBColorSpace,
	TextureLoader,
	Vector2,
	Vector3,
	WebGLRenderer,
} from 'three';
import {
	EffectComposer,
	GLTFLoader,
	OutputPass,
	RenderPass,
	ShaderPass,
	UnrealBloomPass,
} from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Pane } from 'tweakpane';
import fragmentShader from './shader/fragment.glsl?raw';
import vertexShader from './shader/vertex.glsl?raw';
import classes from './style.module.css';

export default function App() {
	function random(min: number, max: number) {
		const diff = Math.random() * (max - min);
		return min + diff;
	}

	const initialScene = () => {
		const el = document.querySelector('#container') as HTMLDivElement;

		/**
		 * Basic
		 */

		const renderer = new WebGLRenderer({
			alpha: true,
			antialias: true,
		});
		renderer.shadowMap.enabled = true;
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.outputColorSpace = SRGBColorSpace;
		el.append(renderer.domElement);

		const scene = new Scene();
		scene.background = new Color('#06101c');

		const camera = new PerspectiveCamera(
			30,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		camera.position.set(12, 0, 0);
		camera.lookAt(scene.position);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.enableZoom = true;

		const stats = new Stats();
		el.append(stats.dom);

		/**
		 * Effects
		 */

		const composer = new EffectComposer(renderer);

		const renderPass = new RenderPass(scene, camera);
		composer.addPass(renderPass);

		const bloomPass = new UnrealBloomPass(
			new Vector2(window.innerWidth, window.innerHeight),
			0.25,
			0.5,
			0
		);
		// composer.addPass(bloomPass);

		const shiftPass = new ShaderPass({
			uniforms: {
				tDiffuse: { value: null },
				opacity: { value: 1.0 },
			},
			vertexShader,
			fragmentShader,
		} as ShaderMaterialParameters);
		composer.addPass(shiftPass);

		const outputPass = new OutputPass();
		composer.addPass(outputPass);

		/**
		 * Loaders
		 */

		const textureLoader = new TextureLoader();
		textureLoader.setPath('/src/assets/texture/');

		const gltfLoader = new GLTFLoader();
		gltfLoader.setPath('/src/assets/models/');

		/**
		 * Variables
		 */

		const STAR_COUNT = 2500;
		const STARS: {
			pos: Vector3;
			speed: number;
			len: number;
		}[] = [];

		function resetStar() {
			let pos;
			let len;

			if (Math.random() > 0.8) {
				pos = new Vector3(random(-15, 15), random(-10, 10), random(-10, 10));
				len = random(10.5, 100);
			} else {
				pos = new Vector3(random(-30, 15), random(-10, 10), random(-10, 10));
				len = random(10.5, 200);
			}

			const speed = random(19.5, 42);

			return {
				pos,
				speed,
				len,
			};
		}

		for (let i = 0; i < STAR_COUNT; i++) {
			STARS.push(resetStar());
		}

		/**
		 * Scene
		 */

		const starGeometry = new PlaneGeometry(0.05, 0.05);
		const starMaterial = new MeshBasicMaterial({
			transparent: true,
			side: DoubleSide,
			color: '#dadff1',
		});
		const star = new InstancedMesh(starGeometry, starMaterial, STAR_COUNT);

		const targetObject = new Object3D();

		for (let i = 0; i < STAR_COUNT; i++) {
			targetObject.position.copy(STARS[i].pos);
			targetObject.updateMatrix();

			star.setMatrixAt(i, targetObject.matrix);
		}

		scene.add(star);

		gltfLoader.load('sci-fi_space_station/scene.gltf', (data) => {
			const spaceStation = data.scene;
			spaceStation.rotation.y = Math.PI;

			const objectNames = [
				'Cube013_Material033_0',
				'Cube012_Material033_0',
				'Cube022_Material033_0',
				'Cube014_Material033_0',
				'Cube012_Material059_0',
				'Cube013_Material059_0',
				'Cube014_Material059_0',
				'Cube022_Material059_0',
			];
			const whiteMaterial = new MeshStandardMaterial({
				color: '#797979',
			});
			spaceStation.traverse((object) => {
				if (objectNames.includes(object.name)) {
					if (object instanceof Mesh) {
						object.castShadow = true;
						object.receiveShadow = true;
						if (object.material instanceof MeshStandardMaterial) {
							object.material = whiteMaterial;
						}
					}
				}
			});

			const spaceStationEngine = spaceStation.getObjectByName(
				'Cylinder028_Material039_0'
			);

			const enginePosition = new Vector3();
			spaceStationEngine?.getWorldPosition(enginePosition);

			const engineGeometry = new SphereGeometry(0.03, 32, 32);
			const engineMaterial = new MeshBasicMaterial({
				color: '#f9fafa',
			});
			const engine = new Mesh(engineGeometry, engineMaterial);
			engine.position.set(-enginePosition.x - 0.2, 0.17, 0);

			const engine2 = engine.clone();
			engine.position.set(-enginePosition.x - 0.2, -0.17, 0);

			const engine3 = engine.clone();
			engine.position.set(-enginePosition.x - 0.2, 0, -0.17);

			const engine4 = engine.clone();
			engine.position.set(-enginePosition.x - 0.2, 0, 0.17);

			spaceStation.add(engine);
			spaceStation.add(engine2);
			spaceStation.add(engine3);
			spaceStation.add(engine4);

			scene.add(spaceStation);
		});

		/**
		 * Lights
		 */

		const ambientLight = new AmbientLight();
		ambientLight.intensity = 0.0;
		scene.add(ambientLight);

		const directionalLight = new DirectionalLight();
		directionalLight.castShadow = true;
		directionalLight.position.set(2, 2, 2);
		directionalLight.intensity = 2.0;
		scene.add(directionalLight);

		/**
		 * Helpers
		 */

		const axesHelp = new AxesHelper();
		scene.add(axesHelp);

		const directionalLightHelper = new DirectionalLightHelper(directionalLight);
		scene.add(directionalLightHelper);

		/**
		 * Pane
		 */

		const pane = new Pane({ title: 'Debug Params' });
		pane.addBinding(bloomPass, 'radius');
		pane.addBinding(bloomPass, 'strength');
		pane.addBinding(directionalLight, 'position');
		pane.addBinding(directionalLight, 'intensity');
		pane.addBinding(camera, 'fov').on('change', (val) => {
			camera.fov = val.value;
			camera.updateProjectionMatrix();
		});

		/**
		 * Events
		 */

		const clock = new Clock();
		let previousTime = 0;

		const lerpSpeed = 0.005;
		const decelerateSpeed = 0.05;

		let currentSpeed = 0.1;
		let acceleration = 0.1;

		let currentScalc = STARS.map(() => 1.0);
		let accelerationScalc = STARS.map(() => 1.0);

		const updateObject = new Object3D();

		function render(time?: number) {
			requestAnimationFrame(render);

			stats.update();
			controls.update(time);
			directionalLightHelper.update();

			composer.render();

			const elapsedTime = clock.getElapsedTime();
			const deltaTime = elapsedTime - previousTime;
			previousTime = elapsedTime;

			// Won't reach 0.5 but close
			// currentSpeed += (acceleration - currentSpeed) * lerpSpeed;

			for (let i = 0; i < STAR_COUNT; i++) {
				let speed = lerpSpeed;
				if (accelerationScalc[i] < currentScalc[i]) {
					speed = decelerateSpeed;
				}

				currentScalc[i] += (accelerationScalc[i] - currentScalc[i]) * speed;
			}

			star.instanceMatrix.needsUpdate = true;
			for (let i = 0; i < STAR_COUNT; i++) {
				if (STARS[i].pos.x > 35.0) {
					STARS[i] = resetStar();
				}

				STARS[i].pos.x += STARS[i].speed * deltaTime * currentSpeed;

				// updateObject.position.copy(STARS[i].pos);
				updateObject.scale.x = currentScalc[i];
				updateObject.updateMatrix();

				star.setMatrixAt(i, updateObject.matrix);
			}
		}
		render();

		function resize() {
			renderer.setSize(window.innerWidth, window.innerHeight);
			composer.setSize(window.innerWidth, window.innerHeight);

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
		}
		window.addEventListener('resize', resize);

		function accelerate() {
			acceleration = 1.0;
			accelerationScalc = STARS.map((value) => value.len);
		}
		function decelerate() {
			acceleration = 0.1;
			accelerationScalc = STARS.map(() => 1.0);
		}
		window.addEventListener('pointerdown', accelerate);
		window.addEventListener('pointerup', decelerate);
	};

	useEffect(() => {
		initialScene();
	}, []);

	return <div id='container' className={classes['container']}></div>;
}
