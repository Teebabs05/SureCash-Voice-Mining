"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCw, Send, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getDeviceFingerprint } from "@/lib/device-fingerprint";
import { formatCurrency } from "@/lib/utils";
import { stripInstructionalPrefix } from "@/lib/voice-ai/match";

interface WordGameTaskLite {
  id: string;
  promptText: string;
  minDuration: number;
  maxDuration: number;
  rewardAmount: string;
}

export function WordGameRecorder({
  task,
  onDone,
  onSkip,
}: {
  task: WordGameTaskLite;
  onDone: () => void;
  onSkip: () => void;
}) {
  const timeLimit = Math.min(task.maxDuration, 10);
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(timeLimit);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      recorder?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (recording && secondsLeft === 0) stopRecording();
  }, [recording, secondsLeft]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        setBlob(new Blob(chunksRef.current, { type: recorder.mimeType }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setSecondsLeft(timeLimit);
      setSecondsElapsed(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setSecondsElapsed((s) => s + 1);
        setSecondsLeft((s) => Math.max(s - 1, 0));
      }, 1000);
    } catch {
      toast.error("Microphone access is required to record");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function discard() {
    setBlob(null);
    setSecondsElapsed(0);
    setSecondsLeft(timeLimit);
  }

  async function submit() {
    if (!blob) return;
    if (secondsElapsed < task.minDuration) {
      toast.error(`Recording must be at least ${task.minDuration}s`);
      return;
    }
    setSubmitting(true);
    try {
      const fingerprint = await getDeviceFingerprint();
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      form.append("voiceTaskId", task.id);
      form.append("durationSec", String(secondsElapsed));
      form.append("fingerprint", fingerprint);

      const res = await apiFetch<{ passed: boolean; reward: number; reason: string | null }>(
        "/api/voice/recordings",
        { method: "POST", body: form, headers: {} }
      );

      if (res.passed) {
        toast.success(`Approved! +${formatCurrency(res.reward)} added to your Voice wallet`);
      } else {
        toast.warning(res.reason ?? "Recording didn't pass validation. Try again in a quiet space.");
      }
      discard();
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-muted p-4">
      <p className="text-center text-2xl font-bold tracking-wide text-foreground">
        {stripInstructionalPrefix(task.promptText)}
      </p>

      {!blob && (
        <>
          <div className="flex items-center gap-4">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 ${
                recording ? "bg-red-500 animate-pulse-glow" : "gradient-brand"
              }`}
            >
              {recording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            {!recording && (
              <button
                onClick={onSkip}
                title="Can't pronounce it? Get another word"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-foreground/60 shadow-md transition-transform active:scale-95 hover:text-foreground"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            )}
          </div>
          {recording ? (
            <p className="font-mono text-lg font-bold text-red-500">{secondsLeft}s left</p>
          ) : (
            <p className="text-xs text-foreground/50">You have {timeLimit}s to say the word · tap the circle to skip</p>
          )}
        </>
      )}

      {blob && !recording && (
        <div className="flex w-full flex-col items-center gap-3">
          <audio controls src={URL.createObjectURL(blob)} className="w-full" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={discard}>
              <Trash2 className="h-4 w-4" /> Discard
            </Button>
            <Button size="sm" loading={submitting} onClick={submit}>
              <Send className="h-4 w-4" /> Submit
            </Button>
            <Button variant="outline" size="sm" onClick={onSkip}>
              <RotateCw className="h-4 w-4" /> Skip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
