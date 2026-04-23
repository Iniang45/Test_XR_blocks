import * as xb from "xrblocks";

const SOUND_MIN = 0;
const SOUND_MAX = 100;

/**
 * Extracted panel dedicated to sound settings.
 */
export class CarouselSoundPanel extends xb.Script {
  constructor(item, onClose, onPlaySound) {
    super();

    this.item = item;
    this.onClose = onClose;
    this.onPlaySound = onPlaySound;
    this.targetYaw = 0;

    this.soundEnabled = true;
    this.soundLevel = 70;

    const panel = new xb.SpatialPanel({
      backgroundColor: "#101522ee",
      width: 0.42,
      height: 0.48,
      header: item.title,
    });
    this.panel = panel;
    this.add(panel);

    const grid = panel.addGrid();
    grid.addRow({ weight: 0.32 }).addImage({
      src: item.image,
    });

    this._buildSoundControls(grid);
    this._applyAudioLevel();

    const orbiter = grid.addOrbiter();
    this.orbiter = orbiter;
  }

  _buildSoundControls(grid) {
    const valueRow = grid.addRow({ weight: 0.12 });
    valueRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "volume_up", fontSize: 0.6 });
    this.soundValueText = valueRow.addCol({ weight: 0.5 }).addText({
      text: "70%",
      fontColor: "#ffffff",
      fontSize: 0.075,
    });

    const sliderRow = grid.addRow({ weight: 0.2 });
    const sliderCol = sliderRow.addCol({ weight: 1 });
    this.volumeSlider = this._addSlider(sliderCol, {
      min: SOUND_MIN,
      max: SOUND_MAX,
      value: this.soundLevel,
      onChange: (nextValue) => {
        this.soundLevel = Math.max(SOUND_MIN, Math.min(SOUND_MAX, nextValue));
        this._refreshSoundTexts();
        this._applyAudioLevel();
      },
    });
    if (!this.volumeSlider) {
      const fallbackRow = grid.addRow({ weight: 0.1 });
      const downBtn = fallbackRow
        .addCol({ weight: 0.5 })
        .addIconButton({ text: "remove", fontSize: 0.5 });
      const upBtn = fallbackRow
        .addCol({ weight: 0.5 })
        .addIconButton({ text: "add", fontSize: 0.5 });

      downBtn.onTriggered = () => {
        this.soundLevel = Math.max(SOUND_MIN, this.soundLevel - 10);
        this._refreshSoundTexts();
        this._applyAudioLevel();
      };

      upBtn.onTriggered = () => {
        this.soundLevel = Math.min(SOUND_MAX, this.soundLevel + 10);
        this._refreshSoundTexts();
        this._applyAudioLevel();
      };
    }

    const actionRow = grid.addRow({ weight: 0.18 });
    const muteBtn = actionRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "volume_off", fontSize: 0.6 });
    const testBtn = actionRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "play_arrow", fontSize: 0.6 });
    const closeBtn = grid
      .addRow({ weight: 0.18 })
      .addIconButton({ text: "close", fontSize: 0.6 });

    muteBtn.onTriggered = () => {
      this.soundEnabled = !this.soundEnabled;
      this._setWidgetText(
        muteBtn,
        this.soundEnabled ? "volume_off" : "volume_up",
      );
      this._refreshSoundTexts();
      this._applyAudioLevel();
    };

    testBtn.onTriggered = () => {
      if (!this.soundEnabled || this.soundLevel <= 0) return;
      if (typeof this.onPlaySound === "function") {
        this.onPlaySound();
      }
    };

    closeBtn.onTriggered = () => {
      if (typeof this.onClose === "function") {
        this.onClose();
      }
    };
  }

  _refreshSoundTexts() {
    if (this.soundValueText) {
      const plain = `${this.soundLevel}%`;
      this._setWidgetText(
        this.soundValueText,
        this.soundEnabled ? plain : this._muteSlashText(plain),
      );
    }
    if (this.volumeSlider) {
      this._setSliderValue(this.volumeSlider, this.soundLevel);
    }
  }

  _muteSlashText(text) {
    return text
      .split("")
      .map((char) => `${char}\u0336`)
      .join("");
  }

  _addSlider(container, { min, max, value, onChange }) {
    if (typeof container.addSlider !== "function") {
      return null;
    }

    const slider = container.addSlider({
      min,
      max,
      value,
      backgroundColor: "#1f2937",
      foregroundColor: "#2a9d8f",
    });

    this._bindSliderChange(slider, onChange);
    return slider;
  }

  _bindSliderChange(slider, onChange) {
    const emit = (payload) => {
      const next = this._extractSliderValue(payload);
      if (Number.isFinite(next)) {
        onChange(next);
      }
    };

    if (typeof slider.onValueChanged !== "undefined") {
      slider.onValueChanged = emit;
    }
    if (typeof slider.onChanged !== "undefined") {
      slider.onChanged = emit;
    }
    if (typeof slider.onChange !== "undefined") {
      slider.onChange = emit;
    }
  }

  _extractSliderValue(payload) {
    if (typeof payload === "number") return payload;
    if (payload && typeof payload.value === "number") return payload.value;
    if (payload && payload.detail && typeof payload.detail.value === "number") {
      return payload.detail.value;
    }
    return NaN;
  }

  _setSliderValue(slider, value) {
    if (!slider) return;
    if (typeof slider.setValue === "function") {
      slider.setValue(value);
      return;
    }
    if ("value" in slider) {
      slider.value = value;
    }
  }

  _setWidgetText(widget, text) {
    if (!widget) return;
    if (typeof widget.setText === "function") {
      widget.setText(text);
      return;
    }
    if ("text" in widget) {
      widget.text = text;
    }
  }

  _applyAudioLevel() {
    const listener = xb.core?.audioListener;
    if (!listener || typeof listener.setMasterVolume !== "function") return;

    const normalized = this.soundEnabled ? this.soundLevel / 100 : 0;
    listener.setMasterVolume(normalized);
  }

  setTargetPosition(position) {
    this.panel.position.copy(position);
  }

  setTargetYaw(yaw) {
    this.targetYaw = yaw;
    this.panel.rotation.set(0, this.targetYaw, 0);
  }

  lockUpright() {
    this.panel.rotation.set(0, this.targetYaw, 0);
  }
}
