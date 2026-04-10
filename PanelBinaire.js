import * as THREE from "three";
import * as xb from "xrblocks";
import { SoundEffectPlayer } from "./SoundEffectPlayer.js";

/**
 * Rending a draggable spatial UI panel with SDF font libraries, and icons
 * buttons using XR Blocks.
 */
export class PanelBinaire extends xb.Script {
  constructor(imagePath = "./images/know.jpg", largeur = 1, taille = 0.6) {
    super();
    const panel = new xb.SpatialPanel({
      backgroundColor: "#2b2b2baa",
      width: largeur,
      height: taille,
      showEdge: true,
    });
    const frogLaughing = new SoundEffectPlayer("./sounds/frog.mp3");
    this.frogLaughing = frogLaughing;
    this.panel = panel;
    this.panelBaseScale = this.panel.scale.clone();
    console.log("Panel created:", panel);
    this.add(panel);
    const grid = panel.addGrid();
    const imageRow = grid.addRow({ weight: 0.6 });
    this.imageWidget = imageRow.addImage({
      src: imagePath,
    });
    const spawn = this.panel.position.clone();
    this.spawn = spawn;
    const question = grid.addRow({ weight: 0.15 }).addText({
      text: "",
      fontColor: "#ffffff",
      fontSize: 0.08,
    });
    this.question = question;

    // ctrlRow occupies 30% of the height of the panel.
    const ctrlRow = grid.addRow({ weight: 0.3 });
    const colremplissage = ctrlRow.addCol({ weight: 0.15 });
    const yesButton = ctrlRow
      .addCol({ weight: 0.3 })
      .addIconButton({ text: "check_circle", fontSize: 0.5 });
    yesButton.onTriggered = () => {
      this._onYes();
    };

    const noButton = ctrlRow
      .addCol({ weight: 0.4 })
      .addIconButton({ text: "cancel", fontSize: 0.5 });

    noButton.onTriggered = () => {
      this._onNo();
    };
  }

  _onYes() {
    console.log("yes");
    this._setImage(this.imageWidget, "./images/heknow.jpg");
    console.log(this.panel.position);
    console.log(xb.camera.position);
    this.frogLaughing.joue(0, 3);
  }

  _onNo() {
    console.log("no");
    this._setImage(this.imageWidget, "./images/hedontknow.jpeg");
  }

  _setImage(image, src) {
    image.load(src);
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

  update() {
    this.panel.scale.copy(this.panelBaseScale);
  }
}
