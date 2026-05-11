import * as xb from "xrblocks";
import { CarouselSoundPanel } from "./CarouselSoundPanel.js";
import { CarouselDisplayPanel } from "./CarouselDisplayPanel.js";

/**
 * Backward-compatible wrapper around dedicated settings components.
 */
export class CarouselSettingsPanel extends xb.Script {
  constructor(item, onClose, onPlaySound) {
    super();

    const Impl =
      item?.kind === "display" ? CarouselDisplayPanel : CarouselSoundPanel;
    this.impl = new Impl(item, onClose, onPlaySound);
    this.panel = this.impl.panel;
    this.add(this.impl);
  }

  setTargetPosition(position) {
    if (typeof this.impl?.setTargetPosition === "function") {
      this.impl.setTargetPosition(position);
    }
  }

  setTargetYaw(yaw) {
    if (typeof this.impl?.setTargetYaw === "function") {
      this.impl.setTargetYaw(yaw);
    }
  }

  lockUpright() {
    if (typeof this.impl?.lockUpright === "function") {
      this.impl.lockUpright();
    }
  }
}

export { CarouselSoundPanel } from "./CarouselSoundPanel.js";
export { CarouselDisplayPanel } from "./CarouselDisplayPanel.js";
