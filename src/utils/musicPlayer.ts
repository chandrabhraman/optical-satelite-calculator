// Simple singleton music player for looped background playback

export const musicPlayer = (() => {
  let audio: HTMLAudioElement | null = null;
  let muted = false;

  const ensure = (src: string) => {
    if (!audio) {
      audio = new Audio(src);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.4;
      audio.muted = muted;
      // Log errors to avoid uncaught promise rejections
      audio.addEventListener("error", () => {
        console.error("Background music failed to load or play:", src);
      });
    } else {
      const absolute = new URL(src, window.location.origin).href;
      if (audio.src !== absolute) {
        audio.src = src;
      }
    }
    return audio;
  };

  const playLoop = (src: string) => {
    const a = ensure(src);
    const playPromise = a.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.warn("Autoplay blocked; will start after user interaction:", err);
      });
    }
  };

  const toggleMute = () => {
    if (!audio) {
      muted = !muted;
      return muted;
    }
    audio.muted = !audio.muted;
    muted = audio.muted;
    return muted;
  };

  const setMuted = (m: boolean) => {
    muted = m;
    if (audio) audio.muted = m;
  };

  const isMuted = () => (audio ? audio.muted : muted);
  const isPlaying = () => !!(audio && !audio.paused);

  return { playLoop, toggleMute, setMuted, isMuted, isPlaying };
})();
