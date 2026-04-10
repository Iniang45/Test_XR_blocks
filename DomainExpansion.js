import * as THREE from "three";
import * as xb from "xrblocks";
import { PanelBinaire } from "./PanelBinaire.js";
import { SoundEffectPlayer } from "./SoundEffectPlayer.js";
import { ImageInteractive } from "./ImageInteractive.js";
/// A domain expansion effect that triggers when the user makes a specific gesture with both hands.
// When activated, it transitions to a VR background, plays a sound, and displays a set of images in front of the user.
// When the gesture is activated once again, it restores the previous AR/VR state.
const TRIGGER_GESTURE_LABEL = "VICTORY";
const EFFECT_VR_COLOR = 0x000000;
const DEFAULT_VR_COLOR = 0x202020;
const PANEL_DISTANCE = 0.8;
const H_SPACING = 0.9;
const V_SPACING = 0.6;
const SHOW_AFTER_VR_MS = 250;
const TEST_TOGGLE_KEY = "KeyT";
const IMAGE_PATHS = [
  "./images/gala.PNG",
  "./images/pm.jpg",
  "./images/pmjojo.jpg",
];

export class DomainExpansion extends xb.Script {
  constructor() {
    super();
    this.effectActive = false;
    this.lastTriggerState = false;
    this.savedState = null;
    this.lastKnownVrColor = DEFAULT_VR_COLOR;
    this.transitionHooked = false;
    this.pendingPanelsShow = false;
    this.showPanelsAtMs = 0;
    this.latestGestures = {
      left: "OTHER",
      right: "OTHER",
    };
    this.soundPlayer = new SoundEffectPlayer("./images/get_out.mp3", {
      loop: false,
      volume: 0.5,
    });

    this.panelGroup = new THREE.Group();
    this.panelGroup.visible = false;
    this.add(this.panelGroup);

    this.textureLoader = new THREE.TextureLoader();
    this.planes = [];
    IMAGE_PATHS.forEach((path) => {
      this.ImageInteractive = new ImageInteractive(path);
      this.ImageInteractive.panel.draggingMode = xb.DragMode.TRANSLATING;
      this.planes.push(this.ImageInteractive.panel);
      this.panelGroup.add(this.ImageInteractive.panel);
    });
    const spawn = this.panelGroup.position.clone();
    this.spawn = spawn;
    this.panelBinaire = new PanelBinaire("./images/know.jpg", 0.8, 0.45);
    this.panelBinaire.panel.draggingMode = xb.DragMode.TRANSLATING;
    this.planes.push(this.panelBinaire.panel);
    this.panelGroup.add(this.panelBinaire.panel);
    this._setPanelsInteractive(false);

    this._onGestureChanged = this._onGestureChanged.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    window.addEventListener("custom-gesture-changed", this._onGestureChanged);
    window.addEventListener("keydown", this._onKeyDown);
  }

  _hookTransitionIfNeeded() {
    if (
      this.transitionHooked ||
      !xb.core.transition ||
      typeof xb.core.transition.toVR !== "function" ||
      typeof xb.core.transition.toAR !== "function"
    ) {
      return;
    }
    const transition = xb.core.transition;
    const originalToVR = transition.toVR.bind(transition);
    transition.toVR = (options = {}) => {
      if (typeof options.color === "number") {
        this.lastKnownVrColor = options.color;
      }
      return originalToVR(options);
    };

    this.transitionHooked = true;
  }

  _onGestureChanged(event) {
    const { hand, label } = event.detail || {};
    if (hand !== "left" && hand !== "right") return;
    this.latestGestures[hand] = label;
  }

  _isTriggerGestureActive() {
    return (
      this.latestGestures.left === TRIGGER_GESTURE_LABEL &&
      this.latestGestures.right === TRIGGER_GESTURE_LABEL
    );
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
      this._toggleEffect();
    }
  }

  _setPanelsInteractive(enabled) {
    const activeLayer = 0;
    const hiddenLayer = 1;
    const targetLayer = enabled ? activeLayer : hiddenLayer;
    this.panelGroup.traverse((node) => {
      node.layers.set(targetLayer);
    });
  }

  _toggleEffect() {
    if (!xb.core.transition) return;

    if (!this.effectActive) {
      this.savedState = {
        mode: xb.core.transition.currentMode || "AR",
        vrColor: this.lastKnownVrColor,
      };
      this.soundPlayer.joue();
      xb.core.transition.toVR({ color: EFFECT_VR_COLOR });
      this._placePanelsInFront();
      this.panelGroup.visible = false;
      this._setPanelsInteractive(false);
      this.pendingPanelsShow = true;
      this.showPanelsAtMs = performance.now() + SHOW_AFTER_VR_MS;
      this.effectActive = true;
      this.spawn = this.panelGroup.position.clone();
      console.log("spawn updated:", this.spawn);
      return;
    }

    const state = this.savedState || {
      mode: "AR",
      vrColor: this.lastKnownVrColor,
    };
    if (state.mode === "AR") {
      xb.core.transition.toAR();
    } else {
      xb.core.transition.toVR({ color: state.vrColor ?? DEFAULT_VR_COLOR });
    }
    this.pendingPanelsShow = false;
    this._setPanelsInteractive(false);
    this.panelGroup.visible = false;
    this.effectActive = false;
  }

  _placePanelsInFront() {
    const forward = new THREE.Vector3();
    xb.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) {
      forward.set(0, 0, -1);
    }
    forward.normalize();

    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    const center = new THREE.Vector3().copy(xb.camera.position);
    center.addScaledVector(forward, PANEL_DISTANCE);
    center.y = xb.camera.position.y;

    this.panelGroup.position.copy(center);
    this.panelGroup.quaternion.identity();

    const count = this.planes.length;
    const columns = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / columns);
    this.planes.forEach((plane, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = (col - (columns - 1) / 2) * H_SPACING;
      const y = ((rows - 1) / 2 - row) * V_SPACING;
      const targetWorld = new THREE.Vector3()
        .copy(center)
        .addScaledVector(right, x)
        .addScaledVector(up, y);
      const localTarget = this.panelGroup.worldToLocal(targetWorld.clone());

      plane.position.copy(localTarget);
      plane.up.set(0, 1, 0);
      plane.lookAt(xb.camera.position.x, targetWorld.y, xb.camera.position.z);
    });
  }
  update() {
    this._hookTransitionIfNeeded();

    const triggerActive = this._isTriggerGestureActive();
    if (triggerActive && !this.lastTriggerState) {
      this._toggleEffect();
    }
    this.lastTriggerState = triggerActive;

    if (this.effectActive && this.pendingPanelsShow) {
      if (performance.now() >= this.showPanelsAtMs) {
        this._setPanelsInteractive(true);
        this.panelGroup.visible = true;
        this.pendingPanelsShow = false;
      }
    }

    if (
      this.effectActive &&
      this.panelGroup.visible &&
      this.panelBinaire?.panel
    ) {
      const panelWorldPos = new THREE.Vector3();
      this.panelBinaire.panel.getWorldPosition(panelWorldPos);
      this.panelBinaire.panel.lookAt(
        xb.camera.position.x,
        panelWorldPos.y,
        xb.camera.position.z,
      );
    }

    this.panelBinaire.update();
  }

  dispose() {
    window.removeEventListener(
      "custom-gesture-changed",
      this._onGestureChanged,
    );
    window.removeEventListener("keydown", this._onKeyDown);
  }
}
