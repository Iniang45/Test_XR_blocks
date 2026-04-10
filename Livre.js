import * as THREE from "three";
import * as xb from "xrblocks";
import { SoundEffectPlayer } from "./SoundEffectPlayer.js";
const kLightX = xb.getUrlParamFloat("lightX", 0);
const kLightY = xb.getUrlParamFloat("lightY", 500);
const kLightZ = xb.getUrlParamFloat("lightZ", -10);
const TRIGGER_GESTURE_LABEL = "ROCK";
const TRIGGER_GESTURE_LABEL_2 = "THUMB UP";
const TEST_TOGGLE_KEY = "KeyJ";
const TEST_REPULSE_KEY = "KeyK";
const ATTRACT_DISTANCE = 0.7;
const ATTRACT_MOVE_MS = 900;
export class Livre extends xb.Script {
  constructor() {
    super();
    this.model = null;
    this.lastTriggerState = false;
    this.isMovingToUser = false;
    this.isMovingBack = false;
    this.isAnimatingToOpen = false;
    this.isAnimatingToClose = false;
    this.moveStartMs = 0;
    this.moveDurationMs = ATTRACT_MOVE_MS;
    this.moveStartPos = new THREE.Vector3();
    this.moveTargetPos = new THREE.Vector3();
    this.preAttractPos = new THREE.Vector3();
    this.animationStartMs = 0;
    this.animationDurationMs = 0;
    this.latestGestures = {
      left: "OTHER",
      right: "OTHER",
    };
    this._onGestureChanged = this._onGestureChanged.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    window.addEventListener("custom-gesture-changed", this._onGestureChanged);
    window.addEventListener("keydown", this._onKeyDown);
    const soundeffect = new SoundEffectPlayer("./Sounds/skeleton.mp3");
    this.soundeffect = soundeffect;
  }

  async init() {
    xb.core.input.addReticles();
    this.addLights();

    await Promise.all([this.createModelFromGLTF()]);
  }
  _onGestureChanged(event) {
    const { hand, label } = event.detail || {};
    if (hand !== "left" && hand !== "right") return;
    this.latestGestures[hand] = label;
  }
  _onKeyDown(event) {
    const tag = event.target?.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      event.target?.isContentEditable
    ) {
      return;
    }
    if (event.code === TEST_TOGGLE_KEY) {
      this.attract();
    }
    if (event.code === TEST_REPULSE_KEY) {
      this.repulse();
    }
  }
  _isTriggerGestureActive() {
    return (
      this.latestGestures.left === TRIGGER_GESTURE_LABEL &&
      this.latestGestures.right === TRIGGER_GESTURE_LABEL
    );
  }
  _isTriggerGesture2Active() {
    return (
      this.latestGestures.left === TRIGGER_GESTURE_LABEL_2 &&
      this.latestGestures.right === TRIGGER_GESTURE_LABEL_2
    );
  }

  attract() {
    if (
      !this.model ||
      this.isMovingToUser ||
      this.isMovingBack ||
      this.isAnimatingToOpen ||
      this.isAnimatingToClose
    ) {
      return;
    }

    const now = performance.now();
    const forward = new THREE.Vector3();
    xb.camera.getWorldDirection(forward);
    forward.normalize();

    const targetWorld = new THREE.Vector3().copy(xb.camera.position);
    targetWorld.addScaledVector(forward, ATTRACT_DISTANCE);
    targetWorld.y = xb.camera.position.y - 0.08;

    const targetLocal = this.worldToLocal(targetWorld.clone());
    this.preAttractPos.copy(this.model.position);
    this.moveStartPos.copy(this.model.position);
    this.moveTargetPos.copy(targetLocal);
    this.moveStartMs = now;
    this.isMovingToUser = true;
  }

  repulse() {
    if (
      !this.model ||
      this.isMovingToUser ||
      this.isMovingBack ||
      this.isAnimatingToOpen ||
      this.isAnimatingToClose
    ) {
      return;
    }
    this._startCloseAnimation();
  }
  startAnimation(timeScale = null, time = 0, paused = false) {
    let maxDuration = 0;
    this.model.clipActions.forEach((action) => {
      const duration = action.getClip().duration;
      const targetTime = time === 0 ? 0 : duration;
      maxDuration = Math.max(maxDuration, duration);
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      if (timeScale !== null) {
        action.timeScale = timeScale;
      }
      action.time = targetTime;
      action.play();
      action.paused = paused;
    });
    this.animationDurationMs = maxDuration * 1000;
    this.animationStartMs = performance.now();
  }
  _startOpenAnimation() {
    if (!this.model || this.model.clipActions.length === 0) {
      return;
    }
    this.isAnimatingToClose = false;
    this.isAnimatingToOpen = true;
    this.startAnimation(-1, 1);
    this.soundeffect.joue();
  }

  _startCloseAnimation() {
    if (!this.model || this.model.clipActions.length === 0) {
      return;
    }
    this.isAnimatingToOpen = false;
    this.isAnimatingToClose = true;
    this.startAnimation(1);
  }
  freeze(time) {
    this.model.clipActions.forEach((action) => {
      const targetTime = time === 0 ? 0 : action.getClip().duration;
      action.timeScale = 1;
      action.time = targetTime;
      action.play();
      action.paused = true;
    });
  }
  _freezeOnFirstFrame() {
    if (!this.model) {
      return;
    }
    this.freeze(0);
  }

  _freezeOnLastFrame() {
    if (!this.model) {
      return;
    }
    this.freeze(1);
  }

  addLights() {
    this.add(new THREE.HemisphereLight(0xbbbbbb, 0x888888, 3));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(kLightX, kLightY, kLightZ);
    this.add(light);
  }

  async createModelFromGLTF() {
    const model = new xb.ModelViewer({});
    model.startAnimationOnLoad = false;
    this.add(model);
    await model.loadGLTFModel({
      data: {
        scale: { x: 1, y: 1, z: 1 },
        path: "./objects3D/S_Book.glb",
      },
      renderer: xb.core.renderer,
    });
    this.model = model;
    this.startAnimation(null, 1, true);
    model.position.set(0, 0.78, -1.1);
  }
  update() {
    const isAttracting = this._isTriggerGestureActive();
    const isRepulsing = this._isTriggerGesture2Active();
    if (isRepulsing && !this.lastTriggerState) {
      this.repulse();
    }
    if (isAttracting && !this.lastTriggerState) {
      this.attract();
    }
    this.lastTriggerState = isAttracting;

    if (this.model && this.isMovingToUser) {
      const elapsed = performance.now() - this.moveStartMs;
      const t = THREE.MathUtils.clamp(elapsed / this.moveDurationMs, 0, 1);
      const eased = t * t * (3 - 2 * t);

      this.model.position.lerpVectors(
        this.moveStartPos,
        this.moveTargetPos,
        eased,
      );

      const modelWorldPos = new THREE.Vector3();
      this.model.getWorldPosition(modelWorldPos);
      this.model.lookAt(
        xb.camera.position.x,
        modelWorldPos.y,
        xb.camera.position.z,
      );

      if (t >= 1) {
        this.isMovingToUser = false;
        this._startOpenAnimation();
      }
    }

    if (this.model && this.isMovingBack) {
      const elapsed = performance.now() - this.moveStartMs;
      const t = THREE.MathUtils.clamp(elapsed / this.moveDurationMs, 0, 1);
      const eased = t * t * (3 - 2 * t);

      this.model.position.lerpVectors(
        this.moveStartPos,
        this.moveTargetPos,
        eased,
      );

      if (t >= 1) {
        this.isMovingBack = false;
      }
    }

    if (this.model && this.isAnimatingToOpen) {
      const elapsed = performance.now() - this.animationStartMs;
      if (elapsed >= this.animationDurationMs) {
        this.isAnimatingToOpen = false;
        this._freezeOnFirstFrame();
      }
    }

    if (this.model && this.isAnimatingToClose) {
      const elapsed = performance.now() - this.animationStartMs;
      if (elapsed >= this.animationDurationMs) {
        this.isAnimatingToClose = false;
        this._freezeOnLastFrame();
        this.moveStartPos.copy(this.model.position);
        this.moveTargetPos.copy(this.preAttractPos);
        this.moveStartMs = performance.now();
        this.isMovingBack = true;
      }
    }
  }
  dispose() {
    window.removeEventListener(
      "custom-gesture-changed",
      this._onGestureChanged,
    );
    window.removeEventListener("keydown", this._onKeyDown);
  }
}
