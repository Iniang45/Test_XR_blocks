import * as THREE from "three";
import * as xb from "xrblocks";

/**
 * Rending a draggable spatial UI panel with SDF font libraries, and icons
 * buttons using XR Blocks.
 */
export class UIManager extends xb.Script {
  constructor() {
    super();

    const imageTexture = new THREE.TextureLoader().load("heknow.jpg");
    const imageMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.5),
      new THREE.MeshBasicMaterial({
        map: imageTexture,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    );
    console.log("I just can't wait no more", xb.core);

    const offsetImage = new THREE.Vector3(-0.8, 0, 0);
    const offsetImage2 = new THREE.Vector3(0.8, 0, 0);
    this.offsetImage = offsetImage;
    this.offsetImage2 = offsetImage2;
    this.imageMesh = imageMesh;
    this.imageMesh.visible = false;
    this.add(imageMesh);

    const imageTexture2 = new THREE.TextureLoader().load("hedontknow.jpeg");
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
    console.log("Panel created:", panel);
    this.add(panel);
    const grid = panel.addGrid();
    const imageRow = grid.addRow({ weight: 0.45 });
    imageRow.addImage({
      src: "know.jpg",
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
    if (!this.imageMesh.visible) {
      this.imageMesh.visible = true;
      this.imageMesh2.visible = false;
      console.log("yes");
      console.log(this.imageMesh.position.x);
    }
  }

  _onNo() {
    if (!this.imageMesh2.visible) {
      this.imageMesh.visible = false;
      this.imageMesh2.visible = true;
      console.log("no");
    }
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
  update(dt) {
    const viewDirection = new THREE.Vector3();
    xb.camera.getWorldDirection(viewDirection);
    viewDirection.y = 0; // Keep the panel level by ignoring vertical camera direction
    viewDirection.normalize();
    const targetPos = new THREE.Vector3().copy(xb.camera.position);
    targetPos.addScaledVector(viewDirection, 0.6);
    targetPos.y -= 0.6; // Adjust height if needed
    targetPos.z += viewDirection.z > 0 ? -0.35 : 0.35;
    this.panel.position.set(targetPos.x, targetPos.y, targetPos.z);
    this.panel.lookAt(
      xb.camera.position.x,
      this.panel.position.y,
      xb.camera.position.z,
    );
    this.panel.rotateX(-70);
    this.acote(
      this.imageMesh,
      this.offsetImage.x,
      this.offsetImage.y,
      this.offsetImage.z,
      this.panel,
    );
    this.imageMesh2.position.set(this.panel.position + this.offsetImage2);
    //console.log("Montre toi ", xb.core.transition.currentMode);
  }
}
