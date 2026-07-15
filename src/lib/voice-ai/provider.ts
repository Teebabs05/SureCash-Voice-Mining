export interface TranscriptionResult {
  transcript: string;
  confidence: number; // 0..1
  raw?: unknown;
}

export interface VoiceAiProvider {
  name: string;
  transcribe(audio: Buffer, mimeType: string): Promise<TranscriptionResult>;
}

/**
 * Stub provider: no external API calls, deterministic-enough output so the
 * rest of the pipeline (duplicate/replay detection, wallet crediting) can be
 * exercised end-to-end without paid API keys. Swap VOICE_AI_PROVIDER to
 * "whisper" | "gemini" | "azure" and supply credentials to use a real model.
 */
class StubProvider implements VoiceAiProvider {
  name = "stub";

  async transcribe(audio: Buffer): Promise<TranscriptionResult> {
    // A real STT call would return an actual transcript. We fake a
    // plausible-looking one and derive "confidence" from audio size so short
    // or empty clips score low and get rejected downstream.
    const sizeScore = Math.min(1, audio.byteLength / 20_000);
    const confidence = 0.55 + sizeScore * 0.4;
    return {
      transcript: "[stub transcript] user voice sample recorded for task prompt",
      confidence: Number(confidence.toFixed(2)),
      raw: { provider: "stub", bytes: audio.byteLength },
    };
  }
}

class WhisperProvider implements VoiceAiProvider {
  name = "whisper";

  async transcribe(audio: Buffer, mimeType: string): Promise<TranscriptionResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const form = new FormData();
    form.append("model", "whisper-1");
    form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), "recording.webm");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) throw new Error(`Whisper API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { text: string };
    return { transcript: data.text, confidence: 0.9, raw: data };
  }
}

class GeminiProvider implements VoiceAiProvider {
  name = "gemini";

  async transcribe(audio: Buffer, mimeType: string): Promise<TranscriptionResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Transcribe this audio exactly as spoken." },
                { inline_data: { mime_type: mimeType, data: audio.toString("base64") } },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { transcript, confidence: 0.85, raw: data };
  }
}

class AzureSpeechProvider implements VoiceAiProvider {
  name = "azure";

  async transcribe(audio: Buffer, mimeType: string): Promise<TranscriptionResult> {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) throw new Error("AZURE_SPEECH_KEY / AZURE_SPEECH_REGION are not configured");

    const res = await fetch(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": mimeType || "audio/webm",
        },
        body: new Uint8Array(audio),
      }
    );

    if (!res.ok) throw new Error(`Azure Speech API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
      transcript: data.DisplayText ?? "",
      confidence: data.NBest?.[0]?.Confidence ?? 0.7,
      raw: data,
    };
  }
}

export function getVoiceAiProvider(): VoiceAiProvider {
  switch (process.env.VOICE_AI_PROVIDER) {
    case "whisper":
      return new WhisperProvider();
    case "gemini":
      return new GeminiProvider();
    case "azure":
      return new AzureSpeechProvider();
    default:
      return new StubProvider();
  }
}
