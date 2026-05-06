import * as THREE from "three";
import * as xb from "xrblocks";

let audioCtx = null;

function playPianoNote(frequency) {
  // Initialisation de l'AudioContext lors de la première interaction utilisateur
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  console.log("Playing piano note at frequency:", frequency);

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // Mélange pour un son plus proche d'un piano électrique
  osc1.type = "sine";
  osc2.type = "triangle";
  osc1.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  osc2.frequency.setValueAtTime(frequency, audioCtx.currentTime);

  // Enveloppe d'amplitude (Attack percussive, Decay rapide, Release modéré)
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.0);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc1.start();
  osc2.start();
  osc1.stop(audioCtx.currentTime + 2.0);
  osc2.stop(audioCtx.currentTime + 2.0);
}

export class Line extends xb.Script {
  constructor(object1, object2, options = {}) {
    super();
    this.object1 = object1;
    this.object2 = object2;
    this.frequency = options.frequency || 261.63; // Do (C4) par défaut

    const color = options.color !== undefined ? options.color : 0xffffcc;
    this.baseColor = new THREE.Color(color);
    this.flashColor = new THREE.Color(0xffffff);
    this.flashIntensity = 0;
    this.material = new THREE.MeshBasicMaterial({
      color: this.baseColor,
      transparent: true,
      opacity: 0.9,
    });

    const geometry = new THREE.BufferGeometry();
    this.connectionLine = new THREE.Mesh(geometry, this.material);
    this.add(this.connectionLine);

    this.vibrationAmp = 0;
    this.vibrationTime = 0;

    this.hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.add(this.hitbox);
  }
  ChangementBasePolaire(r, theta, x, y) {
    const newX = r * Math.cos(theta);
    const newY = r * Math.sin(theta);
    return { x: newX, y: newY };
  }

  estAuDessus(pos1, pos2) {
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    const angle = Math.atan2(dy, dz);
    return { angle, pos1AuDessus: angle < 0 };
  }
  positionLine() {
    const anchor1 = this.object1.panel || this.object1;
    const anchor2 = this.object2.panel || this.object2;
    anchor1.updateWorldMatrix(true, false);
    anchor2.updateWorldMatrix(true, false);
    const pos1 = new THREE.Vector3();
    const pos2 = new THREE.Vector3();
    anchor1.getWorldPosition(pos1);
    anchor2.getWorldPosition(pos2);
    const parent = this.parent;
    if (parent) {
      parent.updateWorldMatrix(true, false);
      parent.worldToLocal(pos1);
      parent.worldToLocal(pos2);
    }
    const { x: zoffset, y: yoffset } = this.ChangementBasePolaire(
      anchor1.height / 2,
      2.46,
      pos1.z,
      pos1.y,
    );
    //pos1.y -= 0.42 * Math.sqrt(anchor1.height / 2):
    const { angle, pos1AuDessus } = this.estAuDessus(pos1, pos2);

    switch (pos1AuDessus) {
      case false:
        pos1.z += zoffset;
        pos1.y += yoffset;

        pos2.z -= zoffset;
        pos2.y -= yoffset;
        break;
      case true:
        pos1.z -= zoffset;
        pos1.y -= yoffset;
        pos2.z += zoffset;
        pos2.y += yoffset;
        break;
    }
    this.pos1Base = pos1.clone();
    this.pos2Base = pos2.clone();

    const midPoint = new THREE.Vector3()
      .addVectors(pos1, pos2)
      .multiplyScalar(0.5);

    const vibration = Math.sin(this.vibrationTime) * this.vibrationAmp;
    const direction = new THREE.Vector3().subVectors(pos2, pos1).normalize();
    const perpendicular = new THREE.Vector3(
      -direction.z,
      0,
      direction.x,
    ).normalize();

    const controlPoint = midPoint
      .clone()
      .addScaledVector(perpendicular, 0.3 + vibration);

    // CatmullRomCurve3 avec 3 points (début, contrôle, fin)
    const curve = new THREE.CatmullRomCurve3([pos1, controlPoint, pos2]);

    const radius = 0.015;
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, radius, 8, false);

    // Remplacer la géométrie du mesh
    this.connectionLine.geometry.dispose();
    this.connectionLine.geometry = tubeGeometry;

    this.position.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.scale.set(1, 1, 1);

    // Mettre à jour la hitbox au centre de la ligne
    const midLinePos = pos1.clone().lerp(pos2, 0.5);
    this.hitbox.position.copy(midLinePos);
    const dist = pos1.distanceTo(pos2);
    this.hitbox.scale.set(1, dist, 1);
  }

  strike() {
    // Vibration courte et tendue
    this.vibrationAmp = 0.05;
    this.vibrationTime = 0;

    // Flash visuel blanc bien visible
    this.flashIntensity = 1.0;
    this.material.opacity = 1.0;

    // Son de piano
    playPianoNote(this.frequency);
  }

  update(dt) {
    this.positionLine();

    if (this.vibrationAmp > 0.001) {
      // Amortissement rapide
      this.vibrationAmp *= 0.88;

      // Oscillation rapide
      this.vibrationTime += dt * 150.0;
    }

    // Flash visuel: blanc -> couleur d'origine
    if (this.flashIntensity > 0.001) {
      this.flashIntensity *= 0.84;
    } else {
      this.flashIntensity = 0;
    }
    this.material.color
      .copy(this.baseColor)
      .lerp(this.flashColor, this.flashIntensity);
    this.material.opacity = 0.9 + this.flashIntensity * 0.1;
  }

  onSelectStart(event) {
    const controller = event.target;

    // Vérification des collisions avec la hitbox
    const intersection = xb.core.user.select(this.hitbox, controller);

    if (intersection) {
      this.strike();

      // Retour haptique court (percussif)
      if (
        controller.gamepad &&
        controller.gamepad.hapticActuators &&
        controller.gamepad.hapticActuators.length > 0
      ) {
        controller.gamepad.hapticActuators[0].pulse(1.0, 50);
      }
    }
  }
}
