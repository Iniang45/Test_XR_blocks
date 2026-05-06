import { ImageInteractive } from "./ImageInteractive.js";
import { Line } from "./Line.js";
import * as THREE from "three";
import * as xb from "xrblocks";
import { Etage } from "./Etage.js";
import { PanelNonBinaire } from "./PanelNonBinaire.js";
import { Feuille } from "./Feuille.js";
/**
 * Branche: image panel cliquable qui affiche ses enfants et les lignes au clic.
 */
export class Branche extends PanelNonBinaire {
  constructor({
    imagePath = "./images/know.jpg",
    width = 1.2,
    height = 0.6,
    audioPath = "./sounds/frog.mp3",
    enfants = [],
    onClick = null,
    texte = "does he know?",
  } = {}) {
    super(imagePath, width, height, texte, audioPath);
    this.imagePath = imagePath;
    this.largeur = width;
    this.taille = height;
    this.audioPath = audioPath;
    this.texte = texte;
    this.enfants = enfants;
    this.onClick = onClick;
    this.isFavorite = false;
    this.uiManager = null;
    const etage = new Etage(enfants, this);
    etage.visible = false;
    this.etage = etage;
    this.lines = []; // Stocker les références aux lignes
    this.color = 0xffffff; // Couleur par défaut des lignes
  }
  changeColor() {
    let randomColor = 0;
    let red = 0;
    let green = 0;
    let blue = 0;
    let luminance = 1;

    do {
      randomColor = (Math.random() * 0xffffff) | 0;
      red = (randomColor >> 16) & 255;
      green = (randomColor >> 8) & 255;
      blue = randomColor & 255;
      luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    } while (luminance > 0.15);
    const colorHex = "#" + randomColor.toString(16).padStart(6, "0");
    this.panel.backgroundColor = colorHex;
    if (
      this.panel.mesh &&
      this.panel.mesh.uniforms &&
      this.panel.mesh.uniforms.uBackgroundColor
    ) {
      console.log(" does the arrival of a new era frighten you that much ?");
      const vec = this.panel.mesh.uniforms.uBackgroundColor.value;
      const c = new THREE.Color(colorHex);
      // vec is a THREE.Vector4 (r,g,b,a)
      if (vec && typeof vec.set === "function") {
        vec.set(c.r, c.g, c.b, vec.w !== undefined ? vec.w : 1.0);
      }
    }
    if (this.panel.material && this.panel.material.color) {
      console.log(
        "is there any man that needs a reason to protect his own children ?",
      );
      this.panel.material.color.set(colorHex);
    }

    return randomColor;
  }
  setUIManager(uiManager) {
    this.uiManager = uiManager;
  }

  _toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    console.log("favorite state:", this.isFavorite);
    if (this.uiManager) {
      if (this.isFavorite) {
        this.uiManager.addFavorite(this);
      } else {
        this.uiManager.removeFavorite(this);
      }
    }
  }

  _onImageClicked() {
    //this.color = this.changeColor();
    console.log("Doko kara imashita", this.panel);
    if (this.enfants.length > 0) {
      this._showEtage();
    }

    if (typeof this.onClick === "function") {
      this.onClick();
    }
  }

  _showEtage() {
    if (!this.etage.visible) {
      this.add(this.etage);
      this.etage.visible = true;
      console.log("layout etage", this.etage);
      this.etage.layout(0.72, 0.8, this);
      this.showLines(true);
    } else {
      this.showLines(false);
      this.etage.visible = false;
      this.remove(this.etage);
    }
  }
  showLines(theboolean) {
    for (const line of this.lines) {
      if (line.parent) {
        line.parent.remove(line);
      }
    }
    this.lines = [];
    if (!theboolean) {
      return;
    }
    // Générer une couleur aléatoire pour cet appel de showLines
    const lineContainer = this.uiManager || this;

    // Gamme de fréquences de piano (Do majeur)
    const pianoFrequencies = [
      261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25,
    ]; // C4 à C5

    for (const branch of this.etage.branches) {
      const randomFrequency =
        pianoFrequencies[Math.floor(Math.random() * pianoFrequencies.length)];
      const line = new Line(this, branch, {
        color: this.panel.backgroundColor,
        frequency: randomFrequency,
      });
      line.isLeaf = branch instanceof Feuille;
      lineContainer.add(line);
      this.lines.push(line);
    }
  }
}
