import * as THREE from "three";
import * as xb from "xrblocks";

export class Line extends xb.Script {
  constructor(panel1, panel2, options = {}) {
    super();
    this.panel1 = panel1; // Le panel (départ)
    this.panel2 = panel2; // L'image (arrivée)

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: options.color || 0xffffff,
      linewidth: options.width || 2,
    });

    this.line = new THREE.Line(geometry, material);
    this.line.raycast = () => {};
    this.line.frustumCulled = false;
    this.add(this.line);
  }
  supp() {
    this.remove(this.line);
    this.line = null;
    console.log("line removed");
  }
  update(dt) {
    if (!this.line) return;
    const posAttribute = this.line.geometry.getAttribute("position");

    // 1. Point de départ : Haut/Centre du Panel
    const startPoint = new THREE.Vector3(
      this.panel2.width / 2,
      this.panel2.height * -1,
      0,
    );
    this.panel1.localToWorld(startPoint);

    // 2. Point d'arrivée : Bas/Centre de l'Image
    const endPoint = new THREE.Vector3(0, 0, 0); // 0.25 (height) / 2
    this.panel2.localToWorld(endPoint);

    // Mise à jour de la géométrie
    posAttribute.setXYZ(0, startPoint.x, startPoint.y, startPoint.z);
    posAttribute.setXYZ(1, endPoint.x, endPoint.y, endPoint.z);

    posAttribute.needsUpdate = true;
  }
}
