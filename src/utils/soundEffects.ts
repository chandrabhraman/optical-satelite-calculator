
// Sound effects utility for consistent audio feedback

/**
 * Play a sound effect with the given URL
 * @param soundUrl URL of the sound effect to play
 * @param volume Volume level between 0 and 1
 */
export const playSound = (soundUrl: string, volume = 0.5) => {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = volume;
    
    // Set a short timeout to ensure better browser compatibility
    setTimeout(() => {
      const playPromise = audio.play();
      
      // Handle promise rejection (common in some browsers)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Sound playback prevented:", error);
        });
      }
    }, 10);
  } catch (error) {
    console.error("Error playing sound effect:", error);
  }
};

// Sound effect URLs
export const SOUNDS = {
  calculate: "/sounds/calculate.mp3",
  simulate: "/sounds/simulate.mp3",
  upload: "/sounds/upload.mp3",
  backgroundLoop: "/sounds/sci-fi-underscore-loop-300215.mp3"
};
