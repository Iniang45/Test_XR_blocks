import { ImageInteractive } from "./ImageInteractive.js";
import { Line } from "./Line.js";
import * as THREE from "three";
import * as xb from "xrblocks";
import { Etage } from "./Etage.js";
/**
 * Branche: image panel cliquable qui affiche ses enfants et les lignes au clic.
 */
export class Branche extends ImageInteractive {
  constructor({
    imagePath = "./images/know.jpg",
    width = 0.8,
    height = 0.45,
    audioPath = "./sounds/frog.mp3",
    enfants = [],
    onClick = null,
  } = {}) {
    super(imagePath, width, height, audioPath);
    this.enfants = enfants;
    this.onClick = onClick;
    const etage = new Etage(enfants, this);
    etage.visible = false;
    this.etage = etage;
  }

  _onImageClicked() {
    this.playImageSound();
    if (this.enfants.length > 0) {
      console.log("Branche clicked, showing etage", this.enfants);
      this._showEtage();
    }

    if (typeof this.onClick === "function") {
      this.onClick();
    }
  }
  _showEtage() {
    if (!this.etage.visible) {
      this.add(this.etage);
      this.etage.visible = !this.etage.visible;
      console.log("layout etage", this.etage);
      this.etage.layout(0.42, 0.32, this);
      //this._showEnfants();
    } else {
      this.remove(this.etage);
      this.etage.visible = false;
    }
  }

  _showEnfants() {
    for (const enfant of this.enfants) {
      this.add(enfant);

      const line = new Line(this, enfant.panel, {
        color: 0xff0000,
        width: 5,
      });
      this.add(line);
    }
  }
}
