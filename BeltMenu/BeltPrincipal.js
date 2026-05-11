import * as xb from "xrblocks";

/**
 * Principal clickable panel managed by BeltManager.
 */
export class BeltPrincipal extends xb.Script {
  constructor(
    imagePath = "./images/know.jpg",
    width = 0.2,
    height = 0.15,
    onTriggered = null,
  ) {
    super();

    this.imagePath = imagePath;
    this.onTriggered = onTriggered;

    this.panel = new xb.SpatialPanel({
      backgroundColor: "#2b2b2baa",
      width,
      height,
    });
    this.panel.position.set(0, 0, -0.5);
    this.add(this.panel);

    const grid = this.panel.addGrid();
    const imageRow = grid.addRow({ weight: 1.0 });
    this.imageWidget = imageRow.addImage({ src: imagePath });
    this.imageWidget.onTriggered = () => {
      if (typeof this.onTriggered === "function") {
        this.onTriggered(this);
      }
    };
  }

  setImage(src) {
    this.imagePath = src;
    this.imageWidget.load(src);
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
