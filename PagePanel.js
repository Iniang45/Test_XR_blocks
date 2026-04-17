import * as THREE from "three";
import * as xb from "xrblocks";
import { SoundEffectPlayer } from "./SoundEffectPlayer.js";

export class PagePanel extends xb.Script {
  constructor(
    imagePath = "./images/know.jpg",
    _soundPath = "./Sounds/sekeleton.mp3",
    onClose = null,
  ) {
    super();
    const pagePanel = new xb.SpatialPanel({
      width: 0.3, // Ajuste selon la taille de ta page
      height: 0.45,
      header: "Détails de la page",
    });
    const grid = pagePanel.addGrid();
    const imageRow = grid.addRow({ weight: 0.85 });
    imageRow.addImage({
      src: imagePath,
    });

    const controlsRow = grid.addRow({ weight: 0.15 });
    const closeButton = controlsRow
      .addCol({ weight: 1 })
      .addIconButton({ text: "close", fontSize: 0.45 });

    closeButton.onTriggered = () => {
      if (typeof onClose === "function") {
        onClose();
      }
      if (this.parent) {
        this.parent.remove(this);
      }
    };

    this.pagePanel = pagePanel;
    this.add(pagePanel);
    this.onObjectSelectStart = (event) => {
      this.soundPlayer.joue();
    };
    this.soundPlayer = new SoundEffectPlayer(_soundPath, {
      loop: false,
      volume: 0.5,
    });
  }
  onsound() {}
}
