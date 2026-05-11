import * as xb from "xrblocks";

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
    if (visible && this.enfants.length > 0) {
      for (const enfant of this.enfants) {
        if (!enfant.parent) {
          this.add(enfant);
        }
        enfant.position.set(0.15, 0, 0);
        enfant.visible = true;
      }
    } else {
      for (const enfant of this.enfants) {
        enfant.visible = false;
        if (enfant.parent === this) {
          this.remove(enfant);
        }
      }
    }
  }

  setImage(src) {
    this.imagePath = src;
    if (this.imageWidget) {
      this.imageWidget.load(src);
    }
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
