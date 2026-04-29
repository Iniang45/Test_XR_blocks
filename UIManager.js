import * as THREE from "three";
import * as xb from "xrblocks";
import { Etage } from "./Etage.js";
/**
 * Rending a draggable spatial UI panel with SDF font libraries, and icons
 * buttons using XR Blocks.
 */
export class UIManager extends xb.Script {
  constructor(etage = []) {
    super();
    this.etage = etage;

    const imageTexture = new THREE.TextureLoader().load("./images/heknow.jpg");
    const imageMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.25),
      new THREE.MeshBasicMaterial({
        map: imageTexture,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    );
    console.log("I just can't wait no more", xb.core);
    this.imageMesh = imageMesh;
    this.imageMesh.visible = false;
    this.add(imageMesh);

    const imageTexture2 = new THREE.TextureLoader().load(
      "./images/hedontknow.jpeg",
    );
    const imageMesh2 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.25),
      new THREE.MeshBasicMaterial({
        map: imageTexture2,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    );
    this.imageMesh2 = imageMesh2;
    this.imageMesh2.visible = false;
    this.add(imageMesh2);
    // Adds an interactive SpatialPanel as a container for UI elements.
    const panel = new xb.SpatialPanel({
      backgroundColor: "#2b2b2baa",
      width: 0.2,
      height: 0.15,
    });
    this.panel = panel;
    this.add(panel);

    this.etage.parent = this.panel;
    if (this.etage) {
      this.etage.visible = false;
      this.add(this.etage);
    }

    const grid = panel.addGrid();
    const imageRow = grid.addRow({ weight: 0.45 });
    imageRow.addImage({
      src: "./images/know.jpg",
    });

    const question = grid.addRow({ weight: 0.25 }).addText({
      text: "does he know?",
      fontColor: "#ffffff",
      fontSize: 0.08,
    });
    this.question = question;

    // ctrlRow occupies 30% of the height of the panel.
    const ctrlRow = grid.addRow({ weight: 0.3 });
    const yesButton = ctrlRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "check_circle", fontSize: 0.5 });
    yesButton.onTriggered = () => {
      this._onYes();
    };

    const noButton = ctrlRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "cancel", fontSize: 0.5 });

    noButton.onTriggered = () => {
      this._onNo();
    };
  }

  _onYes() {
    this.imageMesh2.visible = false;
    this.imageMesh.visible = !this.imageMesh.visible;

    if (!this.etage || this.etage.branches.length === 0) return;
    this.etage.visible = true;
    console.log("pos panel", this.panel.position);
    console.log("pos etage", this.etage.branches[0].position);
  }

  _onNo() {
    this.imageMesh.visible = false;
    this.fermeture();
    if (this.line != null) {
      console.log("that's how loser thinks", this.line);
      this.line.supp();
      this.line = null;
    }
    this.imageMesh2.visible = !this.imageMesh2.visible;
    console.log("no");
  }
  fermeture() {
    for (const branch of this.etage.branches) {
      if (branch.etage) {
        branch.etage.visible = false;
      }
    }
    this.etage.visible = false;
  }
  acote(enfant, valeurX, valeurY, valeurZ, parent, largeur) {
    const localOffset = new THREE.Vector3(valeurX, valeurY, valeurZ);
    const worldOffset = localOffset.applyQuaternion(parent.quaternion);
    enfant.position.copy(parent.position).add(worldOffset);
    enfant.quaternion.copy(parent.quaternion);
    enfant.layers.set(0);
    enfant.scale.set(largeur.x, largeur.y, largeur.z);
  }
  update(dt) {
    const viewDirection = new THREE.Vector3();
    xb.camera.getWorldDirection(viewDirection);
    viewDirection.y = 0; // Keep the panel level by ignoring vertical camera direction
    viewDirection.normalize();
    const targetPos = new THREE.Vector3().copy(xb.camera.position);
    targetPos.addScaledVector(viewDirection, 0.4);
    targetPos.y -= 1; // Adjust height if needed
    //targetPos.z += viewDirection.z > 0 ? -0.35 : 0.35;
    this.panel.position.set(targetPos.x, targetPos.y, targetPos.z);
    this.panel.lookAt(
      xb.camera.position.x,
      this.panel.position.y,
      xb.camera.position.z,
    );
    this.panel.rotateX(-70);

    // Repositionner l'étage à chaque frame si visible
    if (this.etage && this.etage.visible) {
      this.etage.layout(0.94, 0.32, this.panel);
    }
    this.etage.lookAt(
      xb.camera.position.x,
      this.panel.position.y,
      xb.camera.position.z,
    );
    this.acote(this.etage, 0, -1.5, 0, this.panel, new THREE.Vector3(1, 1, 1));

    this.acote(
      this.imageMesh,
      -0.15,
      0.2,
      0,
      this.panel,
      new THREE.Vector3(0.5, 0.5, 0.5),
    );
    this.acote(
      this.imageMesh2,
      0.15,
      0.2,
      0,
      this.panel,
      new THREE.Vector3(0.5, 0.5, 0.5),
    );
  }
}
