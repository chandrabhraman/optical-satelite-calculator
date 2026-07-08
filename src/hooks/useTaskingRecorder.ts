import { useCallback, useRef, useState } from 'react';
import { drawWatermark } from '@/utils/watermark';

function pickMime(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return 'video/webm';
}

export function useTaskingRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mirrorRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);

  const start = useCallback((sourceCanvas: HTMLCanvasElement) => {
    if (recorderRef.current || !sourceCanvas) return;
    try {
      // Mirror canvas so we can composite the watermark on top of the WebGL frame.
      const mirror = document.createElement('canvas');
      mirror.width = sourceCanvas.width || sourceCanvas.clientWidth || 1280;
      mirror.height = sourceCanvas.height || sourceCanvas.clientHeight || 720;
      const mctx = mirror.getContext('2d');
      if (!mctx) return;
      mirrorRef.current = mirror;
      stoppedRef.current = false;

      const drawFrame = () => {
        if (stoppedRef.current) return;
        const w = sourceCanvas.width || sourceCanvas.clientWidth;
        const h = sourceCanvas.height || sourceCanvas.clientHeight;
        if (w && h && (mirror.width !== w || mirror.height !== h)) {
          mirror.width = w;
          mirror.height = h;
        }
        try {
          mctx.drawImage(sourceCanvas, 0, 0, mirror.width, mirror.height);
          drawWatermark(mirror);
        } catch { /* frame skip */ }
        rafRef.current = requestAnimationFrame(drawFrame);
      };
      drawFrame();

      const stream = mirror.captureStream(60);
      const mime = pickMime();
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stoppedRef.current = true;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'satellite_imaging_simulation.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        mirrorRef.current = null;
      };
      streamRef.current = stream;
      recorderRef.current = rec;
      rec.start(100);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording failed to start:', err);
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    setIsRecording(false);
  }, []);

  const cancel = useCallback(() => {
    stoppedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try { rec.stop(); } catch { /* noop */ }
    }
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    mirrorRef.current = null;
    setIsRecording(false);
  }, []);

  return { isRecording, start, stop, cancel };
}
