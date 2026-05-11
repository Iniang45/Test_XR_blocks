import * as xb from "xrblocks";
import { Line } from "../Line.js";

/**
 * Secondary belt panel with its own pose and rotation handling.
 */
export class BeltSecondaire extends xb.Script {
  constructor(
    backgroundColor = "#3b82f6aa",
    width = 0.15,
    height = 0.11,
    imagePath = null,
    enfants = [],
  ) {
    super();

    this.imagePath = imagePath;
    this.enfants = enfants;
    this.enfantsVisible = false;
    this.lines = [];
    this.panel = new xb.SpatialPanel({
      backgroundColor,
      width,
      height,
      showEdge: true,
    });
    this.panel.position.set(0, 0, -0.5);
    this.add(this.panel);

    if (imagePath) {
      const grid = this.panel.addGrid();
      const imageRow = grid.addRow({ weight: 1.0 });
      this.imageWidget = imageRow.addImage({ src: imagePath });
      this.imageWidget.onTriggered = () => {
        this.toggleEnfants();
      };
    }
  }

  toggleEnfants() {
    console.log("toggle enfants", this.enfantsVisible);
    if (!this.enfantsVisible) {
      this.showEnfants(true);
    } else {
      this.showEnfants(false);
    }
    console.log(
      "enfants visibles?",
      this.enfants[0].position,
      this.panel.position,
    );
  }

  showEnfants(visible) {
    this.enfantsVisible = visible;
    // clear existing lines when toggling
    for (const l of this.lines) {
      if (l.parent) l.parent.remove(l);
    }
    this.lines = [];

    if (visible && this.enfants.length > 0) {
      const pianoFrequencies = [
        261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25,
      ];
      for (const enfant of this.enfants) {
        this.unDragMode(enfant);
        if (!enfant.parent) {
          this.panel.add(enfant);
        }
        this.positionEnfant();
        // create a Line between this panel and the enfant
        const randomFrequency =
          pianoFrequencies[Math.floor(Math.random() * pianoFrequencies.length)];
        const line = new Line(this, enfant, {
          color: this.panel.backgroundColor || 0xffffcc,
          frequency: randomFrequency,
        });
        this.panel.add(line);
        this.lines.push(line);
      }
    } else {
      for (const enfant of this.enfants) {
        enfant.visible = false;
        if (enfant.parent === this.panel) {
          this.panel.remove(enfant);
        }
      }
    }
  }
  positionEnfant() {
    const count = this.enfants.length;
    let index = 0;
    for (let i = -count / 2; i < count / 2; i++) {
      const enfant = this.enfants[index];
      enfant.position.set(2 * i, 4, 13);
      enfant.visible = true;
      // Set the position of each child panel
      index++;
      enfant.panel.rotation.x = Math.PI / 4;
    
    }
  }
  unDragMode(object) {
    object.panel.draggingMode = "DO_NOT_DRAG";
  }
  setImage(src) {
    this.imagePath = src;
    if (this.imageWidget) {
      this.imageWidget.load(src);
    }
  }
  connectLine(object1, object2) {
    const line = new Line(object1, object2);
    this.panel.add(line);
    return line;
  }

  setVisible(visible) {
    this.visible = visible;
    this.panel.visible = visible;
  }

  setTargetPose(targetPosition, lookAtTarget) {
    this.panel.position.copy(targetPosition);
    this.panel.position.y -= 1.5;
    this.panel.rotation.set(0, 0, 0);

    if (lookAtTarget) {
      this.panel.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
    }
    //console.log("et le cycle de la vie renait des cendres,", this.position);
    //console.log("IMbécile, nul n'échappe à l'infini", this.panel.position);
  }
}
