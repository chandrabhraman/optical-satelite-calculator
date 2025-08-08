import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { musicPlayer } from "@/utils/musicPlayer";

const MusicToggle: React.FC = () => {
  const [muted, setMuted] = useState<boolean>(musicPlayer.isMuted());

  useEffect(() => {
    // Keep state in sync if other parts of the app toggle mute
    const sync = () => setMuted(musicPlayer.isMuted());
    // There's no global event bus; rely on visibility changes to resync occasionally
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const handleClick = () => {
    const newMuted = musicPlayer.toggleMute();
    setMuted(newMuted);
  };

  return (
    <button
      aria-label={muted ? "Unmute background music" : "Mute background music"}
      onClick={handleClick}
      className="absolute right-4 top+4 z-50 text-[hsl(0_0%_100%)] hover-scale"
    >
      {muted ? <VolumeX size={28} /> : <Volume2 size={28} />}
    </button>
  );
};

export default MusicToggle;
