import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Circle, Square, X } from 'lucide-react';
import { useTaskingRecorder } from '@/hooks/useTaskingRecorder';
import {
  paletteFor,
  terrainAt,
  type ScanChannel,
  type ScanMode,
} from '@/utils/scanPalettes';
import { drawWatermark } from '@/utils/watermark';

interface TaskingPanelProps {
  onClose: () => void;
}

const MODES: { id: ScanMode; label: string }[] = [
  { id: 'pushbroom', label: 'Pushbroom' },
  { id: 'whiskbroom', label: 'Whiskbroom' },
  { id: 'frame', label: 'Frame' },
];

const CANVAS_W = 520;
const CANVAS_H = 300;
const GROUND_TOP = 90; // y where terrain begins
const SAT_Y = 50;

export default function TaskingPanel({ onClose }: TaskingPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const capturedRef = useRef<HTMLCanvasElement | null>(null); // persistent captured pixels
  const rafRef = useRef<number | null>(null);
  const scrollRef = useRef(0); // ground scroll offset in "world" px
  const startTimeRef = useRef<number>(performance.now());

  const [mode, setMode] = useState<ScanMode>('pushbroom');
  const [channel, setChannel] = useState<ScanChannel>('RGB');
  const modeRef = useRef(mode);
  const channelRef = useRef(channel);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { channelRef.current = channel; }, [channel]);

  const { isRecording, start, stop, cancel } = useTaskingRecorder();

  // init captured layer
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = CANVAS_W;
    c.height = CANVAS_H - GROUND_TOP;
    capturedRef.current = c;
    return () => { capturedRef.current = null; };
  }, []);

  // reset captured layer when mode/channel changes so transitions feel deliberate
  useEffect(() => {
    const cap = capturedRef.current;
    if (!cap) return;
    const ctx = cap.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, cap.width, cap.height);
  }, [mode, channel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      scrollRef.current += dt * 55; // world px per second (satellite forward motion)
      const scroll = scrollRef.current;
      const m = modeRef.current;
      const ch = channelRef.current;
      const cap = capturedRef.current!;
      const capCtx = cap.getContext('2d')!;

      // --- Accumulate captured pixels for the current frame ---
      // The captured layer scrolls with the ground: shift it left by dt*55 px each frame.
      const shift = dt * 55;
      // Cheap scroll: copy image data over itself shifted left
      capCtx.globalCompositeOperation = 'copy';
      capCtx.drawImage(cap, -shift, 0);
      capCtx.globalCompositeOperation = 'source-over';
      // Fade the trailing edge slightly so old scans dim over time
      capCtx.fillStyle = 'rgba(0,0,0,0.015)';
      capCtx.fillRect(0, 0, cap.width, cap.height);

      // Where does the satellite project onto the ground (x on the ground canvas)?
      const satGroundX = CANVAS_W * 0.5;

      if (m === 'pushbroom') {
        // Capture a 1-px wide vertical strip at satGroundX across full ground height,
        // colored by terrain sampled with current scroll.
        for (let y = 0; y < cap.height; y++) {
          const worldX = satGroundX + scroll;
          const worldY = y;
          const t = terrainAt(worldX, worldY);
          const [r, g, b] = paletteFor(ch, t);
          capCtx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
          capCtx.fillRect(satGroundX, y, 2, 1);
        }
      } else if (m === 'whiskbroom') {
        // Sweep across-track at ~2 Hz, capturing small tiles as the sat advances.
        const sweep = (Math.sin(now * 0.006) + 1) / 2; // 0..1
        const beamX = 40 + sweep * (CANVAS_W - 80);
        const tileW = 6, tileH = 4;
        for (let dy = 0; dy < cap.height; dy += tileH) {
          if (Math.random() > 0.35) continue; // sparse to feel raster-like
          const worldX = beamX + scroll;
          const worldY = dy;
          const t = terrainAt(worldX, worldY);
          const [r, g, b] = paletteFor(ch, t);
          capCtx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
          capCtx.fillRect(beamX - tileW / 2, dy, tileW, tileH);
        }
      } else {
        // frame: periodic shutter fills a rectangle centered under the satellite
        const period = 1200; // ms
        const phase = (now - startTimeRef.current) % period;
        if (phase < 90) {
          const fw = 180, fh = cap.height - 20;
          const fx = satGroundX - fw / 2;
          const fy = 10;
          for (let yy = 0; yy < fh; yy += 2) {
            for (let xx = 0; xx < fw; xx += 2) {
              const worldX = fx + xx + scroll;
              const worldY = fy + yy;
              const t = terrainAt(worldX, worldY);
              const [r, g, b] = paletteFor(ch, t);
              capCtx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
              capCtx.fillRect(fx + xx, fy + yy, 2, 2);
            }
          }
        }
      }

      // --- Render compose to main canvas ---
      // background: deep space gradient
      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, '#070912');
      bg.addColorStop(1, '#0b1224');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // stars
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + (scroll * 0.2)) % CANVAS_W;
        const sy = (i * 31) % GROUND_TOP;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // faint base terrain preview under the captured layer (so unscanned areas are visible)
      const baseImg = ctx.createLinearGradient(0, GROUND_TOP, 0, CANVAS_H);
      baseImg.addColorStop(0, '#12203a');
      baseImg.addColorStop(1, '#0a1428');
      ctx.fillStyle = baseImg;
      ctx.fillRect(0, GROUND_TOP, CANVAS_W, CANVAS_H - GROUND_TOP);

      // draw captured layer
      ctx.drawImage(cap, 0, GROUND_TOP);

      // horizon line
      ctx.strokeStyle = 'rgba(120,180,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_TOP);
      ctx.lineTo(CANVAS_W, GROUND_TOP);
      ctx.stroke();

      // satellite body
      const satX = satGroundX;
      ctx.fillStyle = '#d6d9e0';
      ctx.fillRect(satX - 10, SAT_Y - 5, 20, 10);
      // solar panels
      ctx.fillStyle = '#2b4bb0';
      ctx.fillRect(satX - 28, SAT_Y - 2, 16, 4);
      ctx.fillRect(satX + 12, SAT_Y - 2, 16, 4);

      // scan beam overlay
      ctx.save();
      if (m === 'pushbroom') {
        const grad = ctx.createLinearGradient(satX, SAT_Y, satX, CANVAS_H);
        grad.addColorStop(0, 'rgba(120,220,255,0.7)');
        grad.addColorStop(1, 'rgba(120,220,255,0.05)');
        ctx.fillStyle = grad;
        ctx.fillRect(satX - 1.5, SAT_Y + 5, 3, CANVAS_H - SAT_Y - 5);
      } else if (m === 'whiskbroom') {
        const sweep = (Math.sin(now * 0.006) + 1) / 2;
        const beamX = 40 + sweep * (CANVAS_W - 80);
        ctx.strokeStyle = 'rgba(180,140,255,0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(satX, SAT_Y + 5);
        ctx.lineTo(beamX, CANVAS_H - 2);
        ctx.stroke();
        // spotlight ellipse
        ctx.fillStyle = 'rgba(200,170,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(beamX, CANVAS_H - 6, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const fw = 180, fh = CANVAS_H - GROUND_TOP - 20;
        const fx = satX - fw / 2;
        const fy = GROUND_TOP + 10;
        // pyramid outline
        ctx.strokeStyle = 'rgba(120,220,255,0.7)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(fx, fy, fw, fh);
        ctx.beginPath();
        ctx.moveTo(satX, SAT_Y + 5);
        ctx.lineTo(fx, fy);
        ctx.moveTo(satX, SAT_Y + 5);
        ctx.lineTo(fx + fw, fy);
        ctx.moveTo(satX, SAT_Y + 5);
        ctx.lineTo(fx, fy + fh);
        ctx.moveTo(satX, SAT_Y + 5);
        ctx.lineTo(fx + fw, fy + fh);
        ctx.stroke();
        ctx.setLineDash([]);
        // shutter flash
        const phase = (now - startTimeRef.current) % 1200;
        if (phase < 90) {
          ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - phase / 90)})`;
          ctx.fillRect(fx, fy, fw, fh);
        }
      }
      ctx.restore();

      // HUD text
      ctx.fillStyle = 'rgba(220,230,255,0.85)';
      ctx.font = '11px ui-sans-serif, system-ui, -apple-system';
      ctx.fillText(`Mode: ${m.toUpperCase()}   Channel: ${ch}`, 10, 16);
      if (isRecording) {
        ctx.fillStyle = '#ff5566';
        ctx.beginPath();
        ctx.arc(CANVAS_W - 18, 14, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(220,230,255,0.85)';
        ctx.fillText('REC', CANVAS_W - 44, 18);
      }

      // burn-in watermark for shareability
      drawWatermark(canvas, 'opticalsatellitetools.space');

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => () => cancel(), [cancel]);

  const toggleRecord = () => {
    if (isRecording) {
      stop();
    } else if (canvasRef.current) {
      start(canvasRef.current);
    }
  };

  return (
    <div className="absolute left-4 bottom-4 z-20 glassmorphism rounded-lg p-3 shadow-2xl border border-primary/30 animate-fade-in"
         style={{ width: CANVAS_W + 24 }}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                mode === m.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-foreground/80 hover:bg-secondary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Select value={channel} onValueChange={(v) => setChannel(v as ScanChannel)}>
            <SelectTrigger className="h-7 w-[92px] text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RGB">RGB</SelectItem>
              <SelectItem value="NIR">NIR</SelectItem>
              <SelectItem value="SWIR">SWIR</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={isRecording ? 'destructive' : 'default'}
            className="h-7 px-2 text-[11px]"
            onClick={toggleRecord}
          >
            {isRecording ? (
              <><Square className="h-3 w-3 mr-1" /> Stop &amp; Save</>
            ) : (
              <><Circle className="h-3 w-3 mr-1 fill-current" /> Record</>
            )}
          </Button>
          <button
            onClick={onClose}
            aria-label="Close tasking panel"
            className="h-7 w-7 rounded-md bg-secondary/60 hover:bg-secondary flex items-center justify-center text-foreground/80"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-md w-full block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
