import * as THREE from "three";
import * as xb from "xrblocks";
import { SoundEffectPlayer } from "./SoundEffectPlayer.js";

/**
 * Rending a draggable spatial UI panel with SDF font libraries, and icons
 * buttons using XR Blocks.
 */
export class PanelNonBinaire extends xb.Script {
  constructor(
    imagePath = "./images/know.jpg",
    largeur = 1.2,
    taille = 0.6,
    texte = "does he know?",
    audioPath = "./sounds/frog.mp3",
  ) {
    super();
    const panel = new xb.SpatialPanel({
      backgroundColor: "#2b2b2baa",
      width: largeur,
      height: taille,
      showEdge: true,
    });
    const frogLaughing = new SoundEffectPlayer(audioPath);
    this.frogLaughing = frogLaughing;
    this.panel = panel;
    //this.panel.draggingMode = "TRANSLATING";
    this.panelBaseScale = this.panel.scale.clone();
    console.log("Panel created:", panel);
    this.add(panel);
    const grid = panel.addGrid();
    const favoriteRow = grid.addRow({ weight: 0.12 });
    favoriteRow.addCol({ weight: 0.85 });
    this.favoriteButton = favoriteRow
      .addCol({ weight: 0.15 })
      .addIconButton({ text: "favorite", fontSize: 0.42 });
    this.favoriteButton.onTriggered = () => {
      this._toggleFavorite();
    };
    const imageRow = grid.addRow({ weight: 0.58 });
    this.imageWidget = imageRow.addImage({
      src: imagePath,
    });
    this.imageWidget.onTriggered = () => this._onImageClicked();
    const spawn = this.panel.position.clone();
    this.spawn = spawn;
    const question = grid.addRow({ weight: 0.3 }).addText({
      text: texte,
      fontColor: "#ffffff",
      fontSize: 0.15,
    });
    this.question = question;
  }
  changeColor() {
    const randomColor = (Math.random() * 0xffffff) | 0;
    const colorHex = "#" + randomColor.toString(16).padStart(6, "0");
    this.panel.backgroundColor = colorHex;

    const vec = this.panel.mesh.uniforms.uBackgroundColor.value;
    const c = new THREE.Color(colorHex);
    vec.set(c.r, c.g, c.b, vec.w !== undefined ? vec.w : 1.0);

    return randomColor;
  }
  _onImageClicked() {
    console.log("Image clicked", this.imageWidget.src);
    this.playImageSound();
  }

  playImageSound(delay = 0, delayArret = 0) {
    this.frogLaughing.joue(delay, delayArret);
  }

  acote(enfant, valeurX, valeurY, valeurZ, parent) {
    enfant.position.set(
      parent.position.x + valeurX,
      parent.position.y + valeurY,
      parent.position.z + valeurZ,
    );
    enfant.lookAt(
      xb.camera.position.x,
      parent.position.y,
      xb.camera.position.z,
    );
  }
  draggingChange(draggingmode) {
    this.panel.draggingMode = draggingmode;
  }
  update() {
    this.panel.scale.copy(this.panelBaseScale);
  }
}
