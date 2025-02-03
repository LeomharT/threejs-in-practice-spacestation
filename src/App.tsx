import { useEffect } from 'react';
import {
	AmbientLight,
	AxesHelper,
	Clock,
	Color,
	DirectionalLight,
	DirectionalLightHelper,
	DoubleSide,
	EquirectangularReflectionMapping,
	InstancedMesh,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Object3D,
	PerspectiveCamera,
	PlaneGeometry,
	Scene,
	ShaderMaterialParameters,
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
	RGBELoader,
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
		scene.background = new Color('#0d1b2f');

		const camera = new PerspectiveCamera(
			25,
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
		composer.addPass(bloomPass);

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

		const rgbeLoader = new RGBELoader();
		rgbeLoader.setPath('/src/assets/texture/');

		/**
		 * Texture
		 */

		const engineAlpha = textureLoader.load('alpha.png');
		rgbeLoader.load('kloofendal_48d_partly_cloudy_puresky_1k.hdr', (data) => {
			/**
			 * Environment
			 */
			scene.environment = data;
			scene.environment.mapping = EquirectangularReflectionMapping;
			scene.environmentIntensity = 0.001;
			pane.addBinding(scene, 'environmentIntensity', {
				step: 0.001,
				min: 0,
				max: 1,
			});
		});

		/**
		 * Variables
		 */

		const STAR_COUNT = 3000;
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
				len = random(30.5, 100);
			} else {
				pos = new Vector3(random(-30, 15), random(-10, 10), random(-10, 10));
				len = random(25.5, 200);
			}

			if (pos.x > 3) pos.z += 3.5;
			if (pos.x < 3) pos.z -= 3.5;

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
			color: '#ddebf9',
		});
		const star = new InstancedMesh(starGeometry, starMaterial, STAR_COUNT);

		const targetObject = new Object3D();

		for (let i = 0; i < STAR_COUNT; i++) {
			targetObject.position.copy(STARS[i].pos);
			targetObject.updateMatrix();

			star.setMatrixAt(i, targetObject.matrix);
		}

		scene.add(star);

		const pane = new Pane({ title: 'Debug Params' });

		let spaceStationClone: undefined | Object3D;

		const objectNames = [
			'Cube013_Material033_0',
			'Cube012_Material033_0',
			'Cube022_Material033_0',
			'Cube014_Material033_0',
			'Cube012_Material059_0',
			'Cube013_Material059_0',
			'Cube014_Material059_0',
			'Cube022_Material059_0',
			//
			'Cylinder043_Material029_0',
			'Cylinder043_Material029_0_1',
			//
			'Cylinder015_Material006_0',
			'Cylinder015_Material007_0',
			'Cylinder015_Material010_0',
			'Cylinder015_Material013_0',
			'Cylinder015_Material038_0',
			'Cylinder048_Material006_0',
			'Cylinder048_Material007_0',
			'Cylinder048_Material010_0',
			'Cylinder048_Material013_0',
			'Cylinder048_Material038_0',
			'Cylinder050_Material006_0',
			'Cylinder050_Material007_0',
			'Cylinder050_Material010_0',
			'Cylinder050_Material013_0',
			'Cylinder050_Material038_0',
			'Cylinder049_Material006_0',
			'Cylinder049_Material007_0',
			'Cylinder049_Material010_0',
			'Cylinder049_Material013_0',
			'Cylinder049_Material038_0',
			//
			'Cylinder033_Material047_0',
			'Cylinder037_Material047_0',
			'Cylinder032_Material047_0',
			'Cylinder035_Material047_0',
			'Cylinder039_Material047_0',
			'Cylinder041_Material047_0',
			'Cylinder038_Material047_0',
			'Cylinder040_Material047_0',
			'Cylinder044_Material047_0',
			'Cylinder046_Material047_0',
			'Cylinder042_Material047_0',
			'Cylinder045_Material047_0',
			'Cylinder016_Material047_0',
			'Cylinder031_Material047_0',
			'Cylinder051_Material047_0',
			'Cylinder017_Material047_0',
			// Cube
			'Cube012_Material010_0',
			'Cube013_Material010_0',
			'Cube014_Material010_0',
			'Cube022_Material010_0',
			'Cube012_Material036_0',
			'Cube013_Material036_0',
			'Cube014_Material036_0',
			'Cube022_Material036_0',
			'Cube012_Material013_0',
			'Cube013_Material013_0',
			'Cube014_Material013_0',
			'Cube022_Material013_0',
			'Cube012_Material034_0',
			'Cube013_Material034_0',
			'Cube014_Material034_0',
			'Cube022_Material034_0',
			'Cube012_Material035_0',
			'Cube013_Material035_0',
			'Cube014_Material035_0',
			'Cube022_Material035_0',

			'Cube012_Material038_0',
			'Cube013_Material038_0',
			'Cube014_Material038_0',
			'Cube022_Material038_0',

			'Cube012_Material007_0',
			'Cube013_Material007_0',
			'Cube014_Material007_0',
			'Cube022_Material007_0',
			//
			'Cylinder047_Material010_0',
			'Cylinder047_Material044_0',
		];

		gltfLoader.load('sci-fi_space_station/scene.gltf', (data) => {
			const spaceStation = data.scene;
			spaceStation.rotation.y = Math.PI;

			spaceStationClone = spaceStation.clone();

			const whiteMaterial = new MeshStandardMaterial({
				color: 0xffffff,
			});

			spaceStation.traverse((object) => {
				if (object instanceof Mesh) {
					if (objectNames.includes(object.name)) {
						object.visible = false;
					}
					object.castShadow = true;
					object.receiveShadow = true;
					if (object.material instanceof MeshStandardMaterial) {
						if (
							object.name !== 'Cylinder028_Material039_0' &&
							object.name !== 'Plane010_Material009_0' &&
							object.name !== 'Plane014_Material009_0'
						) {
							object.material = whiteMaterial;
						}
					}
				}
			});
			spaceStationClone.traverse((object) => {
				if (object instanceof Mesh) {
					if (!objectNames.includes(object.name)) {
						object.visible = false;
					}
					object.castShadow = true;
					object.receiveShadow = true;
					if (object.material instanceof MeshStandardMaterial) {
						object.material = whiteMaterial;
					}
				}
			});

			const spaceStationEngine = spaceStation.getObjectByName(
				'Cylinder028_Material039_0'
			);

			const enginePosition = new Vector3();
			spaceStationEngine?.getWorldPosition(enginePosition);

			const engineColor = new Color('#e9f2fd');

			const engineGeometry = new PlaneGeometry(0.08, 0.08, 64, 64);
			const engineMaterial = new MeshBasicMaterial({
				transparent: true,
				color: engineColor,
				alphaMap: engineAlpha,
				alphaTest: 0.0001,
				side: DoubleSide,
			});
			pane.addBinding(engineMaterial, 'color', {
				color: { type: 'float' },
			});

			const engine = new Mesh(engineGeometry, engineMaterial);
			engine.rotation.y = Math.PI / 2;
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

			scene.add(spaceStationClone);
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
		directionalLight.position.set(0, -3, 1);
		directionalLight.intensity = 2.5;
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

		pane.addBinding(scene, 'background', {
			color: {
				type: 'float',
			},
		});

		pane.addBinding(bloomPass, 'radius');
		pane.addBinding(bloomPass, 'strength');
		pane.addBinding(bloomPass, 'enabled');

		pane.addBinding(directionalLight, 'intensity', {
			min: 0,
			max: 100,
			step: 0.01,
		});
		pane.addBinding(directionalLight, 'color', {
			color: {
				type: 'float',
			},
		});

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

			composer.render();

			const elapsedTime = clock.getElapsedTime();
			const deltaTime = elapsedTime - previousTime;
			previousTime = elapsedTime;

			if (spaceStationClone) {
				spaceStationClone.rotation.x += deltaTime * 0.5;
			}

			// Won't reach 0.5 but close
			currentSpeed += (acceleration - currentSpeed) * lerpSpeed;

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

				updateObject.position.copy(STARS[i].pos);
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
