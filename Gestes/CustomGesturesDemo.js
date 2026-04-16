import * as THREE from "three";
import * as xb from "xrblocks";

const GESTURE_LABELS = [
  "OTHER",
  "FIST",
  "THUMB UP",
  "THUMB DOWN",
  "POINT",
  "VICTORY",
  "ROCK",
  "SHAKA",
  "GESTURE_LABEL_MAX_ENUM",
];

const toAssetUrl = (assetPath) =>
  new URL(assetPath, import.meta.url).toString();

const GESTURE_IMAGES = [
  toAssetUrl("./images/empty.png"),
  toAssetUrl("./images/fist.png"),
  toAssetUrl("./images/thumb.png"),
  toAssetUrl("./images/thumb_down.png"),
  toAssetUrl("./images/point.png"),
  toAssetUrl("./images/victory.png"),
  toAssetUrl("./images/rock.png"),
  toAssetUrl("./images/shaka.png"),
  toAssetUrl("./images/error.png"),
];

const LEFT_HAND_INDEX = 0;
const RIGHT_HAND_INDEX = 1;

const UNKNOWN_GESTURE = 0;

/**
 * A demo scene that uses a custom ML model to detect and display static hand
 * gestures for both hands in real-time.
 */
export class CustomGestureDemo extends xb.Script {
  constructor() {
    super();

    // Initializes UI.
    {
      // Make a root panel>grid>row>controlPanel>grid
      const panel = new xb.SpatialPanel({ backgroundColor: "#00000000" });
      panel.position.set(0, 0, 0);
      this.add(panel);

      const grid = panel.addGrid();

      // Show user data
      const dataRow = grid.addRow({ weight: 0.3 });
      // Left hand image and text
      const leftCol = dataRow.addCol({ weight: 0.5 });
      const leftHandRow = leftCol.addRow({ weight: 0.5 });
      // Indentation
      leftHandRow.addCol({ weight: 0.4 });
      this.leftHandImage = leftHandRow.addCol({ weight: 0.2 }).addImage({
        src: GESTURE_IMAGES[0],
        scaleFactor: 0.3,
      });
      this.leftHandLabel = leftCol.addRow({ weight: 0.5 }).addText({
        text: "Loading...",
        fontColor: "#ffffff",
      });
      const rightCol = dataRow.addCol({ weight: 0.5 });
      const rightHandRow = rightCol.addRow({ weight: 0.5 });
      // Indentation
      rightHandRow.addCol({ weight: 0.4 });
      // Image
      this.rightHandImage = rightHandRow.addCol({ weight: 0.2 }).addImage({
        src: GESTURE_IMAGES[0],
        scaleFactor: 0.3,
      });
      this.rightHandLabel = rightCol.addRow({ weight: 0.4 }).addText({
        text: "Loading...",
        fontColor: "#ffffff",
      });

      // Indentation
      grid.addRow({ weight: 0.1 });

      // Control row
      const controlRow = grid.addRow({ weight: 0.6 });
      const ctrlPanel = controlRow.addPanel({ backgroundColor: "#00000055" });
      const ctrlGrid = ctrlPanel.addGrid();
      {
        // Left indentation
        ctrlGrid.addCol({ weight: 0.1 });

        // Middle column
        const midColumn = ctrlGrid.addCol({ weight: 0.8 });

        midColumn.addRow({ weight: 0.1 });
        midColumn.addRow({ weight: 0.2 }).addText({
          text: "Perform one of these gestures",
          fontColor: "#ffffff",
        });
        midColumn
          .addRow({ weight: 0.2 })
          .addText({ text: "(either hand):", fontColor: "#ffffff" });
        const gesturesRow = midColumn.addRow({ weight: 0.5 });
        gesturesRow.addCol({ weight: 0.1 });
        gesturesRow
          .addCol({ weight: 0.1 })
          .addImage({ src: toAssetUrl("./images/fist.png"), scaleFactor: 0.3 });
        gesturesRow.addCol({ weight: 0.1 }).addImage({
          src: toAssetUrl("./images/thumb.png"),
          scaleFactor: 0.3,
        });
        gesturesRow.addCol({ weight: 0.1 }).addImage({
          src: toAssetUrl("./images/thumb_down.png"),
          scaleFactor: 0.3,
        });
        gesturesRow.addCol({ weight: 0.1 }).addImage({
          src: toAssetUrl("./images/point.png"),
          scaleFactor: 0.3,
        });
        gesturesRow.addCol({ weight: 0.1 }).addImage({
          src: toAssetUrl("./images/victory.png"),
          scaleFactor: 0.3,
        });
        gesturesRow
          .addCol({ weight: 0.1 })
          .addImage({ src: toAssetUrl("./images/rock.png"), scaleFactor: 0.3 });
        gesturesRow.addCol({ weight: 0.1 }).addImage({
          src: toAssetUrl("./images/shaka.png"),
          scaleFactor: 0.3,
        });

        // Vertical alignment on the description text element.
        midColumn.addRow({ weight: 0.1 });

        // Right indentation.
        ctrlGrid.addCol({ weight: 0.1 });
      }

      const orbiter = ctrlGrid.addOrbiter();
      orbiter.addExitButton();

      panel.updateLayouts();

      this.panel = panel;
    }

    this.lastPublishedGestures = {
      left: UNKNOWN_GESTURE,
      right: UNKNOWN_GESTURE,
    };

    this.frameId = 0;
  }

  init() {
    // Adds light.
    this.add(new THREE.HemisphereLight(0x888877, 0x777788, 3));
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(0, 4, 0);
    this.add(light);
  }

  #getJoint(joints, name) {
    if (!joints) {
      return null;
    }

    if (typeof joints.get === "function") {
      return joints.get(name) || null;
    }

    return joints[name] || null;
  }

  #distance(a, b) {
    if (!a || !b) {
      return Infinity;
    }

    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  #isExtended(joints, tipName, baseName) {
    const wrist = this.#getJoint(joints, "wrist")?.position;
    const tip = this.#getJoint(joints, tipName)?.position;
    const base = this.#getJoint(joints, baseName)?.position;
    if (!wrist || !tip || !base) {
      return false;
    }

    const tipDistance = this.#distance(tip, wrist);
    const baseDistance = this.#distance(base, wrist);
    if (!Number.isFinite(tipDistance) || !Number.isFinite(baseDistance)) {
      return false;
    }

    return tipDistance > baseDistance * 1.08;
  }

  #classifyGesture(joints) {
    if (!joints || Object.keys(joints).length !== 25) {
      return UNKNOWN_GESTURE;
    }

    const wrist = this.#getJoint(joints, "wrist")?.position;
    const thumbTip = this.#getJoint(joints, "thumb-tip")?.position;
    const indexExtended = this.#isExtended(
      joints,
      "index-finger-tip",
      "index-finger-phalanx-intermediate",
    );
    const middleExtended = this.#isExtended(
      joints,
      "middle-finger-tip",
      "middle-finger-phalanx-intermediate",
    );
    const ringExtended = this.#isExtended(
      joints,
      "ring-finger-tip",
      "ring-finger-phalanx-intermediate",
    );
    const pinkyExtended = this.#isExtended(
      joints,
      "pinky-finger-tip",
      "pinky-finger-phalanx-intermediate",
    );
    const thumbExtended = this.#isExtended(
      joints,
      "thumb-tip",
      "thumb-phalanx-distal",
    );

    const fingersExtendedCount = [
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended,
    ].filter(Boolean).length;

    if (
      thumbTip &&
      wrist &&
      thumbExtended &&
      !indexExtended &&
      !middleExtended &&
      !ringExtended &&
      !pinkyExtended
    ) {
      const yDelta = thumbTip.y - wrist.y;
      if (yDelta > 0.04) {
        return 2;
      }
      if (yDelta < -0.04) {
        return 3;
      }
    }

    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return 5;
    }

    if (indexExtended && pinkyExtended && !middleExtended && !ringExtended) {
      return 6;
    }

    if (
      thumbExtended &&
      pinkyExtended &&
      !indexExtended &&
      !middleExtended &&
      !ringExtended
    ) {
      return 7;
    }

    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return 4;
    }

    if (fingersExtendedCount === 0 && !thumbExtended) {
      return 1;
    }

    return UNKNOWN_GESTURE;
  }

  #publishGestureIfChanged(hand, gestureIndex) {
    if (hand !== "left" && hand !== "right") {
      return;
    }
    if (this.lastPublishedGestures[hand] === gestureIndex) {
      return;
    }

    this.lastPublishedGestures[hand] = gestureIndex;
    window.dispatchEvent(
      new CustomEvent("custom-gesture-changed", {
        detail: {
          hand,
          gestureIndex,
          label: GESTURE_LABELS[gestureIndex],
        },
      }),
    );
  }

  async update() {
    if (this.frameId % 5 === 0) {
      const hands = xb.user.hands;
      if (hands != null && hands.hands && hands.hands.length > 0) {
        // Left hand.
        const leftHand = hands.hands[LEFT_HAND_INDEX];
        if (leftHand && leftHand.joints) {
          const leftJoints = leftHand.joints;
          const leftHandResult = this.#classifyGesture(leftJoints);

          // Update image and label.
          this.leftHandImage.load(GESTURE_IMAGES[leftHandResult]);
          this.leftHandLabel.setText(GESTURE_LABELS[leftHandResult]);
          this.#publishGestureIfChanged("left", leftHandResult);
        }

        // Right hand.
        const rightHand = hands.hands[RIGHT_HAND_INDEX];
        if (rightHand && rightHand.joints) {
          const rightJoints = rightHand.joints;
          const rightHandResult = this.#classifyGesture(rightJoints);

          // Update image and label.
          this.rightHandImage.load(GESTURE_IMAGES[rightHandResult]);
          this.rightHandLabel.setText(GESTURE_LABELS[rightHandResult]);
          this.#publishGestureIfChanged("right", rightHandResult);
        }
      }
    }
    this.frameId++;
  }

  isThumbUpOrDown(p1, p2) {
    const deltaY = p2.y - p1.y;
    if (deltaY > 0.04) {
      return 1;
    }
    if (deltaY < -0.04) {
      return -1;
    }
    return 0;
  }
}
