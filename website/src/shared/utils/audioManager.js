/**
 * Global audio manager ensuring only one <audio> element plays at a time.
 * It pauses any previously playing audio before starting a new one.
 */
class AudioManager {
  constructor() {
    this.current = null;
  }

  /**
   * Start playback on the provided element, stopping any prior audio.
   * @param {HTMLAudioElement} audio
   */
  async play(audio) {
    if (this.current && this.current !== audio) {
      this.current.pause();
    }
    this.current = audio;
    return audio.play();
  }

  /**
   * Stop playback if the element is the current one.
   * @param {HTMLAudioElement} audio
   */
  stop(audio) {
    if (!audio) return;
    audio.pause();
    audio.src = "";
    if (this.current === audio) {
      this.current = null;
    }
  }
}

export const audioManager = new AudioManager();
