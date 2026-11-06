"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck, KeyRound, Grid3X3, ArrowLeft, X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Daftar PIN Rahasia Staf & Manajemen Dian Motor
const VALID_PINS = [
  "260880", // Rekomendasi Utama: PSAJ 26 + Dian Motor 80 (dmotor80)
  "260526", // Alternatif: PSAJ 26
  "159067", // Alternatif: 6 digit awal Rekening BCA Diyan Purwanti
  "123456", // Cadangan darurat
];

// Definisi titik grid 3x3 (Ukuran 240x240 px)
const DOTS = [
  { id: 0, x: 40, y: 40 },
  { id: 1, x: 120, y: 40 },
  { id: 2, x: 200, y: 40 },
  { id: 3, x: 40, y: 120 },
  { id: 4, x: 120, y: 120 },
  { id: 5, x: 200, y: 120 },
  { id: 6, x: 40, y: 200 },
  { id: 7, x: 120, y: 200 },
  { id: 8, x: 200, y: 200 },
];

// Titik tengah yang otomatis terhubung jika garis lurus ditarik melintasinya
const MID_DOTS = {
  "0-2": 1, "2-0": 1,
  "3-5": 4, "5-3": 4,
  "6-8": 7, "8-6": 7,
  "0-6": 3, "6-0": 3,
  "1-7": 4, "7-1": 4,
  "2-8": 5, "8-2": 5,
  "0-8": 4, "8-0": 4,
  "2-6": 4, "6-2": 4,
};

// Pola Keamanan Rahasia yang Diizinkan (Mendukung segala variasi tarikan garis):
const VALID_PATTERNS = [
  // 1. Pola Huruf M (Mulai dari Kiri Bawah: 6 -> 3 -> 0 -> 4 -> 2 -> 5 -> 8)
  "6,3,0,4,2,5,8",
  "6,0,4,2,8",
  "6,3,0,4,8",
  "6,0,4,8",
  "6,3,0,4,2,8",

  // 2. Pola Huruf M (Mulai dari Kiri Atas: 0 -> 3 -> 6 -> 4 -> 2 -> 5 -> 8)
  "0,3,6,4,2,5,8",
  "0,6,4,2,8",
  "0,3,6,4,8",
  "0,6,4,8",
  "0,3,6,4,2,8",
  "0,6,4,2,5,8",

  // 3. Pola Huruf M (Terbalik dari Kanan: 8 -> 5 -> 2 -> 4 -> 0 -> 3 -> 6 atau 2 -> ...)
  "8,5,2,4,0,3,6",
  "8,2,4,0,6",
  "8,5,2,4,6,3,0",
  "2,5,8,4,0,3,6",
  "2,5,8,4,6,3,0",
  "2,8,4,0,6",

  // 4. Pola Huruf L (Standar & Cepat)
  "0,3,6,7,8",
  "0,6,7,8",
  "0,3,6,8",
  "0,6,8",
  "8,7,6,3,0",
  "8,6,0",

  // 5. Pola Huruf Z (Standar & Cepat)
  "0,1,2,4,6,7,8",
  "0,2,4,6,8",
  "0,1,2,4,6,8",
  "0,2,4,6,7,8",

  // 6. Pola Sudut & Kotak
  "0,1,2,5,8",
  "0,2,5,8",
  "0,1,4,7,8",
  "0,1,2,5,8,7,6,3",
  "0,2,8,6",
];

export function StaffGateModal({ open, onClose }) {
  const [step, setStep] = useState(1); // 1 = PIN, 2 = Pattern Lock, 3 = Success
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const [pattern, setPattern] = useState([]);
  const patternRef = useRef([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState(null);
  const [patternError, setPatternError] = useState("");
  const [shake, setShake] = useState(false);

  const svgRef = useRef(null);

  // Reset state saat modal dibuka/tutup
  useEffect(() => {
    if (open) {
      setStep(1);
      setPin("");
      setPinError("");
      setPattern([]);
      patternRef.current = [];
      setPatternError("");
    }
  }, [open]);

  // Handle keyboard untuk PIN
  useEffect(() => {
    if (!open || step !== 1) return;

    function handleKeyDown(e) {
      if (e.key >= "0" && e.key <= "9") {
        if (pin.length < 6) {
          handlePinInput(e.key);
        }
      } else if (e.key === "Backspace") {
        setPin((prev) => prev.slice(0, -1));
        setPinError("");
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, step, pin]);

  function handlePinInput(digit) {
    if (pin.length >= 6) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setPinError("");

    if (nextPin.length === 6) {
      if (VALID_PINS.includes(nextPin)) {
        setTimeout(() => {
          setStep(2);
        }, 250);
      } else {
        setShake(true);
        setPinError("PIN Keamanan salah. Silakan coba lagi.");
        setTimeout(() => {
          setPin("");
          setShake(false);
        }, 700);
      }
    }
  }

  // Handle Pattern Lock Touch & Pointer
  function getSvgPoint(e) {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }

    if (typeof clientX !== "number" || typeof clientY !== "number") return null;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function checkHitDot(pt) {
    if (!pt) return null;
    for (const dot of DOTS) {
      const dist = Math.hypot(dot.x - pt.x, dot.y - pt.y);
      if (dist <= 30) {
        return dot.id;
      }
    }
    return null;
  }

  function handlePointerDown(e) {
    e.preventDefault();
    try {
      if (e.currentTarget && e.pointerId !== undefined) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } catch {}
    setPatternError("");
    const pt = getSvgPoint(e);
    const hit = checkHitDot(pt);
    setIsDrawing(true);
    setCursorPos(pt);
    if (hit !== null) {
      setPattern([hit]);
      patternRef.current = [hit];
    } else {
      setPattern([]);
      patternRef.current = [];
    }
  }

  function handlePointerMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getSvgPoint(e);
    if (!pt) return;
    setCursorPos(pt);
    const hit = checkHitDot(pt);
    if (hit !== null && !patternRef.current.includes(hit)) {
      const prev = patternRef.current;
      const next = [...prev];
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const mid = MID_DOTS[`${last}-${hit}`];
        if (mid !== undefined && !prev.includes(mid)) {
          next.push(mid);
        }
      }
      next.push(hit);
      patternRef.current = next;
      setPattern(next);
    }
  }

  function handlePointerUp() {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCursorPos(null);

    const currentPattern = patternRef.current;
    if (currentPattern.length < 4) {
      if (currentPattern.length > 0) {
        setPatternError("Pola terlalu pendek (minimal 4 titik).");
        setShake(true);
        setTimeout(() => {
          setPattern([]);
          patternRef.current = [];
          setShake(false);
        }, 600);
      }
      return;
    }

    const key = currentPattern.join(",");
    if (VALID_PATTERNS.includes(key)) {
      setStep(3);
      try {
        document.cookie = "dian-motor-gate=verified; path=/; max-age=7200;";
      } catch {}
      setTimeout(() => {
        window.location.href = "/login";
      }, 900);
    } else {
      setShake(true);
      setPatternError("Pola keamanan tidak cocok. Silakan coba lagi.");
      setTimeout(() => {
        setPattern([]);
        patternRef.current = [];
        setShake(false);
      }, 700);
    }
  }

  // Pengaman window bila gesture dilepas di luar area SVG
  useEffect(() => {
    if (!isDrawing) return;
    function onEnd() {
      handlePointerUp();
    }
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("touchend", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [isDrawing]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div
        className={`relative w-full max-w-[420px] max-h-[92dvh] overflow-y-auto rounded-[24px] border border-border bg-card p-5 sm:p-8 shadow-2xl transition-all ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Tombol Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 grid size-8 place-items-center rounded-xl border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          aria-label="Tutup"
        >
          <X className="size-4" />
        </button>

        {/* STEP 1: PIN KEAMANAN */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <KeyRound className="size-5" />
              </span>
              <div>
                <p className="font-mono text-[9px] font-bold tracking-[.18em] text-primary uppercase">
                  VERIFIKASI 1 DARI 2
                </p>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  PIN Akses Terminal
                </h3>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Masukkan 6-digit PIN keamanan staf untuk membuka akses ke portal manajemen bengkel.
            </p>

            {/* Display 6 Bulatan PIN */}
            <div className="my-6 flex justify-center gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const filled = i < pin.length;
                return (
                  <div
                    key={i}
                    className={`size-4 rounded-full border-2 transition-all duration-200 ${
                      filled
                        ? "border-primary bg-primary scale-110 shadow-[0_0_12px_rgba(220,38,38,0.5)]"
                        : "border-border bg-muted/40"
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <div className="mb-4 flex items-center justify-center gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="size-3.5" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Numpad Keyboard */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinInput(String(num))}
                  className="h-12 rounded-xl border border-border bg-card text-base font-bold text-foreground transition-all hover:bg-muted hover:border-primary/40 active:scale-95 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPin("");
                  setPinError("");
                }}
                className="h-12 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handlePinInput("0")}
                className="h-12 rounded-xl border border-border bg-card text-base font-bold text-foreground transition-all hover:bg-muted hover:border-primary/40 active:scale-95 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPin((prev) => prev.slice(0, -1))}
                className="h-12 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                ⌫
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground/70">
              <Lock className="size-3 text-muted-foreground/50" />
              <span>Akses terproteksi otorisasi staf &amp; manajemen bengkel</span>
            </div>
          </div>
        )}

        {/* STEP 2: PATTERN LOCK 3x3 */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                <Grid3X3 className="size-5" />
              </span>
              <div>
                <p className="font-mono text-[9px] font-bold tracking-[.18em] text-emerald-500 uppercase">
                  VERIFIKASI 2 DARI 2
                </p>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Pola Kunci Staf (3x3)
                </h3>
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Tarik garis untuk menghubungkan pola otorisasi staf Dian Motor.
            </p>

            {/* Pattern Lock Canvas SVG */}
            <div className="my-4 flex flex-col items-center">
              <div className="relative touch-none select-none rounded-2xl border border-border/80 bg-muted/20 p-2 shadow-inner">
                <svg
                  ref={svgRef}
                  width="240"
                  height="240"
                  style={{ touchAction: "none" }}
                  className="cursor-crosshair overflow-visible touch-none select-none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {/* Garis yang sudah terhubung */}
                  {pattern.map((dotId, idx) => {
                    if (idx === 0) return null;
                    const prev = DOTS[pattern[idx - 1]];
                    const curr = DOTS[dotId];
                    return (
                      <line
                        key={`line-${idx}`}
                        x1={prev.x}
                        y1={prev.y}
                        x2={curr.x}
                        y2={curr.y}
                        stroke="#dc2626"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="transition-all duration-75"
                      />
                    );
                  })}

                  {/* Garis sementara ke posisi pointer */}
                  {isDrawing && pattern.length > 0 && cursorPos && (
                    <line
                      x1={DOTS[pattern[pattern.length - 1]].x}
                      y1={DOTS[pattern[pattern.length - 1]].y}
                      x2={cursorPos.x}
                      y2={cursorPos.y}
                      stroke="#dc2626"
                      strokeWidth="3"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                  )}

                  {/* 9 Titik Grid */}
                  {DOTS.map((dot) => {
                    const active = pattern.includes(dot.id);
                    return (
                      <g key={dot.id}>
                        {/* Lingkaran luar saat aktif */}
                        {active && (
                          <circle
                            cx={dot.x}
                            cy={dot.y}
                            r="18"
                            fill="rgba(220, 38, 38, 0.18)"
                            stroke="#dc2626"
                            strokeWidth="1.5"
                          />
                        )}
                        {/* Titik inti */}
                        <circle
                          cx={dot.x}
                          cy={dot.y}
                          r={active ? 7 : 5}
                          fill={active ? "#dc2626" : "currentColor"}
                          className={`transition-all duration-150 ${
                            active ? "text-primary" : "text-muted-foreground/60"
                          }`}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {patternError ? (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-destructive">
                  <AlertCircle className="size-3.5" />
                  <span>{patternError}</span>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
                  <ShieldCheck className="size-3.5 text-muted-foreground/50" />
                  <span>Hubungkan minimal 4 titik pola verifikasi</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setPin("");
                  setPattern([]);
                }}
                className="flex-1 text-xs"
              >
                <ArrowLeft className="size-3.5" />
                Kembali ke PIN
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPattern([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-3.5" />
                Reset Pola
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div className="py-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground">
              Verifikasi Berhasil!
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Otorisasi staf terkonfirmasi. Mengalihkan Anda ke portal login Dian Motor...
            </p>
            <div className="mt-5 flex justify-center">
              <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffGateModal;

