import * as THREE from "three";
import * as xb from "xrblocks";
import { CarouselItemCard } from "./CarouselItemCard.js";
import { CarouselExtractedPanel } from "./CarouselExtractedPanel.js";
import { SoundEffectPlayer } from "./SoundEffectPlayer.js";

const TOGGLE_KEY = "KeyM";
const TOGGLE_GESTURE = "SHAKA";
const TOGGLE_COOLDOWN_MS = 400;
const MOVE_LERP_ALPHA = 0.13;

/**
 * Interactive 3D carousel menu for XR Blocks.
 */
export class CarouselMenu extends xb.Script {
  constructor(items = [], options = {}) {
    super();

    this.items = [...items];
    this.currentIndex = 0;
    this.menuEnabled = options.startEnabled ?? false;

    this.radius = options.radius ?? 0.19;
    this.itemSpacing = options.itemSpacing ?? 0.15;
    this.depthFalloff = options.depthFalloff ?? 0.045;
    this.angleStep = options.angleStep ?? 0.5;
    this.visibleSpan = options.visibleSpan ?? 1;
    this.focusScale = options.focusScale ?? 0.95;
    this.normalScale = options.normalScale ?? 0.56;
    this.spawnDistance = options.spawnDistance ?? 1.55;
    this.spawnHeightOffset = options.spawnHeightOffset ?? -0.08;
    this.rootYaw = 0;

    this.lastToggleTime = 0;
    this.lastGestureToggleState = false;
    this.latestGestures = { left: "OTHER", right: "OTHER" };

    this.cards = [];
    this.extractedPanels = new Map();

    this.extractSound = new SoundEffectPlayer(
      options.extractSoundPath ?? "./Sounds/skeleton.mp3",
      { loop: false, volume: 0.45 },
    );

    this._onGestureChanged = this._onGestureChanged.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    window.addEventListener("custom-gesture-changed", this._onGestureChanged);
    window.addEventListener("keydown", this._onKeyDown);

    this._buildControls();
    this._buildCards();
    this._setMenuVisible(this.menuEnabled);
    if (this.menuEnabled) {
      this._placeRootAtSpawn();
    }
  }

  _buildControls() {
    const controlsPanel = new xb.SpatialPanel({
      backgroundColor: "#00000088",
      width: 0.58,
      height: 0.16,
    });
    this.controlsPanel = controlsPanel;
    this.add(controlsPanel);

    const controlsGrid = controlsPanel.addGrid();
    const row = controlsGrid.addRow({ weight: 1 });

    const leftButton = row.addCol({ weight: 0.25 }).addTextButton({
      text: "<",
      fontSize: 0.28,
      fontColor: "#ffffff",
      backgroundColor: "#264653",
    });
    leftButton.onTriggered = () => this.prev();

    row.addCol({ weight: 0.5 }).addText({
      text: "Carousel",
      fontColor: "#ffffff",
      fontSize: 0.11,
    });

    const rightButton = row.addCol({ weight: 0.25 }).addTextButton({
      text: ">",
      fontSize: 0.28,
      fontColor: "#ffffff",
      backgroundColor: "#264653",
    });
    rightButton.onTriggered = () => this.next();
  }

  _buildCards() {
    this.items.forEach((item, index) => {
      const card = new CarouselItemCard(item, () => this.extract(index));
      this.cards.push(card);
      this.add(card);
    });
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

    if (event.code === TOGGLE_KEY) {
      this.toggleMenu();
    }

    if (event.code === "ArrowLeft") {
      this.prev();
    }

    if (event.code === "ArrowRight") {
      this.next();
    }
  }

  _shouldToggleFromGesture() {
    return (
      this.latestGestures.left === TOGGLE_GESTURE &&
      this.latestGestures.right === TOGGLE_GESTURE
    );
  }

  _setMenuVisible(visible) {
    this.menuEnabled = visible;

    if (this.controlsPanel) {
      this.controlsPanel.visible = visible;
    }

    this.cards.forEach((card, index) => {
      const hiddenBecauseExtracted = this.extractedPanels.has(index);
      card.applyVisibility(visible && !hiddenBecauseExtracted);
    });

    this.extractedPanels.forEach((panel) => {
      panel.visible = visible;
    });
  }

  toggleMenu() {
    const now = performance.now();
    if (now - this.lastToggleTime < TOGGLE_COOLDOWN_MS) return;

    this.lastToggleTime = now;
    const nextVisible = !this.menuEnabled;
    this._setMenuVisible(nextVisible);
    if (nextVisible) {
      this._placeRootAtSpawn();
    }
  }

  prev() {
    if (!this.menuEnabled || this.cards.length === 0) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.cards.length) % this.cards.length;
  }

  next() {
    if (!this.menuEnabled || this.cards.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
  }

  extract(index) {
    if (!this.menuEnabled) return;
    if (this.extractedPanels.has(index)) return;

    const item = this.items[index];
    if (!item) return;

    this.extractSound.joue();

    const extracted = new CarouselExtractedPanel(
      item,
      () => this.closeExtracted(index),
      () => this.extractSound.joue(),
    );

    this.extractedPanels.set(index, extracted);
    this.add(extracted);
    extracted.setTargetPosition(new THREE.Vector3(0.42, 0.1, 0.18));
    this.cards[index].applyVisibility(false);
  }

  closeExtracted(index) {
    const panel = this.extractedPanels.get(index);
    if (!panel) return;

    this.remove(panel);
    this.extractedPanels.delete(index);

    if (this.menuEnabled && this.cards[index]) {
      this.cards[index].applyVisibility(true);
    }
  }

  _getCircularDelta(index, center, total) {
    let delta = index - center;
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;
    return delta;
  }

  _layoutCards() {
    const total = this.cards.length;
    if (total === 0) return;

    this.cards.forEach((card, index) => {
      const delta = this._getCircularDelta(index, this.currentIndex, total);
      const hiddenByRange = Math.abs(delta) > this.visibleSpan;
      if (hiddenByRange) {
        card.applyVisibility(false);
        return;
      }

      const x = delta * 0.2;
      const z = -Math.abs(delta) * 0.03;
      const y = 0.06;

      const isSelected = delta === 0;
      const focusBoost = isSelected ? 0.08 : 0;
      const target = new THREE.Vector3(x, y, z + focusBoost);
      const sideScalePenalty = Math.min(Math.abs(delta) * 0.12, 0.32);
      const targetScale = isSelected
        ? this.focusScale
        : Math.max(this.normalScale - sideScalePenalty, 0.5);
      const targetYaw = 0;

      const hiddenBecauseExtracted = this.extractedPanels.has(index);
      card.applyVisibility(this.menuEnabled && !hiddenBecauseExtracted);
      card.setTarget(target, targetScale, isSelected, targetYaw);
    });
  }

  _placeRootAtSpawn() {
    const viewDirection = new THREE.Vector3();
    xb.camera.getWorldDirection(viewDirection);
    viewDirection.y = 0;
    viewDirection.normalize();

    const base = new THREE.Vector3().copy(xb.camera.position);
    base.addScaledVector(viewDirection, this.spawnDistance);
    base.y = xb.camera.position.y + this.spawnHeightOffset;

    this.position.copy(base);
    // Keep a stable horizontal orientation facing the user at spawn time.
    const yawToCamera = Math.atan2(
      xb.camera.position.x - base.x,
      xb.camera.position.z - base.z,
    );
    this.rootYaw = yawToCamera;
    this.rotation.set(0, this.rootYaw, 0);

    if (this.controlsPanel) {
      this.controlsPanel.position.set(0, -0.34, 0.48);
      this.controlsPanel.rotation.set(0, 0, 0);
    }
  }

  update() {
    const gestureToggleState = this._shouldToggleFromGesture();
    if (gestureToggleState && !this.lastGestureToggleState) {
      this.toggleMenu();
    }
    this.lastGestureToggleState = gestureToggleState;

    if (!this.menuEnabled) {
      return;
    }

    // Keep orientation stable even if a panel/button interaction tries to rotate it.
    this.rotation.set(0, this.rootYaw, 0);
    if (this.controlsPanel) {
      this.controlsPanel.rotation.set(0, 0, 0);
    }

    this._layoutCards();

    this.cards.forEach((card) => {
      card.tickLerp(MOVE_LERP_ALPHA);
    });

    this.extractedPanels.forEach((panel) => {
      if (typeof panel.lockUpright === "function") {
        panel.lockUpright();
      }
    });
  }

  dispose() {
    window.removeEventListener(
      "custom-gesture-changed",
      this._onGestureChanged,
    );
    window.removeEventListener("keydown", this._onKeyDown);
  }
}
