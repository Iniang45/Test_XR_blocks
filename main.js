import * as THREE from "three";
import * as xb from "xrblocks";
import { UIManager } from "./UIManager.js";
import { TestSuivi } from "./TestSuivi.js";
import { ARVRSelector } from "./ARVRSelector.js";
import { CustomGestureDemo } from "./Gestes/CustomGesturesDemo.js";
import { DomainExpansion } from "./DomainExpansion.js";
import { PanelBinaire } from "./PanelBinaire.js";
import { SoundEffectPlayer } from "./SoundEffectPlayer.js";
import { Livre } from "./Livre.js";
import { CustomGestureAncien } from "./Gestes/CustomGestureAncien.js";
class SceneTransition extends xb.Script {
  constructor() {
    super();
    this.currentMode = "AR";
    this.transitionTime = 0.5;
    this.targetOpacity = 0;

    const geometry = new THREE.SphereGeometry(1, 64, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      side: THREE.BackSide,
    });
    this.fader = new THREE.Mesh(geometry, material);
    this.fader.renderOrder = -Infinity;
    this.fader.frustumCulled = false;
    this.fader.raycast = () => {};
    this.add(this.fader);
  }

  toVR({ color = 0x000000 } = {}) {
    this.currentMode = "VR";
    this.fader.material.color.set(color);
    this.targetOpacity = 1;
  }

  toAR() {
    this.currentMode = "AR";
    this.targetOpacity = 0;
  }

  update() {
    this.position.copy(xb.camera.position);
    this.fader.position.set(0, 0, 0);
    this.layers.set(0);
    const currentOpacity = this.fader.material.opacity;
    if (currentOpacity === this.targetOpacity) {
      return;
    }

    const lerpFactor = Math.min(1, 0.016 / this.transitionTime);
    const nextOpacity = THREE.MathUtils.lerp(
      currentOpacity,
      this.targetOpacity,
      lerpFactor,
    );
    this.fader.material.opacity =
      Math.abs(nextOpacity - this.targetOpacity) < 0.01
        ? this.targetOpacity
        : nextOpacity;
  }
}

const options = new xb.Options();
options.enableUI();
class MainScript extends xb.Script {
  init() {}

  /**
   * On pinch, toggle between AR and VR modes and update cylinder color.
   */
  onSelectEnd() {
    if (!xb.core.transition) {
      console.warn("XRTransition not enabled.");
      return;
    }
    this.cylinder.material.color.set(Math.random() * 0xffffff);

    // Toggle between AR and VR based on the current mode.
    if (xb.core.transition.currentMode === "AR") {
      xb.core.transition.toVR({ color: Math.random() * 0xffffff });
    } else {
      xb.core.transition.toAR();
    }
  }
  tovr() {
    xb.core.transition.toVR();
    console.log("toVR called");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  options.hands = { enabled: true, visualization: true };
  //options.xrSessionMode = "immersive-ar";

  xb.core.transition = new SceneTransition();
  xb.add(xb.core.transition);
  xb.add(new Livre());
  xb.add(new UIManager());
  //xb.add(new DomainExpansion());
  xb.add(new CustomGestureDemo());
  //xb.add(new CustomGestureAncien());
  //xb.add(new PanelBinaire("./images/know.jpg", 1, 0.6));
  //xb.add(new TestSuivi());
  xb.init(options);
});
