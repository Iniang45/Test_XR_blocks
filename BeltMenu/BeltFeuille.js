import * as xb from "xrblocks";

/**
 * Leaf panel component for belt menu - like PanelNonBinaire but with BeltSecondaire styling
 * No favorite button, customizable background color, optional text label
 */
export class BeltFeuille extends xb.Script {
  constructor(
    imagePath = "./images/know.jpg",
    largeur = 1.2,
    taille = 0.6,
    texte = null,
    backgroundColor = "#3b82f6aa",
  ) {
    super();
    const panel = new xb.SpatialPanel({
      backgroundColor,
      width: largeur,
      height: taille,
      showEdge: true,
    });
    this.panel = panel;
    this.panelBaseScale = this.panel.scale.clone();
    console.log("BeltFeuille created:", panel);
    this.add(panel);
    const grid = panel.addGrid();

    if (texte) {
      const textRow = grid.addRow({ weight: 0.2 });
      this.labelText = textRow.addText({
        text: texte,
        fontColor: "#ffffff",
        fontSize: 0.15,
      });
    }

    const imageRow = grid.addRow({ weight: texte ? 0.8 : 1.0 });
    this.imageWidget = imageRow.addImage({
      src: imagePath,
    });
    this.imageWidget.onTriggered = () => this._onImageClicked();
    const spawn = this.panel.position.clone();
    this.spawn = spawn;
  }

  changeColor() {
    const randomColor = (Math.random() * 0xffffff) | 0;
    const colorHex = "#" + randomColor.toString(16).padStart(6, "0");
    this.panel.backgroundColor = colorHex;

    const vec = this.panel.mesh.uniforms.uBackgroundColor.value;
    const c = new THREE.Color(colorHex);
    vec.set(c.r, c.g, c.b, vec.w !== undefined ? vec.w : 1.0);

    return randomColor;
  }

  _onImageClicked() {
    console.log("Image clicked", this.imageWidget.src);
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

  draggingChange(draggingmode) {
    this.panel.draggingMode = draggingmode;
  }

  update() {
    this.panel.scale.copy(this.panelBaseScale);
  }
}
