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
import {
  paletteFor,
  terrainAt,
  type ScanChannel,
  type ScanMode,
} from '@/utils/scanPalettes';

interface TaskingPanelProps {
  onClose: () => void;
  mode: ScanMode;
  channel: ScanChannel;
  onModeChange: (m: ScanMode) => void;
  onChannelChange: (c: ScanChannel) => void;
  isRecording: boolean;
  onToggleRecord: () => void;
  warp: number;
  onWarpChange: (w: number) => void;
}

const WARP_SPEEDS = [1, 5, 20];

const MODES: { id: ScanMode; label: string }[] = [
  { id: 'pushbroom', label: 'Pushbroom' },
  { id: 'whiskbroom', label: 'Whiskbroom' },
  { id: 'frame', label: 'Frame' },
];

const CANVAS_W = 520;
const CANVAS_H = 300;
const GROUND_TOP = 90;
const SAT_Y = 50;

export default function TaskingPanel({
  onClose,
  mode,
  channel,
  onModeChange,
  onChannelChange,
  isRecording,
  onToggleRecord,
  warp,
  onWarpChange,
}: TaskingPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const capturedRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const scrollRef = useRef(0);
  const startTimeRef = useRef<number>(performance.now());

  const modeRef = useRef(mode);
  const channelRef = useRef(channel);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { channelRef.current = channel; }, [channel]);

  // init captured layer (persists across mode changes but is cleared when mode/channel changes)
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = CANVAS_W;
    c.height = CANVAS_H - GROUND_TOP;
    capturedRef.current = c;
    return () => { capturedRef.current = null; };
  }, []);

  useEffect(() => {
    const cap = capturedRef.current;
    if (!cap) return;
    const ctx = cap.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, cap.width, cap.height);
  }, [mode, channel]);

  // Only run the mini-canvas rAF loop when the panel is expanded (visible)
  useEffect(() => {
    if (isRecording) return; // canvas is hidden while recording; skip animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      scrollRef.current += dt * 55;
      const scroll = scrollRef.current;
      const m = modeRef.current;
      const ch = channelRef.current;
      const cap = capturedRef.current!;
      const capCtx = cap.getContext('2d')!;

      const shift = dt * 55;
      capCtx.globalCompositeOperation = 'copy';
      capCtx.drawImage(cap, -shift, 0);
      capCtx.globalCompositeOperation = 'source-over';
      capCtx.fillStyle = 'rgba(0,0,0,0.015)';
      capCtx.fillRect(0, 0, cap.width, cap.height);

      const satGroundX = CANVAS_W * 0.5;
      if (m === 'pushbroom') {
        for (let y = 0; y < cap.height; y++) {
          const worldX = satGroundX + scroll;
          const t = terrainAt(worldX, y);
          const [r, g, b] = paletteFor(ch, t);
          capCtx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
          capCtx.fillRect(satGroundX, y, 2, 1);
        }
      } else if (m === 'whiskbroom') {
        const sweep = (Math.sin(now * 0.006) + 1) / 2;
        const beamX = 40 + sweep * (CANVAS_W - 80);
        const tileW = 6, tileH = 4;
        for (let dy = 0; dy < cap.height; dy += tileH) {
          if (Math.random() > 0.35) continue;
          const worldX = beamX + scroll;
          const t = terrainAt(worldX, dy);
          const [r, g, b] = paletteFor(ch, t);
          capCtx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
          capCtx.fillRect(beamX - tileW / 2, dy, tileW, tileH);
        }
      } else {
        const phase = (now - startTimeRef.current) % 1200;
        if (phase < 90) {
          const fw = 180, fh = cap.height - 20;
          const fx = satGroundX - fw / 2;
          const fy = 10;
          for (let yy = 0; yy < fh; yy += 2) {
            for (let xx = 0; xx < fw; xx += 2) {
              const worldX = fx + xx + scroll;
              const t = terrainAt(worldX, fy + yy);
              const [r, g, b] = paletteFor(ch, t);
              capCtx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
              capCtx.fillRect(fx + xx, fy + yy, 2, 2);
            }
          }
        }
      }

      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, '#070912');
      bg.addColorStop(1, '#0b1224');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + (scroll * 0.2)) % CANVAS_W;
        const sy = (i * 31) % GROUND_TOP;
        ctx.fillRect(sx, sy, 1, 1);
      }

      const baseImg = ctx.createLinearGradient(0, GROUND_TOP, 0, CANVAS_H);
      baseImg.addColorStop(0, '#12203a');
      baseImg.addColorStop(1, '#0a1428');
      ctx.fillStyle = baseImg;
      ctx.fillRect(0, GROUND_TOP, CANVAS_W, CANVAS_H - GROUND_TOP);

      ctx.drawImage(cap, 0, GROUND_TOP);

      ctx.strokeStyle = 'rgba(120,180,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_TOP);
      ctx.lineTo(CANVAS_W, GROUND_TOP);
      ctx.stroke();

      const satX = satGroundX;
      ctx.fillStyle = '#d6d9e0';
      ctx.fillRect(satX - 10, SAT_Y - 5, 20, 10);
      ctx.fillStyle = '#2b4bb0';
      ctx.fillRect(satX - 28, SAT_Y - 2, 16, 4);
      ctx.fillRect(satX + 12, SAT_Y - 2, 16, 4);

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
        ctx.fillStyle = 'rgba(200,170,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(beamX, CANVAS_H - 6, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const fw = 180, fh = CANVAS_H - GROUND_TOP - 20;
        const fx = satX - fw / 2;
        const fy = GROUND_TOP + 10;
        ctx.strokeStyle = 'rgba(120,220,255,0.7)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(fx, fy, fw, fh);
        ctx.beginPath();
        ctx.moveTo(satX, SAT_Y + 5); ctx.lineTo(fx, fy);
        ctx.moveTo(satX, SAT_Y + 5); ctx.lineTo(fx + fw, fy);
        ctx.moveTo(satX, SAT_Y + 5); ctx.lineTo(fx, fy + fh);
        ctx.moveTo(satX, SAT_Y + 5); ctx.lineTo(fx + fw, fy + fh);
        ctx.stroke();
        ctx.setLineDash([]);
        const phase = (now - startTimeRef.current) % 1200;
        if (phase < 90) {
          ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - phase / 90)})`;
          ctx.fillRect(fx, fy, fw, fh);
        }
      }
      ctx.restore();

      ctx.fillStyle = 'rgba(220,230,255,0.85)';
      ctx.font = '11px ui-sans-serif, system-ui, -apple-system';
      ctx.fillText(`Mode: ${m.toUpperCase()}   Channel: ${ch}`, 10, 16);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRecording]);

  // Warp speed pill (shared)
  const WarpPills = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center gap-1 ${compact ? '' : 'mt-2'}`}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Warp</span>
      {WARP_SPEEDS.map((w) => (
        <button
          key={w}
          onClick={() => onWarpChange(w)}
          className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors ${
            warp === w
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/60 text-foreground/80 hover:bg-secondary'
          }`}
        >
          {w}x
        </button>
      ))}
    </div>
  );

  // Minimized (recording) mode: only Stop button + warp visible
  if (isRecording) {
    return (
      <div className="absolute left-4 bottom-4 z-30 glassmorphism rounded-full pl-3 pr-1 py-1 shadow-2xl border border-destructive/60 animate-fade-in flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
        </span>
        <span className="text-[11px] text-foreground/90 font-medium tracking-wide">
          REC · {mode.toUpperCase()} · {channel}
        </span>
        <WarpPills compact />
        <Button
          size="sm"
          variant="destructive"
          className="h-7 px-2 text-[11px] rounded-full"
          onClick={onToggleRecord}
        >
          <Square className="h-3 w-3 mr-1" /> Stop &amp; Save
        </Button>
      </div>
    );
  }


  return (
    <div
      className="absolute left-4 bottom-4 z-20 glassmorphism rounded-lg p-3 shadow-2xl border border-primary/30 animate-fade-in"
      style={{ width: CANVAS_W + 24 }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
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
          <Select value={channel} onValueChange={(v) => onChannelChange(v as ScanChannel)}>
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
            variant="default"
            className="h-7 px-2 text-[11px]"
            onClick={onToggleRecord}
          >
            <Circle className="h-3 w-3 mr-1 fill-current" /> Record
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
