import * as THREE from "three";
import * as xb from "xrblocks";
import { BeltPrincipal } from "./BeltPrincipal.js";
import { BeltSecondaire } from "./BeltSecondaire.js";
import { ImageInteractive } from "../ImageInteractive.js";

/**
 * Manager for belt panels with state-based physics.
 * Closed: follows camera like UIManager
 * Open: remains static for secondary panels to appear around it
 */
export class BeltManager extends xb.Script {
  constructor(
    imagePath = "./images/icons/home.png",
    width = 0.2,
    height = 0.15,
  ) {
    super();

    this.isOpen = false;
    this.secondaryPanels = [];
    this.secondaryRadius = 0.5;
    this.panelRadius = 1;
    this.principalPanelRadius = 0.2;
    this.lookAtTarget = new THREE.Vector3();

    // Create the principal panel
    this.principal = new BeltPrincipal(imagePath, width, height, () => {
      this.toggleState();
    });
    this.add(this.principal);

    // Create children for secondaries
    const enfant1 = new ImageInteractive(
      "./images/icons/bell.png",
      width * 0.5,
      height * 0.5,
    );
    const enfant2 = new ImageInteractive(
      "./images/icons/sound.png",
      width * 0.5,
      height * 0.5,
    );
    const enfant3 = new ImageInteractive(
      "./images/icons/display.png",
      width * 0.5,
      height * 0.5,
    );

    this.addSecondaryPanel(
      new BeltSecondaire(
        "#3b82f6aa",
        width * 0.75,
        height * 0.75,
        "./images/icons/sound.png",
        [enfant1],
      ),
    );
    this.addSecondaryPanel(
      new BeltSecondaire(
        "#10b981aa",
        width * 0.75,
        height * 0.75,
        "./images/icons/search.png",
        [enfant2],
      ),
    );
    this.addSecondaryPanel(
      new BeltSecondaire(
        "#f59e0baa",
        width * 0.75,
        height * 0.75,
        "./images/icons/grid.png",
        [enfant3],
      ),
    );
    this._setSecondaryPanelsVisible(false);
  }

  toggleState() {
    this.isOpen = !this.isOpen;
    this._setSecondaryPanelsVisible(this.isOpen);
  }

  addSecondaryPanel(panel) {
    if (!panel || this.secondaryPanels.includes(panel)) {
      return panel;
    }

    this.secondaryPanels.push(panel);
    this.add(panel);
    return panel;
  }

  removeSecondaryPanel(panel) {
    const index = this.secondaryPanels.indexOf(panel);
    if (index === -1) {
      return;
    }

    this.secondaryPanels.splice(index, 1);
    this.remove(panel);
  }

  _setSecondaryPanelsVisible(visible) {
    for (const panel of this.secondaryPanels) {
      panel.setVisible(visible);
    }
  }

  update() {
    this._updateManagerPose();
    this._updatePrincipalPose();
    if (this.isOpen) {
      this.deplacerAllSecondaires();
    }
    //console.log("do you think you can challenge Makoa ?", xb.camera.position);
  }
  deplacerSecondaire(panel, angle) {
    const x = this.panelRadius * Math.cos(angle);
    const z = this.panelRadius * Math.sin(angle);
    panel.setTargetPose(new THREE.Vector3(x, 0, -z), xb.camera.position);
  }
  deplacerAllSecondaires() {
    const count = this.secondaryPanels.length;
    const half = Math.floor(count / 2);

    let panelIndex = 0;
    for (let i = 0; i < count + 1; i++) {
      const angle = ((Math.PI * 2) / (count + 1)) * i;
      if (angle == Math.PI / 2) {
        continue;
      }
      this.deplacerSecondaire(this.secondaryPanels[panelIndex], angle);
      panelIndex++;
    }
  }

  _updateManagerPose() {
    this.position.copy(xb.camera.position);
    if (!this.isOpen) {
      const viewDirection = new THREE.Vector3();
      xb.camera.getWorldDirection(viewDirection);
      viewDirection.y = 0;
      viewDirection.normalize();
      this.position.addScaledVector(viewDirection, 0.4);

      this.lookAt(xb.camera.position.x, this.position.y, xb.camera.position.z);
    } else {
      this.rotation.set(0, 0, 0);
    }
  }

  _updatePrincipalPose() {
    this.lookAtTarget.copy(xb.camera.position);
    const targetPosition = new THREE.Vector3(0, 0, -this.panelRadius);
    if (!this.isOpen) {
      targetPosition.set(0, 0, -this.principalPanelRadius);
    }
    this.principal.setTargetPose(targetPosition, this.lookAtTarget);
  }
}
