/**
 * Etage: simple gestionnaire pour positionner des branches à un niveau.
 */
import * as THREE from "three";
import * as xb from "xrblocks";
export class Etage extends xb.Script {
  constructor(branches = [], parent = null) {
    super();
    this.branches = branches;
    this.parent = parent;

    for (const branch of this.branches) {
      this.add(branch);
      branch.visible = false;
    }
  }

  layout(spacingX = 0.94, offsetY = 0.32, parent = null) {
    const count = this.branches.length;
    if (count === 0) return;
    if (parent) {
      const parentWorldPos = new THREE.Vector3();
      parent.getWorldPosition(parentWorldPos);
    }
    // Positionner chaque branche côte à côte et centrée
    const start = -Math.floor(count / 2);
    for (let i = start; i < start + count; i++) {
      const idx = i - start;
      const branch = this.branches[idx];
      if (!branch) continue;

      switch (count % 2 == 0) {
        case false:
          branch.position.set(i * spacingX, offsetY, 0);
          break;
        case true:
          if (i == 0) {
            i = 1;
          }
          branch.position.set((i * spacingX) / 1.4, offsetY, 0);

          break;
      }
      branch.visible = true;
    }
  }
}
