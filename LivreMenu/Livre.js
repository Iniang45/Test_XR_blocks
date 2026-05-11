import * as THREE from "three";
import * as xb from "xrblocks";
import { SoundEffectPlayer } from "../SoundEffectPlayer.js";
import { ImageInteractive } from "../ImageInteractive.js";
import { PagePanel } from "./PagePanel.js";
const kLightX = xb.getUrlParamFloat("lightX", 0);
const kLightY = xb.getUrlParamFloat("lightY", 500);
const kLightZ = xb.getUrlParamFloat("lightZ", -10);
const TRIGGER_GESTURE_LABEL = "ROCK";
const TRIGGER_GESTURE_LABEL_2 = "VICTORY";
const TRIGGER_GESTURE_LABEL_3 = "SHAKA";
const TEST_TOGGLE_KEY = "KeyJ";
const TEST_REPULSE_KEY = "KeyK";
const TEST_TURNR_KEY = "KeyP";
const TEST_TURNL_KEY = "KeyO";
const ATTRACT_DISTANCE = 0.4;
const ATTRACT_MOVE_MS = 900;
const PAGE_TURN_COOLDOWN_MS = 450;
export class Livre extends xb.Script {
  constructor(pages = []) {
    super();
    this._originalPages = pages.map((page) => ({ ...page }));
    this.pages = this._originalPages.map((page) => ({ ...page }));
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
    this.lastPageTurnTime = 0;
    this.lastPointState = {
      left: false,
      right: false,
    };
    this.preAttractRotation = new THREE.Quaternion();
    this._onGestureChanged = this._onGestureChanged.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    window.addEventListener("custom-gesture-changed", this._onGestureChanged);
    window.addEventListener("keydown", this._onKeyDown);
    const soundeffect = new SoundEffectPlayer("./Sounds/skeleton.mp3");
    this.soundeffect = soundeffect;
  }
  /*
  _restorePagesToOriginal() {
    this.pages = this._originalPages.map((page) => ({ ...page }));
    this.pageActuelle = 0;
    this.pagesTotal = this.pages.length;

    if (this.lesParties && this.pagesTotal > 0) {
      this.changementTexture(this.pages[0]["imagePath"], this.lesParties[1]);
    }
  }
  */
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
    if (event.code === TEST_TURNR_KEY) {
      this.turnPage("next");
    }
    if (event.code === TEST_TURNL_KEY) {
      this.turnPage("previous");
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

  _isPointGestureActive(hand) {
    return this.latestGestures[hand] === TRIGGER_GESTURE_LABEL_3;
  }

  _tryTurnPageFromPoint(hand) {
    const now = performance.now();
    if (now - this.lastPageTurnTime < PAGE_TURN_COOLDOWN_MS) {
      return;
    }

    if (hand === "left") {
      this.turnPage("previous");
    } else if (hand === "right") {
      this.turnPage("next");
    }
    this.lastPageTurnTime = now;
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
    //this._restorePagesToOriginal();

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
      if (clipName && clipName !== action._clip.name) {
        action.stop();
        action.enabled = false;
        return;
      }

      if (clipName && clipName == action._clip.name) {
        const duration = action.getClip().duration;
        const targetTime = time === 0 ? 0 : duration;
        maxDuration = Math.max(maxDuration, duration);
        action.enabled = true;
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
    console.log("Starting animation", {
      timeScale,
      time,
      paused,
      clipName,
      maxDuration,
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
    this.lesParties = lesParties;
    this.model.onObjectSelectStart = (event) => {
      if (this.isOpen) {
        this._onselection();
      }
    };
    var pageActuelle = 0;
    this.pageActuelle = pageActuelle;
    this.model.rotationRaycastMesh.draggingMode = "DO_NOT_DRAG";
    this.changementTexture(
      this.pages[this.pageActuelle]["imagePath"],
      lesParties[1],
    );
    const pagesTotal = this.pages.length;
    this.pagesTotal = pagesTotal;

    this.startAnimation(null, 0, false, "Open_Book");
    model.position.set(0, 0.78, -1.1);
  }
  _onselection() {
    const originalPage = this.lesParties[1];
    const currentPage = this.pages[this.pageActuelle];

    if (!currentPage) {
      return;
    }

    const removedPage = { ...currentPage };
    const removedIndex = this.pageActuelle;
    if (removedIndex == 0) {
      const openedPanels = this.children.filter(
        (child) => child instanceof PagePanel,
      );
      openedPanels.forEach((panel) => this.remove(panel));
      this.pages = this._originalPages.map((page) => ({ ...page }));
      return;
    }
    console.log(
      "Page selected",
      originalPage.getWorldPosition(new THREE.Vector3()),
    );
    const pagePanel = new PagePanel(
      currentPage["imagePath"],
      currentPage["soundPath"],
      () => {
        const alreadyPresent = this.pages.some(
          (page) =>
            page["name"] === removedPage["name"] &&
            page["imagePath"] === removedPage["imagePath"] &&
            page["soundPath"] === removedPage["soundPath"],
        );
        if (alreadyPresent) {
          return;
        }

        const insertIndex = THREE.MathUtils.clamp(
          removedIndex,
          0,
          this.pages.length,
        );
        this.pages.splice(insertIndex, 0, { ...removedPage });
        this.pagesTotal = this.pages.length;
        this.pageActuelle = insertIndex;

        if (this.pagesTotal > 0) {
          this.changementTexture(
            this.pages[this.pageActuelle]["imagePath"],
            this.lesParties[1],
          );
        }
      },
    );
    const offset = new THREE.Vector3(0, -1, 1.25);
    const targetPos = new THREE.Vector3();
    originalPage.getWorldPosition(targetPos);
    targetPos.add(offset);
    this.worldToLocal(targetPos);
    this.add(pagePanel);
    pagePanel.position.copy(targetPos);

    this.pages.splice(this.pageActuelle, 1);
    this.pagesTotal = this.pages.length;
    if (this.pageActuelle >= this.pagesTotal) {
      this.pageActuelle = Math.max(0, this.pagesTotal - 1);
    }
    if (this.pagesTotal > 0) {
      this.changementTexture(
        this.pages[this.pageActuelle]["imagePath"],
        this.lesParties[1],
      );
    }

    console.log("Book selected", pagePanel);
  }
  changementTexture(path, objet) {
    const textureLoader = new THREE.TextureLoader();
    const newTexture = textureLoader.load(path);
    newTexture.center.set(0.5, 0.5);
    newTexture.rotation = Math.PI;
    objet.material.map = newTexture;
    objet.material.needsUpdate = true;
  }
  turnPage(direction) {
    if (!this.isOpen) {
      return;
    }
    this.pagesTotal = this.pages.length;
    if (this.pagesTotal === 0) {
      return;
    }
    switch (direction) {
      case "next":
        if (this.pageActuelle < this.pagesTotal - 1) {
          this.pageActuelle++;
          this.startAnimation(1, 0, false, "Turn_Page_Book");
        }
        break;
      case "previous":
        if (this.pageActuelle > 0) {
          this.pageActuelle--;
          this.startAnimation(-1, 1, false, "Turn_Page_Book");
        }
        break;
    }
    this.changementTexture(
      this.pages[this.pageActuelle]["imagePath"],
      this.lesParties[1],
    );
  }
  update() {
    const isAttracting = this._isTriggerGestureActive();
    const isRepulsing = this._isTriggerGesture2Active();
    const isPointingLeft = this._isPointGestureActive("left");
    const isPointingRight = this._isPointGestureActive("right");

    if (isPointingLeft && !this.lastPointState.left) {
      this._tryTurnPageFromPoint("left");
    }
    if (isPointingRight && !this.lastPointState.right) {
      this._tryTurnPageFromPoint("right");
    }
    this.lastPointState.left = isPointingLeft;
    this.lastPointState.right = isPointingRight;

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
