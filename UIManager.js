import * as THREE from "three";
import * as xb from "xrblocks";
import { Etage } from "./Etage.js";
import { Branche } from "./Branche.js";
/**
 * Rending a draggable spatial UI panel with SDF font libraries, and icons
 * buttons using XR Blocks.
 */
export class UIManager extends xb.Script {
  constructor(etage = []) {
    super();
    this.etage = etage;

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
      this.etage.setUIManager(this);
    }
    let favorites = [];
    this.favorites = favorites;
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
    if (!this.etage || this.etage.branches.length === 0) return;
    this.etage.visible = true;
    this._positionEtage();
    console.log("pos panel", this.panel.position);
    console.log("pos etage", this.etage.branches[0].position);
  }

  _onNo() {
    this.fermeture();
    if (this.line != null) {
      console.log("that's how loser thinks", this.line);
      this.line.supp();
      this.line = null;
    }
    console.log("no");
  }
  fermeture() {
    for (const branch of this.etage.branches) {
      if (branch.etage) {
        branch.etage.visible = false;
      }
      branch.showLines(false);
    }
    this.etage.visible = false;
  }
  addFavorite(branchOriginal) {
    if (this.favorites.find((fav) => fav.original === branchOriginal)) {
      return;
    }
    const branchCopy = new Branche({
      imagePath: branchOriginal.imagePath,
      width: branchOriginal.largeur,
      height: branchOriginal.taille,
      audioPath: branchOriginal.audioPath,
      enfants: branchOriginal.enfants,
      texte: branchOriginal.texte,
    });
    branchCopy.draggingChange("DO_NOT_DRAG");
    branchOriginal.showLines(false);
    branchCopy.original = branchOriginal;
    branchCopy.isFavorite = true;
    branchCopy.setUIManager(this);
    this.add(branchCopy);
    this.favorites.push(branchCopy);
  }

  removeFavorite(branchOriginal) {
    branchOriginal.showLines(false);
    const favoriteIndex = this.favorites.findIndex(
      (fav) => fav === branchOriginal || fav.original === branchOriginal,
    );
    console.log("Removing favorite branch", favoriteIndex, this.favorites);
    if (favoriteIndex > -1) {
      const branchCopy = this.favorites[favoriteIndex];
      const original = branchCopy.original || branchOriginal;

      // Restore children to the original branch
      if (original && branchCopy.enfants && branchCopy.enfants.length > 0) {
        original.etage = new Etage(branchCopy.enfants, original);
        original.etage.visible = false;
        if (original.etage.parent !== original) {
          original.add(original.etage);
        }
      }
      branchCopy.showLines(false);
      this.remove(branchCopy);
      this.favorites.splice(favoriteIndex, 1);
    }
  }
  acote(enfant, valeurX, valeurY, valeurZ, parent, largeur) {
    const localOffset = new THREE.Vector3(valeurX, valeurY, valeurZ);
    const worldOffset = localOffset.applyQuaternion(parent.quaternion);
    enfant.position.copy(parent.position).add(worldOffset);
    enfant.quaternion.copy(parent.quaternion);
    enfant.layers.set(0);
    enfant.scale.set(largeur.x, largeur.y, largeur.z);
  }

  _positionEtage() {
    if (!this.etage) return;
    this.etage.layout(1.2, 0.3, this.panel);
    this.etage.lookAt(
      xb.camera.position.x,
      this.panel.position.y,
      xb.camera.position.z,
    );
    this.acote(this.etage, 0, -1.75, 0, this.panel, new THREE.Vector3(1, 1, 1));
  }
  _positionFavorite() {
    if (this.favorites.length === 0) return;
    const spacingX = 0.8;
    for (let i = 0; i < this.favorites.length; i++) {
      const branchCopy = this.favorites[i];
      const isLeft = i % 2 === 0;
      const offsetX = isLeft
        ? -(spacingX * Math.floor(i / 2 + 1))
        : spacingX * Math.floor(i / 2 + 1);
      this.acote(
        branchCopy,
        offsetX,
        -2,
        0,
        this.panel,
        new THREE.Vector3(1, 1, 1),
      );
    }
  }
  update(dt) {
    const viewDirection = new THREE.Vector3();
    xb.camera.getWorldDirection(viewDirection);
    viewDirection.y = 0;
    viewDirection.normalize();
    const targetPos = new THREE.Vector3().copy(xb.camera.position);
    targetPos.addScaledVector(viewDirection, 0.4);
    targetPos.y -= 1;
    this.panel.position.set(targetPos.x, targetPos.y, targetPos.z);
    this.panel.lookAt(
      xb.camera.position.x,
      this.panel.position.y,
      xb.camera.position.z,
    );
    this.panel.rotateX(-70);
    this._positionFavorite();
  }
}
