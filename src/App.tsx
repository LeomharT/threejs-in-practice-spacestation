import { useEffect } from 'react';
import {
	AxesHelper,
	Clock,
	Color,
	DoubleSide,
	InstancedMesh,
	MeshBasicMaterial,
	Object3D,
	PerspectiveCamera,
	PlaneGeometry,
	Scene,
	ShaderMaterialParameters,
	Vector2,
	Vector3,
	WebGLRenderer,
} from 'three';
import {
	EffectComposer,
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
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		el.append(renderer.domElement);

		const scene = new Scene();
		scene.background = new Color('#06101c');

		const camera = new PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		camera.position.set(1, 1, 1);
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
		 * Variables
		 */

		const STAR_COUNT = 1000;
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
			side: DoubleSide,
			color: 'white',
		});
		const star = new InstancedMesh(starGeometry, starMaterial, STAR_COUNT);

		const targetObject = new Object3D();

		for (let i = 0; i < STAR_COUNT; i++) {
			targetObject.position.copy(STARS[i].pos);
			targetObject.updateMatrix();

			star.setMatrixAt(i, targetObject.matrix);
		}

		scene.add(star);

		/**
		 * Helpers
		 */

		const axesHelp = new AxesHelper();
		scene.add(axesHelp);

		/**
		 * Pane
		 */

		const pane = new Pane({ title: 'Debug Params' });
		pane.addBinding(bloomPass, 'radius');
		pane.addBinding(bloomPass, 'strength');

		/**
		 * Events
		 */

		const clock = new Clock();
		let previousTime = 0;

		let lerpSpeed = 0.005;

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

			// Won't reach 0.5 but close
			currentSpeed += (acceleration - currentSpeed) * lerpSpeed;

			for (let i = 0; i < STAR_COUNT; i++) {
				currentScalc[i] += (accelerationScalc[i] - currentScalc[i]) * lerpSpeed;
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
