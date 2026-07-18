"use client";

import { useRef, useState } from "react";
import { Mic, Square, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getDeviceFingerprint } from "@/lib/device-fingerprint";
import { formatCurrency } from "@/lib/utils";

interface VoiceTaskLite {
  id: string;
  promptText: string;
  minDuration: number;
  maxDuration: number;
  rewardAmount: string;
}

export function VoiceRecorder({ task, onDone }: { task: VoiceTaskLite; onDone: () => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access is required to record");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (seconds < task.minDuration) {
      toast.error(`Recording must be at least ${task.minDuration}s`);
    }
  }

  function discard() {
    setBlob(null);
    setSeconds(0);
  }

  async function submit() {
    if (!blob) return;
    setSubmitting(true);
    try {
      const fingerprint = await getDeviceFingerprint();
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      form.append("voiceTaskId", task.id);
      form.append("durationSec", String(seconds));
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
      <p className="text-center text-sm font-medium text-foreground/80">&ldquo;{task.promptText}&rdquo;</p>

      {!blob && (
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 ${
            recording ? "bg-red-500 animate-pulse-glow" : "gradient-brand"
          }`}
        >
          {recording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
      )}

      {recording && <p className="font-mono text-sm text-foreground/60">{seconds}s</p>}

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
          </div>
        </div>
      )}
    </div>
  );
}
