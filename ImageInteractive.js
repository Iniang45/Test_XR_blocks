import * as xb from "xrblocks";
import { SoundEffectPlayer } from "./SoundEffectPlayer.js";

/**
 * Single interactive full-image panel with click-to-play audio.
 */
export class ImageInteractive extends xb.Script {
  constructor(
    imagePath = "./images/know.jpg",
    largeur = 0.8,
    taille = 0.45,
    audioPath = "./sounds/frog.mp3",
  ) {
    super();

    this.imagePath = imagePath;

    this.panel = new xb.SpatialPanel({
      backgroundColor: "#00000000",
      width: largeur,
      height: taille,
      showEdge: false,
    });
    this.panel.draggingMode = xb.DragMode.TRANSLATING;
    this.panelBaseScale = this.panel.scale.clone();
    this.add(this.panel);

    this.soundPlayer = new SoundEffectPlayer(audioPath, {
      loop: false,
      volume: 0.5,
    });

    const grid = this.panel.addGrid();
    const imageRow = grid.addRow({ weight: 1.0 });
    this.imageWidget = imageRow.addImage({ src: imagePath });
    this.imageWidget.onTriggered = () => this._onImageClicked();
  }

  _onImageClicked() {
    console.log("Image clicked", this.imagePath);
    this.playImageSound();
  }

  playImageSound(delay = 0, delayArret = 0) {
    this.soundPlayer.joue(delay, delayArret);
  }

  setImage(src) {
    this.imagePath = src;
    this.imageWidget.load(src);
  }

  setAudioPath(audioPath) {
    this.soundPlayer.setAudioPath(audioPath);
  }

  update() {
    this.panel.scale.copy(this.panelBaseScale);
  }
}

// Backward-compatible alias.
export class ImagesInteractive extends ImageInteractive {}
