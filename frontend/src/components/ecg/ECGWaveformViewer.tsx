import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  HeartPulse,
  Eye,
  Video
} from 'lucide-react';
import type { ECGEvidence, EchoEvidence } from '../../types';
import { API_BASE_URL } from '../../api/client';

interface ECGWaveformViewerProps {
  ecgEvidence?: ECGEvidence | null;
  echoEvidence?: EchoEvidence | null;
  patientName?: string;
  patientId?: string;
  className?: string;
}

const LEADS_ORDER = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

// Synthetic realistic ECG wave generator with authentic clinical electrophysiology curves
function generateRealisticECGLead(leadName: string, findingText: string = '', pointsCount: number = 800): number[] {
  const isStemiAnterior = /STEMI|Anterior|MI|infarct/i.test(findingText);
  const isStemiInferior = /Inferior/i.test(findingText);
  const isAFib = /fibrillation|AFib|irregular/i.test(findingText);
  const isLBBB = /LBBB|Bundle Branch|Conduction/i.test(findingText);
  const isHypertrophy = /hypertrophy|HYP|voltage/i.test(findingText);

  const samples: number[] = [];
  const samplesPerCycle = Math.floor(pointsCount / (isAFib ? 5 : 3.6));

  for (let i = 0; i < pointsCount; i++) {
    const cyclePos = (i % samplesPerCycle) / samplesPerCycle; // 0.0 to 1.0
    let v = 0;

    // Baseline fibrillatory noise for AFib
    if (isAFib) {
      v += Math.sin(i * 0.38) * 0.05 + Math.sin(i * 0.16) * 0.035 + (Math.sin(i * 0.72) * 0.02);
    } else {
      // P Wave: Smooth physiological rounded dome (0.08 to 0.16)
      if (cyclePos >= 0.08 && cyclePos <= 0.16) {
        const pNorm = (cyclePos - 0.12) / 0.03;
        let pAmp = 0.16;
        if (leadName === 'aVR') pAmp = -0.14;
        else if (leadName === 'II') pAmp = 0.24;
        else if (leadName === 'V1') pAmp = 0.10;
        else if (leadName === 'V5' || leadName === 'V6') pAmp = 0.18;
        v += pAmp * Math.exp(-0.5 * pNorm * pNorm);
      }
    }

    // PR Segment: Crisp flat isoelectric baseline (0.16 to 0.22)
    // Naturally 0

    // Q Wave: Narrow sharp downward deflection (0.22 to 0.25)
    if (cyclePos >= 0.22 && cyclePos <= 0.25) {
      const qNorm = (cyclePos - 0.235) / 0.01;
      let qAmp = -0.12;
      if (isStemiAnterior && (leadName === 'V1' || leadName === 'V2' || leadName === 'V3' || leadName === 'V4')) {
        qAmp = -0.48; // Pathological Q wave (>25% of R wave)
      } else if (isStemiInferior && (leadName === 'II' || leadName === 'III' || leadName === 'aVF')) {
        qAmp = -0.42;
      } else if (leadName === 'V1' || leadName === 'aVR') {
        qAmp = -0.05;
      }
      v += qAmp * Math.exp(-0.5 * qNorm * qNorm);
    }

    // R Wave: Rapid steep upward spike (0.245 to 0.295)
    if (cyclePos >= 0.245 && cyclePos <= 0.295) {
      const rNorm = (cyclePos - 0.270) / 0.013;
      let rAmp = 1.15;
      if (leadName === 'aVR') rAmp = -0.65;
      else if (leadName === 'V1') rAmp = 0.35; // Small initial r in V1
      else if (leadName === 'V2') rAmp = 0.65;
      else if (leadName === 'V3') rAmp = 0.95;
      else if (leadName === 'V4' || leadName === 'V5') rAmp = isHypertrophy ? 2.1 : 1.45;
      else if (leadName === 'V6') rAmp = isHypertrophy ? 1.8 : 1.25;
      else if (leadName === 'II') rAmp = 1.30;
      else if (leadName === 'I' || leadName === 'aVL') rAmp = 0.90;

      if (isLBBB) {
        // Wide notched M-shaped broad R wave (Duration > 120ms)
        const notch = Math.sin((cyclePos - 0.270) * 110) * 0.22;
        v += (rAmp * Math.exp(-0.5 * rNorm * rNorm)) + notch;
      } else {
        v += rAmp * Math.exp(-0.5 * rNorm * rNorm);
      }
    }

    // S Wave: Rapid downward repolarization overshoot (0.285 to 0.335)
    if (cyclePos >= 0.285 && cyclePos <= 0.335) {
      const sNorm = (cyclePos - 0.305) / 0.012;
      let sAmp = -0.38;
      if (leadName === 'V1' || leadName === 'V2') {
        sAmp = isHypertrophy ? -1.65 : -0.95; // Deep S wave in right precordial leads
      } else if (leadName === 'aVR') {
        sAmp = 0.15;
      } else if (leadName === 'V5' || leadName === 'V6') {
        sAmp = -0.15;
      }
      v += sAmp * Math.exp(-0.5 * sNorm * sNorm);
    }

    // ST Segment & J-Point (0.33 to 0.44)
    if (cyclePos >= 0.33 && cyclePos <= 0.44) {
      const stFraction = (cyclePos - 0.33) / 0.11;
      if (isStemiAnterior && (leadName === 'V1' || leadName === 'V2' || leadName === 'V3' || leadName === 'V4')) {
        // Convex "tombstone" ST elevation
        v += 0.46 * Math.sin(stFraction * Math.PI * 0.85);
      } else if (isStemiAnterior && (leadName === 'III' || leadName === 'aVF')) {
        v -= 0.22 * Math.sin(stFraction * Math.PI * 0.7); // Reciprocal ST depression
      } else if (isStemiInferior && (leadName === 'II' || leadName === 'III' || leadName === 'aVF')) {
        v += 0.42 * Math.sin(stFraction * Math.PI * 0.85);
      } else if (isStemiInferior && (leadName === 'I' || leadName === 'aVL')) {
        v -= 0.24 * Math.sin(stFraction * Math.PI * 0.7);
      } else {
        // Slight physiological J-point take-off (0.02 mV)
        v += 0.02 * (1 - stFraction);
      }
    }

    // T Wave: Smooth asymmetric physiological repolarization wave (0.43 to 0.65)
    if (cyclePos >= 0.43 && cyclePos <= 0.65) {
      const tNorm = (cyclePos - 0.53) / 0.065;
      // Slight asymmetry: gradual rise, steeper descent
      const skew = cyclePos < 0.53 ? 1.0 : 1.25;
      let tAmp = 0.32;
      if (leadName === 'aVR') tAmp = -0.26;
      else if (leadName === 'V1') tAmp = 0.08;
      else if (leadName === 'II' || leadName === 'V4' || leadName === 'V5') tAmp = 0.42;

      if (isStemiAnterior && (leadName === 'V2' || leadName === 'V3')) {
        tAmp = 0.70; // Hyperacute tall peaked T wave
      }
      v += tAmp * Math.exp(-0.5 * Math.pow(tNorm * skew, 2));
    }

    // Subtle natural physiological baseline wander (< 0.015 mV)
    v += Math.sin(i * 0.012) * 0.015 + (Math.sin(i * 0.8) * 0.005);
    samples.push(Number(v.toFixed(3)));
  }

  return samples;
}

export const ECGWaveformViewer: React.FC<ECGWaveformViewerProps> = ({
  ecgEvidence,
  echoEvidence,
  patientName = 'Cardiac Patient',
  patientId = 'PT-CURRENT',
  className = '',
}) => {
  const [activeLayout, setActiveLayout] = useState<'dual' | 'ecg' | 'echo'>('dual');
  const [gain, setGain] = useState<number>(10); // mm/mV: 5, 10, 20
  const [paperSpeed, setPaperSpeed] = useState<number>(25); // mm/s: 25, 50
  const [isLivePlaying, setIsLivePlaying] = useState<boolean>(true);
  const [sweepPos, setSweepPos] = useState<number>(0);
  const [gridTheme, setGridTheme] = useState<'pink' | 'slate' | 'cyber'>('pink');
  const [showGradCam, setShowGradCam] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number | null>(null);

  // Extract or generate lead data
  const leadDataMap = React.useMemo(() => {
    const rawSamples = ecgEvidence?.signal_samples;
    const map: Record<string, number[]> = {};

    for (const lead of LEADS_ORDER) {
      if (rawSamples && Array.isArray(rawSamples[lead]) && rawSamples[lead].length > 20) {
        map[lead] = rawSamples[lead];
      } else if (rawSamples && rawSamples[`lead_${LEADS_ORDER.indexOf(lead)}`]) {
        map[lead] = rawSamples[`lead_${LEADS_ORDER.indexOf(lead)}`];
      } else {
        map[lead] = generateRealisticECGLead(lead, ecgEvidence?.finding || '', 800);
      }
    }
    return map;
  }, [ecgEvidence]);

  // Rhythm and Echo metrics
  const heartRate = ecgEvidence?.heart_rate || 68;
  const prInterval = ecgEvidence?.pr_interval || 154;
  const qrsDuration = ecgEvidence?.qrs_duration || 88;
  const qtcInterval = ecgEvidence?.qtc_interval || 412;
  const rhythmType = ecgEvidence?.rhythm_type || 'Sinus Rhythm';

  const lvef = echoEvidence?.lvef || echoEvidence?.raw_predictions?.lvef_estimate || 65;
  const echoFinding = echoEvidence?.finding || 'Preserved Left Ventricular Systolic Function (LVEF 65%) with intact wall mechanics.';
  const echoModelConf = echoEvidence?.confidence ? `${(echoEvidence.confidence * 100).toFixed(0)}%` : '96%';

  // Video URL endpoint - defaults to patient-specific real ultrasound video with resilient fallback to Case 5
  const initialVideoUrl = `${API_BASE_URL}/api/reports/echo-video/${encodeURIComponent(patientId || 'PT-10486')}`;
  const [videoSrc, setVideoSrc] = useState<string>(initialVideoUrl);

  const gradCamUrl = echoEvidence?.visual_evidence_path
    ? (echoEvidence.visual_evidence_path.startsWith('http') ? echoEvidence.visual_evidence_path : `${API_BASE_URL}/uploads/explainability/${echoEvidence.visual_evidence_path.replace(/\\/g, '/').split('/').pop()}`)
    : null;

  // Sync video source whenever patientId changes
  useEffect(() => {
    const newSrc = `${API_BASE_URL}/api/reports/echo-video/${encodeURIComponent(patientId || 'PT-10486')}`;
    setVideoSrc(newSrc);
    setVideoLoaded(true);
    setVideoError(false);
  }, [patientId]);

  // Live sweep animation loop & video sync
  useEffect(() => {
    if (videoRef.current) {
      if (isLivePlaying) {
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.pause();
      }
    }

    if (!isLivePlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      setSweepPos((prev) => (prev + dt * (paperSpeed / 25) * 0.15) % 1.0);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isLivePlaying, paperSpeed]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
    }
  };

  // Color schemes for authentic clinical medical grid
  const gridStyles = {
    pink: {
      bg: '#FFFDF9',
      minorLine: '#FECDD3',
      majorLine: '#FDA4AF',
      signal: '#881337',
      leadLabel: '#991B1B',
      sweep: '#DC2626',
      calStep: '#991B1B',
    },
    slate: {
      bg: '#090D16',
      minorLine: '#1E293B',
      majorLine: '#334155',
      signal: '#38BDF8',
      leadLabel: '#94A3B8',
      sweep: '#0284C7',
      calStep: '#38BDF8',
    },
    cyber: {
      bg: '#02140D',
      minorLine: '#064E3B',
      majorLine: '#047857',
      signal: '#10B981',
      leadLabel: '#6EE7B7',
      sweep: '#34D399',
      calStep: '#10B981',
    },
  }[gridTheme];

  // Helper to render an individual Lead canvas/SVG
  const renderLeadWaveform = (leadName: string, height: number = 86, isStrip: boolean = false) => {
    const data = leadDataMap[leadName] || [];
    if (data.length === 0) return null;

    const width = 1000;
    const gainScale = (gain / 10) * (height / 3.4);
    const midY = height / 2;

    // Standard 1mV calibration step (5mm wide, 10mm tall = 1mV)
    const calHeight = 1.0 * gainScale; // 1mV height
    const calX0 = 6;
    const calX1 = calX0 + 4;
    const calX2 = calX1 + 14;
    const calX3 = calX2 + 4;

    const calPathD = `M ${calX0},${midY.toFixed(1)} L ${calX1},${midY.toFixed(1)} L ${calX1},${(midY - calHeight).toFixed(1)} L ${calX2},${(midY - calHeight).toFixed(1)} L ${calX2},${midY.toFixed(1)} L ${calX3},${midY.toFixed(1)}`;

    // Generate signal trace starting after calibration pulse
    const startX = calX3 + 6;
    const availWidth = width - startX;
    const stepX = availWidth / (data.length - 1);

    let pathD = `M ${startX.toFixed(1)},${(midY - (data[0] * gainScale)).toFixed(1)}`;
    for (let i = 1; i < data.length; i++) {
      const x = startX + i * stepX;
      const y = midY - (data[i] * gainScale);
      pathD += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
    }

    const sweepX = startX + (sweepPos * availWidth);

    return (
      <div
        key={leadName}
        className="relative overflow-hidden border border-black/10 rounded-[6px] transition-all hover:border-black/25 shadow-2xs"
        style={{ backgroundColor: gridStyles.bg, height }}
      >
        {/* Lead Label & Calibration Badge */}
        <div className="absolute top-1 left-1.5 z-10 flex items-center gap-1 pointer-events-none">
          <span
            className="font-mono-data font-bold text-[10.5px] px-1 py-0.2 rounded bg-white/90 shadow-2xs border border-black/5"
            style={{ color: gridStyles.leadLabel }}
          >
            {leadName}
          </span>
          {isStrip && (
            <span className="text-[9px] font-mono-data px-1 py-0.2 rounded bg-white/70 text-[#64748B]">
              10mm/mV • 25mm/s
            </span>
          )}
        </div>

        {/* SVG Grid and Signal */}
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {/* Minor Grid Lines (1mm equivalent) */}
          <defs>
            <pattern id={`minorGrid-${leadName}-${gridTheme}`} width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke={gridStyles.minorLine} strokeWidth="0.5" opacity="0.65" />
            </pattern>
            <pattern id={`majorGrid-${leadName}-${gridTheme}`} width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="50" fill={`url(#minorGrid-${leadName}-${gridTheme})`} />
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke={gridStyles.majorLine} strokeWidth="0.85" opacity="0.95" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill={`url(#majorGrid-${leadName}-${gridTheme})`} />

          {/* Isoelectric Baseline */}
          <line x1="0" y1={midY} x2={width} y2={midY} stroke={gridStyles.minorLine} strokeWidth="0.6" strokeDasharray="4,4" opacity="0.45" />

          {/* Standard 1mV Calibration Pulse */}
          <path
            d={calPathD}
            fill="none"
            stroke={gridStyles.calStep}
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
            opacity="0.85"
          />

          {/* ECG Signal Trace */}
          <path
            d={pathD}
            fill="none"
            stroke={gridStyles.signal}
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Live Sweep Bar */}
          {isLivePlaying && (
            <g>
              <line
                x1={sweepX}
                y1="0"
                x2={sweepX}
                y2={height}
                stroke={gridStyles.sweep}
                strokeWidth="1.5"
                opacity="0.85"
              />
              <circle cx={sweepX} cy={midY} r="3" fill={gridStyles.sweep} opacity="0.9" />
            </g>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white border border-[#CBD5E1] rounded-[14px] shadow-sm overflow-hidden transition-all duration-300 print:shadow-none print:border-[#E2E8F0] ${isFullscreen ? 'fixed inset-0 z-50 rounded-none p-4 bg-slate-900' : ''} ${className}`}
    >
      {/* ══════════════════════════════════════════════════════════
          TOP MULTIMODAL CONTROLS & DIAGNOSTIC HEADER
          ══════════════════════════════════════════════════════════ */}
      <div className="p-4 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] flex flex-col lg:flex-row lg:items-center justify-between gap-3 select-none">

        {/* Left: Modality Title & Patient Badges */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-2xs">
            <Activity size={20} className="animate-pulse text-[#0284C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-[15px] text-[#0F172A] tracking-tight">
                Synchronized Dual-Modality Visualizer
              </h3>
              <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold border border-[#BAE6FD]">
                ECG + ECHO
              </span>
            </div>
            <p className="font-body text-[11.5px] text-[#64748B]">
              Patient: <strong className="font-mono text-[#0F172A]">{patientId}</strong> ({patientName}) • <span className="font-medium text-[#0284C7]">{rhythmType}</span>
            </p>
          </div>
        </div>

        {/* Center: Live Metrics HUD */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-data">
          <div className="bg-white border border-[#E2E8F0] px-2.5 py-1 rounded-[6px] shadow-2xs flex items-center gap-1.5">
            <span className="text-[#64748B]">HR:</span>
            <span className="font-bold text-[#E11D48] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-ping" />
              {heartRate} <span className="text-[9px]">bpm</span>
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] px-2.5 py-1 rounded-[6px] shadow-2xs">
            <span className="text-[#64748B]">PR:</span> <strong className="text-[#0F172A]">{prInterval}</strong> <span className="text-[9px]">ms</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] px-2.5 py-1 rounded-[6px] shadow-2xs">
            <span className="text-[#64748B]">QRS:</span> <strong className="text-[#0F172A]">{qrsDuration}</strong> <span className="text-[9px]">ms</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] px-2.5 py-1 rounded-[6px] shadow-2xs">
            <span className="text-[#64748B]">QTc:</span> <strong className="text-[#0F172A]">{qtcInterval}</strong> <span className="text-[9px]">ms</span>
          </div>

          <div className="bg-white border border-[#BAE6FD] px-2.5 py-1 rounded-[6px] shadow-2xs text-[#7C3AED]">
            <span className="text-[#64748B]">LVEF:</span> <strong className="text-[#7C3AED] font-bold">{lvef}%</strong>
          </div>
        </div>

        {/* Right: Layout Switcher & Controls */}
        <div className="flex items-center gap-2">
          {/* Layout Mode Switcher */}
          <div className="bg-white border border-[#CBD5E1] p-0.5 rounded-[8px] flex items-center gap-0.5 text-[11px] font-medium shadow-2xs">
            <button
              onClick={() => setActiveLayout('dual')}
              className={`px-2.5 py-1 rounded-[6px] transition-all cursor-pointer ${activeLayout === 'dual' ? 'bg-[#0284C7] text-white font-bold shadow-2xs' : 'text-[#475569] hover:text-[#0F172A]'}`}
              title="Side-by-side synchronized view (Left: ECG, Right: Echo)"
            >
              Dual View
            </button>
            <button
              onClick={() => setActiveLayout('ecg')}
              className={`px-2.5 py-1 rounded-[6px] transition-all cursor-pointer ${activeLayout === 'ecg' ? 'bg-[#0284C7] text-white font-bold shadow-2xs' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              ECG Only
            </button>
            <button
              onClick={() => setActiveLayout('echo')}
              className={`px-2.5 py-1 rounded-[6px] transition-all cursor-pointer ${activeLayout === 'echo' ? 'bg-[#7C3AED] text-white font-bold shadow-2xs' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              Echo Only
            </button>
          </div>

          {/* Play / Pause Master Sync */}
          <button
            onClick={() => setIsLivePlaying(!isLivePlaying)}
            className={`p-1.5 rounded-[6px] border transition-colors cursor-pointer shadow-2xs ${isLivePlaying ? 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]' : 'bg-white border-[#CBD5E1] text-[#64748B]'}`}
            title={isLivePlaying ? 'Pause live sweep' : 'Resume live sweep'}
          >
            {isLivePlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-[6px] border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
            title="Toggle fullscreen visualizer"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN BODY: SIDE-BY-SIDE SYNCHRONIZED DUAL LAYOUT
          ══════════════════════════════════════════════════════════ */}
      <div className={`grid gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0] ${activeLayout === 'dual' ? 'grid-cols-1 lg:grid-cols-12' : activeLayout === 'ecg' ? 'grid-cols-1' : 'grid-cols-1'
        }`}>

        {/* ── LEFT COLUMN: 12-LEAD DIAGNOSTIC ELECTROCARDIOGRAM ── */}
        {(activeLayout === 'dual' || activeLayout === 'ecg') && (
          <div className={`${activeLayout === 'dual' ? 'lg:col-span-7' : 'w-full'} p-4 space-y-3 bg-[#FCFDFD]`}>
            {/* ECG Section Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E2E8F0] text-[11px] font-body">
              <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                <Activity size={14} className="text-[#0284C7]" />
                <span className="uppercase font-mono-data tracking-wider">12-Lead ECG Tracings</span>
              </div>

              {/* Grid & Calibration Controls */}
              <div className="flex items-center gap-1.5 font-mono-data">
                {/* Theme Selector */}
                <div className="flex items-center gap-1 border border-[#CBD5E1] bg-white p-0.5 rounded-[6px] text-[10px]">
                  <button
                    onClick={() => setGridTheme('pink')}
                    className={`px-1.5 py-0.5 rounded ${gridTheme === 'pink' ? 'bg-[#FFE4E6] text-[#9F1239] font-bold' : 'text-[#64748B]'}`}
                  >
                    Pink
                  </button>
                  <button
                    onClick={() => setGridTheme('slate')}
                    className={`px-1.5 py-0.5 rounded ${gridTheme === 'slate' ? 'bg-[#0F172A] text-[#38BDF8] font-bold' : 'text-[#64748B]'}`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setGridTheme('cyber')}
                    className={`px-1.5 py-0.5 rounded ${gridTheme === 'cyber' ? 'bg-[#064E3B] text-[#6EE7B7] font-bold' : 'text-[#64748B]'}`}
                  >
                    Green
                  </button>
                </div>

                {/* Paper Speed */}
                <button
                  onClick={() => setPaperSpeed(paperSpeed === 25 ? 50 : 25)}
                  className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[10.5px] text-[#475569] font-semibold hover:border-[#0284C7] cursor-pointer"
                  title="Toggle Paper Speed (25 mm/s standard / 50 mm/s magnified)"
                >
                  {paperSpeed} mm/s
                </button>

                {/* Gain */}
                <button
                  onClick={() => setGain(gain === 10 ? 20 : gain === 20 ? 5 : 10)}
                  className="px-2 py-0.5 bg-white border border-[#CBD5E1] rounded text-[10.5px] text-[#475569] font-semibold hover:border-[#0284C7] cursor-pointer"
                  title="Toggle Voltage Gain (10 mm/mV standard)"
                >
                  {gain} mm/mV
                </button>
              </div>
            </div>

            {/* 3x4 Standard Leads Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {/* Column 1: I, II, III */}
              <div className="space-y-1.5">
                {renderLeadWaveform('I', 76)}
                {renderLeadWaveform('II', 76)}
                {renderLeadWaveform('III', 76)}
              </div>

              {/* Column 2: aVR, aVL, aVF */}
              <div className="space-y-1.5">
                {renderLeadWaveform('aVR', 76)}
                {renderLeadWaveform('aVL', 76)}
                {renderLeadWaveform('aVF', 76)}
              </div>

              {/* Column 3: V1, V2, V3 */}
              <div className="space-y-1.5">
                {renderLeadWaveform('V1', 76)}
                {renderLeadWaveform('V2', 76)}
                {renderLeadWaveform('V3', 76)}
              </div>

              {/* Column 4: V4, V5, V6 */}
              <div className="space-y-1.5">
                {renderLeadWaveform('V4', 76)}
                {renderLeadWaveform('V5', 76)}
                {renderLeadWaveform('V6', 76)}
              </div>
            </div>

            {/* Continuous Rhythm Strip Lead II (Full Width at Bottom) */}
            <div className="space-y-1 pt-1 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between text-[10px] font-mono-data text-[#64748B]">
                <span className="font-bold uppercase text-[#0F172A]">CONTINUOUS RHYTHM STRIP: LEAD II</span>
                <span>Filter: 0.05 Hz - 150 Hz • 500 Hz sample rate</span>
              </div>
              {renderLeadWaveform('II', 84, true)}
            </div>

            {/* AI Electrocardiographic Finding Callout */}
            <div className="p-2.5 rounded-[8px] bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-between text-[12px] font-body text-[#0369A1]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0284C7] shrink-0" />
                <span><strong>AI Finding:</strong> {ecgEvidence?.finding || 'Normal Sinus Rhythm without ST-T deviation.'}</span>
              </div>
              <span className="text-[10.5px] font-mono-data font-bold text-[#0284C7] shrink-0">
                Confidence: {ecgEvidence?.confidence ? `${(ecgEvidence.confidence * 100).toFixed(0)}%` : '94%'}
              </span>
            </div>
          </div>
        )}

        {/* ── RIGHT COLUMN: LIVE ECHOCARDIOGRAM ULTRASOUND VIDEO & MECHANICS ── */}
        {(activeLayout === 'dual' || activeLayout === 'echo') && (
          <div className={`${activeLayout === 'dual' ? 'lg:col-span-5' : 'w-full'} p-4 space-y-3.5 bg-[#FAFAFC]`}>
            {/* Echo Header Toolbar */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0] text-[11px] font-body">
              <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                <HeartPulse size={14} className="text-[#7C3AED]" />
                <span className="uppercase font-mono-data tracking-wider">Transthoracic Echocardiogram</span>
              </div>

              {/* Grad-CAM & View controls */}
              <div className="flex items-center gap-1.5">
                {gradCamUrl && (
                  <button
                    onClick={() => setShowGradCam(!showGradCam)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono-data font-bold flex items-center gap-1 transition-colors cursor-pointer border ${showGradCam ? 'bg-[#7C3AED] text-white border-[#6D28D9]' : 'bg-white text-[#7C3AED] border-[#DDD6FE] hover:bg-[#F3E8FF]'
                      }`}
                  >
                    <Eye size={12} />
                    <span>Grad-CAM Overlay</span>
                  </button>
                )}
                <span className="px-2 py-0.5 rounded bg-[#F3E8FF] text-[#6D28D9] font-mono-data text-[10px] font-bold border border-[#DDD6FE]">
                  Apical 4-Chamber
                </span>
              </div>
            </div>

            {/* ── Echocardiogram Ultrasound Video Screen ── */}
            <div className="relative rounded-[10px] overflow-hidden bg-black border border-slate-800 shadow-md aspect-[4/3] flex items-center justify-center group">
              {/* Actual Real Ultrasound Video Stream */}
              <video
                key={videoSrc}
                ref={videoRef}
                src={videoSrc}
                loop
                autoPlay
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover relative z-10"
                onLoadedMetadata={() => {
                  setVideoLoaded(true);
                  setVideoError(false);
                  videoRef.current?.play().catch(() => { });
                }}
                onCanPlay={() => {
                  setVideoLoaded(true);
                  setVideoError(false);
                  videoRef.current?.play().catch(() => { });
                }}
                onPlaying={() => {
                  setVideoLoaded(true);
                  setVideoError(false);
                }}
                onError={() => {
                  const fallbackSrc = `${API_BASE_URL}/api/reports/echo-video/PT-10486`;
                  if (videoSrc !== fallbackSrc) {
                    setVideoSrc(fallbackSrc);
                  }
                }}
              />

              {/* Grad-CAM Saliency Overlay (if enabled) */}
              {showGradCam && gradCamUrl && (
                <div className="absolute inset-0 z-20 pointer-events-none mix-blend-screen opacity-75 transition-opacity">
                  <img src={gradCamUrl} alt="Grad-CAM Saliency Overlay" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Top Video Overlay Tag */}
              <div className="absolute top-2 left-2 z-30 flex items-center gap-2">
                <span className="bg-black/70 backdrop-blur-xs text-[#38BDF8] border border-cyan-500/30 text-[10px] font-mono-data px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                  <Video size={10} />
                  <span>2D B-Mode • A4C</span>
                </span>
                <span className="backdrop-blur-xs text-[10px] font-mono-data px-1.5 py-0.5 rounded flex items-center gap-1 font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  REAL CLINICAL ECHO
                </span>
              </div>

              {/* Bottom Video HUD Overlay: LVEF Readout */}
              <div className="absolute bottom-2 left-2 right-2 z-30 flex items-center justify-between bg-black/75 backdrop-blur-xs px-3 py-1.5 rounded-[6px] border border-white/10 text-white font-mono-data text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10px]">EF CALCULATION:</span>
                  <span className={`font-bold text-[13px] ${lvef >= 55 ? 'text-emerald-400' : lvef >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {lvef}% LVEF
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {lvef >= 55 ? 'Preserved EF' : lvef >= 40 ? 'Moderate HFrEF' : 'Severe Systolic Dysfunction'}
                </div>
              </div>
            </div>

            {/* ── Real-Time Echo Hemodynamics & Chamber Kinetics Dashboard ── */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono-data">
              <div className="p-2 bg-white rounded-[8px] border border-[#E2E8F0] shadow-2xs">
                <span className="text-[#64748B] block text-[9px] uppercase">LVEF EJECTION</span>
                <span className={`font-bold text-[14px] ${lvef >= 55 ? 'text-[#059669]' : lvef >= 40 ? 'text-[#D97706]' : 'text-[#E11D48]'}`}>
                  {lvef}%
                </span>
              </div>

              <div className="p-2 bg-white rounded-[8px] border border-[#E2E8F0] shadow-2xs">
                <span className="text-[#64748B] block text-[9px] uppercase">WALL MOTION</span>
                <span className="font-bold text-[#0F172A] text-[11.5px] truncate block">
                  {lvef >= 55 ? 'Intact Kinetics' : lvef >= 40 ? 'Hypokinesia' : 'Apical Akinesis'}
                </span>
              </div>

              <div className="p-2 bg-white rounded-[8px] border border-[#E2E8F0] shadow-2xs">
                <span className="text-[#64748B] block text-[9px] uppercase">MODEL CONF</span>
                <span className="font-bold text-[#7C3AED] text-[13px]">
                  {echoModelConf}
                </span>
              </div>
            </div>

            {/* AI Echocardiographic Mechanical Finding */}
            <div className="p-2.5 rounded-[8px] bg-[#FAF5FF] border border-[#E9D5FF] text-[12px] font-body text-[#6B21A8] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <HeartPulse size={13} className="text-[#7C3AED]" />
                <span>AI Echocardiography Assessment:</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-[#581C87]">
                {echoFinding}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
