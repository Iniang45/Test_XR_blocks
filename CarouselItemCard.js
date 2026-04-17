import * as THREE from "three";
import * as xb from "xrblocks";

/**
 * A single card displayed inside the carousel.
 */
export class CarouselItemCard extends xb.Script {
  constructor(item, onExtract) {
    super();

    this.item = item;
    this.onExtract = onExtract;

    this.targetPosition = new THREE.Vector3();
    this.currentPosition = new THREE.Vector3();
    this.targetScale = 1;
    this.currentScale = 1;
    this.targetYaw = 0;
    this.currentYaw = 0;
    this.isSelected = false;

    const panel = new xb.SpatialPanel({
      backgroundColor: "#00000000",
      width: 0.15,
      height: 0.11,
    });
    this.panel = panel;
    this.add(panel);

    // Use a real rectangle mesh to avoid rounded/capsule panel backgrounds.
    const rectBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.144, 0.082),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
      }),
    );
    rectBg.position.set(0, 0.016, -0.001);
    panel.add(rectBg);

    const grid = panel.addGrid();
    grid.addRow({ weight: 0.72 }).addImage({
      src: item.image,
    });

    const titleText = grid.addRow({ weight: 0.12 }).addText({
      text: item.title,
      fontColor: "#ffffff",
      fontSize: 0.058,
    });
    this.titleText = titleText;

    const openButton = grid.addRow({ weight: 0.16 }).addTextButton({
      text: "Ouvrir",
      fontSize: 0.24,
      fontColor: "#ffffff",
      backgroundColor: "#2d6a4f",
    });
    this.openButton = openButton;

    openButton.onTriggered = () => {
      if (typeof this.onExtract === "function") {
        this.onExtract(this.item);
      }
    };
  }

  setTarget(position, scale, selected, yaw = 0) {
    this.targetPosition.copy(position);
    this.targetScale = scale;
    this.isSelected = selected;
    this.targetYaw = yaw;

    // Side cards show only image to mimic a classic 3D carousel.
    if (this.titleText) this.titleText.visible = selected;
    if (this.openButton) this.openButton.visible = selected;
  }

  applyVisibility(visible) {
    this.visible = visible;
    this.panel.visible = visible;
  }

  updateFacing(cameraPosition) {
    this.panel.lookAt(
      cameraPosition.x,
      this.panel.position.y,
      cameraPosition.z,
    );
  }

  tickLerp(alpha) {
    this.currentPosition.lerp(this.targetPosition, alpha);
    this.panel.position.copy(this.currentPosition);

    this.currentScale = THREE.MathUtils.lerp(
      this.currentScale,
      this.targetScale,
      alpha,
    );
    this.panel.scale.setScalar(this.currentScale);

    this.currentYaw = THREE.MathUtils.lerp(
      this.currentYaw,
      this.targetYaw,
      alpha,
    );
    this.panel.rotation.set(0, this.currentYaw, 0);
  }
}
