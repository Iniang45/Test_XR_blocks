import * as THREE from "three";
import * as xb from "xrblocks";

/**
 * Large panel shown when an item is extracted from the carousel.
 */
export class CarouselExtractedPanel extends xb.Script {
  constructor(item, onClose, onPlaySound) {
    super();

    this.item = item;
    this.onClose = onClose;
    this.onPlaySound = onPlaySound;

    const panel = new xb.SpatialPanel({
      backgroundColor: "#00000000",
      width: 0.34,
      height: 0.42,
      header: item.title,
    });
    this.panel = panel;
    this.add(panel);

    const grid = panel.addGrid();
    grid.addRow({ weight: 0.68 }).addImage({
      src: item.image,
    });

    grid.addRow({ weight: 0.12 }).addText({
      text: item.title,
      fontColor: "#ffffff",
      fontSize: 0.055,
    });

    const buttonRow = grid.addRow({ weight: 0.2 });
    const replayButton = buttonRow.addCol({ weight: 0.5 }).addTextButton({
      text: "Son",
      fontSize: 0.12,
      fontColor: "#ffffff",
      backgroundColor: "#1d3557",
    });
    replayButton.onTriggered = () => {
      if (typeof this.onPlaySound === "function") {
        this.onPlaySound();
      }
    };

    const closeButton = buttonRow.addCol({ weight: 0.5 }).addTextButton({
      text: "Fermer",
      fontSize: 0.12,
      fontColor: "#ffffff",
      backgroundColor: "#b23a48",
    });
    closeButton.onTriggered = () => {
      if (typeof this.onClose === "function") {
        this.onClose();
      }
    };

    const orbiter = grid.addOrbiter();
    orbiter.addExitButton();
  }

  setTargetPosition(position) {
    this.panel.position.copy(position);
  }

  faceCamera() {
    this.panel.rotation.set(0, 0, 0);
  }

  lockUpright() {
    this.panel.rotation.set(0, 0, 0);
  }
}
