import * as xb from "xrblocks";

const DISPLAY_MIN = 50;
const DISPLAY_MAX = 150;
const BRIGHTNESS_MIN = 40;
const BRIGHTNESS_MAX = 140;

/**
 * Extracted panel dedicated to display settings.
 */
export class CarouselDisplayPanel extends xb.Script {
  constructor(item, onClose) {
    super();

    this.item = item;
    this.onClose = onClose;
    this.targetYaw = 0;

    this.displayScale = 100;
    this.displayBrightness = 100;
    this.displayTheme = "Sombre";

    const panel = new xb.SpatialPanel({
      backgroundColor: "#101522ee",
      width: 0.42,
      height: 0.48,
      header: item.title,
    });
    this.panel = panel;
    this.add(panel);

    const grid = panel.addGrid();
    grid.addRow({ weight: 0.2 }).addImage({
      src: item.image,
    });

    this._buildDisplayControls(grid);
    this._applyDisplayScale();
    this._applyDisplayTheme();

    const orbiter = grid.addOrbiter();
    this.orbiter = orbiter;
  }

  _buildDisplayControls(grid) {
    const brightValueRow = grid.addRow({ weight: 0.1 });
    brightValueRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "brightness_6", fontSize: 0.58 });
    this.brightnessText = brightValueRow.addCol({ weight: 0.5 }).addText({
      text: "100%",
      fontColor: "#ffffff",
      fontSize: 0.065,
    });

    const brightSliderRow = grid.addRow({ weight: 0.13 });
    const brightControlCol = brightSliderRow.addCol({ weight: 0.5 });
    this.brightnessSlider = this._addSlider(brightControlCol, {
      min: BRIGHTNESS_MIN,
      max: BRIGHTNESS_MAX,
      value: this.displayBrightness,
      onChange: (nextValue) => {
        this.displayBrightness = Math.max(
          BRIGHTNESS_MIN,
          Math.min(BRIGHTNESS_MAX, nextValue),
        );
        this._refreshDisplayTexts();
        this._applyDisplayTheme();
      },
    });
    if (!this.brightnessSlider) {
      const downBtn = brightControlCol.addIconButton({
        text: "remove",
        fontSize: 0.5,
      });
      const upBtn = brightSliderRow
        .addCol({ weight: 0.5 })
        .addIconButton({ text: "add", fontSize: 0.5 });

      downBtn.onTriggered = () => {
        this.displayBrightness = Math.max(
          BRIGHTNESS_MIN,
          this.displayBrightness - 10,
        );
        this._refreshDisplayTexts();
        this._applyDisplayTheme();
      };

      upBtn.onTriggered = () => {
        this.displayBrightness = Math.min(
          BRIGHTNESS_MAX,
          this.displayBrightness + 10,
        );
        this._refreshDisplayTexts();
        this._applyDisplayTheme();
      };
    }

    const scaleValueRow = grid.addRow({ weight: 0.1 });
    scaleValueRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "aspect_ratio", fontSize: 0.58 });
    this.scaleText = scaleValueRow.addCol({ weight: 0.5 }).addText({
      text: "100%",
      fontColor: "#ffffff",
      fontSize: 0.065,
    });

    const scaleSliderRow = grid.addRow({ weight: 0.13 });
    const scaleControlCol = scaleSliderRow.addCol({ weight: 0.5 });
    this.scaleSlider = this._addSlider(scaleControlCol, {
      min: DISPLAY_MIN,
      max: DISPLAY_MAX,
      value: this.displayScale,
      onChange: (nextValue) => {
        this.displayScale = Math.max(
          DISPLAY_MIN,
          Math.min(DISPLAY_MAX, nextValue),
        );
        this._refreshDisplayTexts();
        this._applyDisplayScale();
      },
    });
    if (!this.scaleSlider) {
      const downBtn = scaleControlCol.addIconButton({
        text: "remove",
        fontSize: 0.5,
      });
      const upBtn = scaleSliderRow
        .addCol({ weight: 0.5 })
        .addIconButton({ text: "add", fontSize: 0.5 });

      downBtn.onTriggered = () => {
        this.displayScale = Math.max(DISPLAY_MIN, this.displayScale - 10);
        this._refreshDisplayTexts();
        this._applyDisplayScale();
      };

      upBtn.onTriggered = () => {
        this.displayScale = Math.min(DISPLAY_MAX, this.displayScale + 10);
        this._refreshDisplayTexts();
        this._applyDisplayScale();
      };
    }

    const themeRow = grid.addRow({ weight: 0.1 });
    this.themeIcon = themeRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "dark_mode", fontSize: 0.58 });
    this.themeText = themeRow.addCol({ weight: 0.5 }).addText({
      text: "DARK",
      fontColor: "#cde7ff",
      fontSize: 0.06,
    });

    const actionRow = grid.addRow({ weight: 0.18 });
    const themeBtn = actionRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "contrast", fontSize: 0.58 });
    const closeBtn = actionRow
      .addCol({ weight: 0.5 })
      .addIconButton({ text: "close", fontSize: 0.58 });

    themeBtn.onTriggered = () => {
      this.displayTheme = this.displayTheme === "Sombre" ? "Clair" : "Sombre";
      this._refreshDisplayTexts();
      this._applyDisplayTheme();
    };

    closeBtn.onTriggered = () => {
      if (typeof this.onClose === "function") {
        this.onClose();
      }
    };
  }

  _refreshDisplayTexts() {
    if (this.brightnessText) {
      this._setWidgetText(this.brightnessText, `${this.displayBrightness}%`);
    }
    if (this.scaleText) {
      this._setWidgetText(this.scaleText, `${this.displayScale}%`);
    }
    if (this.themeText) {
      this._setWidgetText(
        this.themeText,
        this.displayTheme === "Sombre" ? "DARK" : "LIGHT",
      );
    }
    if (this.themeIcon) {
      this._setWidgetText(
        this.themeIcon,
        this.displayTheme === "Sombre" ? "dark_mode" : "light_mode",
      );
    }
    if (this.brightnessSlider) {
      this._setSliderValue(this.brightnessSlider, this.displayBrightness);
    }
    if (this.scaleSlider) {
      this._setSliderValue(this.scaleSlider, this.displayScale);
    }
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

  _applyDisplayScale() {
    const scale = this.displayScale / 100;
    this.panel.scale.set(scale, scale, scale);
  }

  _applyDisplayTheme() {
    const isDark = this.displayTheme === "Sombre";
    let alpha =
      0.2 +
      ((this.displayBrightness - BRIGHTNESS_MIN) /
        (BRIGHTNESS_MAX - BRIGHTNESS_MIN)) *
        0.65;
    alpha = Math.max(0.15, Math.min(0.85, alpha));
    const hex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    this.panel.backgroundColor = isDark ? `#101522${hex}` : `#f4f7ff${hex}`;
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
