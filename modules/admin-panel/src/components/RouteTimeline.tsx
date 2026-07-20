import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, Play, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface RouteTimelineProps {
  stops: string[];
  busNumber: string;
  departure: string;
  arrival: string;
  onClose: () => void;
}

const RouteTimeline = ({ stops, busNumber, departure, arrival, onClose }: RouteTimelineProps) => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const progress = currentIndex < 0 ? 0 : Math.round(((currentIndex + 1) / stops.length) * 100);
  const isComplete = currentIndex >= stops.length - 1;

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const startTracking = useCallback(() => {
    setCurrentIndex(0);
    setIsRunning(true);
    speak(`Departing from ${stops[0]}`);
  }, [stops, speak]);

  const resetTracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentIndex(-1);
    setIsRunning(false);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (!isRunning || isComplete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (isComplete) {
        setIsRunning(false);
        speak(`You have arrived at ${stops[stops.length - 1]}. Thank you for travelling.`);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next < stops.length) {
          if (next < stops.length - 1) {
            speak(`Next stop is ${stops[next + 1]}`);
          } else {
            speak(`Arriving at final destination: ${stops[next]}`);
          }
        }
        return next;
      });
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isComplete, stops, speak]);

  // Auto-scroll to current stop
  useEffect(() => {
    if (currentIndex >= 0 && scrollRef.current) {
      const stopEl = scrollRef.current.querySelector(`[data-stop-index="${currentIndex}"]`);
      stopEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const getStopStatus = (index: number) => {
    if (currentIndex < 0) return "upcoming";
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "current";
    return "upcoming";
  };

  const formatTime12 = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-card sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">{busNumber}</h3>
            <p className="text-xs text-muted-foreground">
              {formatTime12(departure)} → {formatTime12(arrival)} · {stops.length} stops
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Toggle voice"
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Journey Progress</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current / Next stop status */}
        {currentIndex >= 0 && (
          <div className="mx-4 mt-3 rounded-lg bg-primary/10 p-3 animate-fade-in">
            <p className="text-xs font-semibold text-primary">
              📍 Current: <span className="text-foreground">{stops[currentIndex]}</span>
            </p>
            {currentIndex < stops.length - 1 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                ➡️ Next: {stops[currentIndex + 1]}
              </p>
            )}
            {isComplete && (
              <p className="mt-1 text-xs font-semibold text-success">
                ✅ Journey Complete!
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="relative ml-4">
            {stops.map((stop, i) => {
              const status = getStopStatus(i);
              return (
                <div
                  key={i}
                  data-stop-index={i}
                  className="relative flex items-start pb-6 last:pb-0"
                >
                  {/* Vertical line */}
                  {i < stops.length - 1 && (
                    <div
                      className={`absolute left-[7px] top-5 h-full w-0.5 transition-colors duration-500 ${
                        status === "completed" ? "bg-success" : "bg-border"
                      }`}
                    />
                  )}

                  {/* Dot / Bus icon */}
                  <div className="relative z-10 flex-shrink-0">
                    {status === "current" ? (
                      <div className="flex h-4 w-4 items-center justify-center">
                        <span className="text-lg leading-none animate-bounce">🚌</span>
                      </div>
                    ) : (
                      <div
                        className={`h-4 w-4 rounded-full border-2 transition-all duration-500 ${
                          status === "completed"
                            ? "border-success bg-success"
                            : "border-border bg-card"
                        }`}
                      >
                        {status === "completed" && (
                          <svg className="h-full w-full text-success-foreground p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stop label */}
                  <div className="ml-3 flex-1">
                    <p
                      className={`text-sm font-medium transition-colors duration-300 ${
                        status === "current"
                          ? "text-primary font-bold"
                          : status === "completed"
                          ? "text-success"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stop}
                    </p>
                    {i === 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        Departs {formatTime12(departure)}
                      </span>
                    )}
                    {i === stops.length - 1 && (
                      <span className="text-[10px] text-muted-foreground">
                        Arrives {formatTime12(arrival)}
                      </span>
                    )}
                  </div>

                  {/* Stop number */}
                  <span className="ml-2 text-[10px] text-muted-foreground">{i + 1}/{stops.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="border-t border-border px-4 py-3 flex gap-2">
          {!isRunning && !isComplete && (
            <Button onClick={startTracking} className="flex-1 gap-2">
              <Play className="h-4 w-4" />
              Start Tracking
            </Button>
          )}
          {isComplete && (
            <Button onClick={resetTracking} variant="outline" className="flex-1 gap-2">
              <RotateCcw className="h-4 w-4" />
              Replay
            </Button>
          )}
          {isRunning && !isComplete && (
            <Button onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setIsRunning(false); }} variant="outline" className="flex-1">
              Pause
            </Button>
          )}
          {!isRunning && currentIndex >= 0 && !isComplete && (
            <Button onClick={() => setIsRunning(true)} className="flex-1 gap-2">
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
          {currentIndex >= 0 && !isComplete && (
            <Button onClick={resetTracking} variant="ghost" size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteTimeline;
