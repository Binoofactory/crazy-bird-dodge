export class Sfx {
    alert = new Audio('/src/assets/sfx_alert.mp3');
    shot = new Audio('/src/assets/sfx_shot.mp3');
    clear = new Audio('/src/assets/sfx_stage_clear.mp3');
    constructor() {
      this.alert.preload = 'auto';
      this.shot.preload = 'auto';
      this.clear.preload = 'auto';
      this.alert.volume = 0.6; this.shot.volume = 0.7; this.clear.volume = 0.8;
    }
  }