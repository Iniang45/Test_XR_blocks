import * as THREE from "three";
import { ImageInteractive } from "./ImageInteractive.js";
import { CarouselSoundPanel } from "./CarouselSoundPanel.js";

/**
 * Feuille: image cliquable qui ouvre un CarouselSoundPanel.
 * Version simple a modifier plus tard.
 */
export class Feuille extends ImageInteractive {
  constructor({
    imagePath = "./images/know.jpg",
    width = 0.3,
    height = 0.2,
    audioPath = "./sounds/frog.mp3",
    item = null,
  } = {}) {
    super(imagePath, width, height, audioPath);

    this.item = item ?? {
      title: "Feuille",
      image: imagePath,
      kind: "sound",
    };
    this.soundPanel = null;
  }

  _onImageClicked() {
    this.playImageSound();
    this._openSoundPanel();
  }

  _openSoundPanel() {
    if (this.soundPanel) return;

    this.soundPanel = new CarouselSoundPanel(
      this.item,
      () => this._closeSoundPanel(),
      () => this.playImageSound(),
    );

    this.add(this.soundPanel);

    const spawnPosition = this.panel.localToWorld(
      new THREE.Vector3(0, 0.48, 0),
    );
    this.soundPanel.setTargetPosition(spawnPosition);
    this.soundPanel.setTargetYaw(this.panel.rotation.y);
  }

  _closeSoundPanel() {
    if (!this.soundPanel) return;

    this.remove(this.soundPanel);
    this.soundPanel = null;
  }

  setItem(item) {
    this.item = item;
  }
}
