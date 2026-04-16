import * as THREE from "three";
import * as xb from "xrblocks";
import { SoundEffectPlayer } from "./SoundEffectPlayer.js";
const kLightX = xb.getUrlParamFloat("lightX", 0);
const kLightY = xb.getUrlParamFloat("lightY", 500);
const kLightZ = xb.getUrlParamFloat("lightZ", -10);
const TRIGGER_GESTURE_LABEL = "ROCK";
const TRIGGER_GESTURE_LABEL_2 = "VICTORY";
const TEST_TOGGLE_KEY = "KeyJ";
const TEST_REPULSE_KEY = "KeyK";
const ATTRACT_DISTANCE = 0.4;
const ATTRACT_MOVE_MS = 900;
export class Livre extends xb.Script {
  constructor() {
    super();
    this.model = null;
    this.isOpen = false;
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
    this.lastActionTime = 0;
    this.actionCooldownMs = 3000;
    this.preAttractRotation = new THREE.Quaternion();
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
    const now = performance.now();
    if (
      !this.model ||
      this.isMovingToUser ||
      this.isMovingBack ||
      this.isAnimatingToOpen ||
      this.isAnimatingToClose ||
      now - this.lastActionTime < this.actionCooldownMs
    ) {
      return;
    }
    const targetWorld = this.targetWorldCalcul();

    const targetLocal = this.worldToLocal(targetWorld.clone());
    this.preAttractPos.copy(this.model.position);
    this.preAttractRotation.copy(this.model.quaternion);
    this.moveStartPos.copy(this.model.position);
    this.moveTargetPos.copy(targetLocal);
    this.moveStartMs = now;
    this.isMovingToUser = true;
    this.lastActionTime = now;
  }
  targetWorldCalcul() {
    const forward = new THREE.Vector3();
    xb.camera.getWorldDirection(forward);
    forward.normalize();
    const targetProv = new THREE.Vector3().copy(xb.camera.position);
    targetProv.addScaledVector(forward, ATTRACT_DISTANCE * 0.45);
    targetProv.y = xb.camera.position.y - 0.32;
    return targetProv;
  }

  repulse() {
    const now = performance.now();
    if (
      !this.model ||
      this.isMovingToUser ||
      this.isMovingBack ||
      this.isAnimatingToOpen ||
      this.isAnimatingToClose ||
      now - this.lastActionTime < this.actionCooldownMs
    ) {
      return;
    }

    this._startCloseAnimation();
    this.model.quaternion.copy(this.preAttractRotation);
    this.lastActionTime = now;
  }
  startAnimation(timeScale = null, time = 0, paused = false, clipName = null) {
    let maxDuration = 0;
    this.model.clipActions.forEach((action) => {
      if (clipName && clipName == action._clip.name) {
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
      }
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
    this.startAnimation(-1, 1, false, "Open_Book");
    this.soundeffect.joue();
  }

  _startCloseAnimation() {
    if (!this.model || this.model.clipActions.length === 0) {
      return;
    }
    this.model.rotation.x = 0;
    this.isAnimatingToOpen = false;
    this.isAnimatingToClose = true;
    this.startAnimation(1, 0, false, "Open_Book");
    this.isOpen = false;
  }
  freeze(time) {
    this.model.clipActions.forEach((action) => {
      if (action._clip.name == "Open_Book") {
        const targetTime = time === 0 ? 0 : action.getClip().duration;
        action.timeScale = 1;
        action.time = targetTime;
        action.play();
        action.paused = true;
      }
    });
  }
  _freezeOnFirstFrame() {
    if (!this.model) {
      return;
    }
    this.freeze(1);
  }

  _freezeOnLastFrame() {
    if (!this.model) {
      return;
    }
    this.freeze(0);
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
        path: "./objects3D/S_Book_super.glb",
      },
      renderer: xb.core.renderer,
    });
    this.model = model;
    console.log("Or else... Or else...", model);
    console.log(
      "Model loaded: raaaaahahahahahahah",
      model.children[0].children[0].children,
    );
    const lesParties = model.children[0].children[0].children;
    //this.model.rotationRaycastMesh.draggingMode = "DO_NOT_DRAG";
    console.log("Les parties du livre", this.model.rotationRaycastMesh);
    this.changementTexture("./images/gala.PNG", lesParties[1]);
    this.startAnimation(null, 0, false, "Open_Book");
    model.position.set(0, 0.78, -1.1);
  }
  changementTexture(path, objet) {
    const textureLoader = new THREE.TextureLoader();
    const newTexture = textureLoader.load(path);
    objet.material.map = newTexture;
    objet.material.needsUpdate = true;
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
      const lookAtHeight = xb.camera.position.y + 0.15;
      this.model.lookAt(
        xb.camera.position.x,
        lookAtHeight,
        xb.camera.position.z,
      );

      if (t >= 1) {
        this.isMovingToUser = false;
        this.model.lookAt(
          xb.camera.position.x,
          lookAtHeight,
          xb.camera.position.z,
        );
        //this.model.rotation.x = THREE.MathUtils.degToRad(-30);
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
        this.model.quaternion.copy(this.preAttractRotation);
        this.isMovingBack = false;
      }
    }

    if (this.model && this.isAnimatingToOpen) {
      const elapsed = performance.now() - this.animationStartMs;
      if (elapsed >= this.animationDurationMs) {
        this.isAnimatingToOpen = false;
        this.isOpen = true;
        this._freezeOnLastFrame();
      }
    }

    if (this.model && this.isOpen) {
      const targetWorld = this.targetWorldCalcul();
      this.model.position.set(targetWorld.x, targetWorld.y, targetWorld.z);
    }

    if (this.model && this.isAnimatingToClose) {
      const elapsed = performance.now() - this.animationStartMs;
      if (elapsed >= this.animationDurationMs) {
        this.isAnimatingToClose = false;
        this._freezeOnFirstFrame();
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
