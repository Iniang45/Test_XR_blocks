import * as THREE from "three";
import * as xb from "xrblocks";

/**
 * Floating selector panel with 2 buttons to switch between AR and VR visuals.
 */
export class ARVRSelector extends xb.Script {
  constructor() {
    super();

    const panel = new xb.SpatialPanel({
      backgroundColor: "#111111cc",
      width: 0.28,
      height: 0.14,
    });
    this.panel = panel;
    this.add(panel);

    const grid = panel.addGrid();

    grid.addRow({ weight: 0.35 }).addText({
      text: "Choisis ton mode",
      fontColor: "#ffffff",
      fontSize: 0.06,
    });

    const buttonRow = grid.addRow({ weight: 0.65 });

    const arButton = buttonRow.addCol({ weight: 0.5 }).addTextButton({
      text: "AR",
      fontSize: 0.17,
      fontColor: "#ffffff",
      backgroundColor: "#2d6a4f",
    });
    arButton.onTriggered = () => {
      this._enterAR();
    };

    const vrButton = buttonRow.addCol({ weight: 0.5 }).addTextButton({
      text: "VR",
      fontSize: 0.17,
      fontColor: "#ffffff",
      backgroundColor: "#1d3557",
    });
    vrButton.onTriggered = () => {
      this._enterVR();
    };
  }

  _enterAR() {
    if (!xb.core.transition) return;
    xb.core.transition.toAR();
    console.log("Mode AR active");
  }

  _enterVR() {
    if (!xb.core.transition) return;
    xb.core.transition.toVR({ color: 0x202020 });
    console.log("Mode VR active");
  }

  update() {
    const forward = new THREE.Vector3();
    xb.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const target = new THREE.Vector3().copy(xb.camera.position);
    target.addScaledVector(forward, 0.55);
    target.y -= 0.25;

    this.panel.position.copy(target);
    this.panel.lookAt(
      xb.camera.position.x,
      this.panel.position.y,
      xb.camera.position.z,
    );
  }
}
