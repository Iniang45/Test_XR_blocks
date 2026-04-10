import * as THREE from "three";
import * as xb from "xrblocks";

export class SoundEffectPlayer {
  constructor(audioPath, options = {}) {
    this.audioPath = audioPath;
    this.loop = options.loop ?? false;
    this.volume = options.volume ?? 0.5;

    if (!SoundEffectPlayer.listener) {
      SoundEffectPlayer.listener = new THREE.AudioListener();
      xb.camera.add(SoundEffectPlayer.listener);
    }

    this.audio = new THREE.Audio(SoundEffectPlayer.listener);
    this.loader = new THREE.AudioLoader();
  }

  setAudioPath(audioPath) {
    this.audioPath = audioPath;
  }

  joue(delay = 0, delayArret = 0) {
    this.loader.load(
      this.audioPath,
      (buffer) => {
        this.audio.setBuffer(buffer);
        this.audio.setLoop(this.loop);
        this.audio.setVolume(this.volume);
        if (this.audio.isPlaying) {
          this.audio.stop();
        }
        this.audio.play(delay);
        console.log("Lecture audio:", this.audioPath);
        if (delayArret > 0) {
          this.audio.stop(delayArret);
          console.log("Arrêt audio dans", delayArret, "secondes");
        }
      },
      undefined,
      (error) => {
        console.error("Erreur chargement audio:", this.audioPath, error);
      },
    );
  }
}
