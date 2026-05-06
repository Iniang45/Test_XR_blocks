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
    width = 0.6,
    height = 0.4,
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
    this.change = false;
    this.originalAudioPath = audioPath;
  }

  _onImageClicked() {
    if (this.change) {
      this.changeSound("./images/icons/sound.svg");
      return;
    }

    this.playImageSound();
    if (!this.change) {
      this.changeSound("./images/icons/sound-off.svg", "");
    } else {
      this.changeSound("./images/icons/sound.svg");
    }
  }

  changeSound(imagepath) {
    this.setImage(imagepath);
    this.change = !this.change;
  }
  changeColor() {
    const randomColor = (Math.random() * 0xffffff) | 0;
    this.panel.backgroundColor =
      "#" + randomColor.toString(16).padStart(6, "0");
  }

  setItem(item) {
    this.item = item;
  }
}
