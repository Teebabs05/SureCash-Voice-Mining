import { formatCurrency } from "@/lib/utils";

// Client-side only (uses document.createElement("canvas")) - never import
// this into a server component or API route.

export interface FlyerData {
  fullName: string;
  rank: number;
  totalEarned: number;
}

const WIDTH = 1080;
const HEIGHT = 1350;
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function generateTopEarnerFlyer({ fullName, rank, totalEarned }: FlyerData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't generate images");

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, "#10201e");
  bg.addColorStop(1, "#05100e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 2;
  for (let i = -HEIGHT; i < WIDTH; i += 30) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + HEIGHT, HEIGHT);
    ctx.stroke();
  }
  ctx.restore();

  const glow = ctx.createRadialGradient(WIDTH / 2, 300, 20, WIDTH / 2, 300, 340);
  glow.addColorStop(0, "rgba(245,166,35,0.35)");
  glow.addColorStop(1, "rgba(245,166,35,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(245,166,35,0.6)";
  ctx.lineWidth = 6;
  roundedRect(ctx, 30, 30, WIDTH - 60, HEIGHT - 60, 48);
  ctx.stroke();

  ctx.font = `bold 28px ${FONT}`;
  const pillText = "★ TOP EARNER CLUB ★";
  const pillWidth = ctx.measureText(pillText).width + 90;
  roundedRect(ctx, WIDTH / 2 - pillWidth / 2, 108, pillWidth, 64, 32);
  ctx.strokeStyle = "rgba(245,166,35,0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#F5A623";
  ctx.fillText(pillText, WIDTH / 2, 108 + 40);

  ctx.font = "150px serif";
  ctx.fillText("👑", WIDTH / 2, 400);

  ctx.font = `bold 92px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`RANK #${rank}`, WIDTH / 2, 540);

  ctx.strokeStyle = "rgba(245,166,35,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 160, 590);
  ctx.lineTo(WIDTH / 2 + 160, 590);
  ctx.stroke();

  ctx.font = `bold 64px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fullName, WIDTH / 2, 690, WIDTH - 160);

  ctx.font = `600 28px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("TOTAL EARNED", WIDTH / 2, 800);

  ctx.font = `bold 78px ${FONT}`;
  ctx.fillStyle = "#F5A623";
  ctx.fillText(formatCurrency(totalEarned), WIDTH / 2, 880, WIDTH - 120);

  ctx.font = `bold 34px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("SureCash Mining", WIDTH / 2, HEIGHT - 140);
  ctx.font = `24px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("your voice is currency", WIDTH / 2, HEIGHT - 100);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not generate flyer"))), "image/png");
  });
}

export function downloadFlyer(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "top-earner-flyer.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function shareFlyer(blob: Blob) {
  const file = new File([blob], "top-earner-flyer.png", { type: "image/png" });

  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "I'm a Top Earner on SureCash Mining!" });
      return;
    } catch {
      // User cancelled the share sheet - nothing to do.
      return;
    }
  }

  downloadFlyer(blob);
}
