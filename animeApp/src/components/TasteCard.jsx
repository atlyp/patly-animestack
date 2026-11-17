import { useState } from "react";
import { aiTaste, posterOf, titleOf } from "../api";

const W = 1080;
const H = 1350;

const loadImage = (src) =>
     new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
     });

const roundRect = (ctx, x, y, w, h, r) => {
     ctx.beginPath();
     ctx.moveTo(x + r, y);
     ctx.arcTo(x + w, y, x + w, y + h, r);
     ctx.arcTo(x + w, y + h, x, y + h, r);
     ctx.arcTo(x, y + h, x, y, r);
     ctx.arcTo(x, y, x + w, y, r);
     ctx.closePath();
};

const wrap = (ctx, text, maxWidth) => {
     const words = text.split(" ");
     const lines = [];
     let line = "";
     for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (ctx.measureText(test).width > maxWidth && line) {
               lines.push(line);
               line = w;
          } else line = test;
     }
     if (line) lines.push(line);
     return lines;
};

// Draws the 4:5 share image (Instagram-friendly) and returns a PNG blob.
async function renderCard({ username, profile, shows }) {
     await document.fonts?.ready;
     const canvas = document.createElement("canvas");
     canvas.width = W;
     canvas.height = H;
     const ctx = canvas.getContext("2d");
     const font = (weight, size) => `${weight} ${size}px "Plus Jakarta Sans", system-ui, sans-serif`;

     // background
     ctx.fillStyle = "#0b0a1a";
     ctx.fillRect(0, 0, W, H);
     const glow = (x, y, r, color) => {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, color);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
     };
     glow(W, 0, 800, "rgba(178,107,255,0.45)");
     glow(0, H, 800, "rgba(255,107,154,0.35)");
     for (let i = 0; i < 70; i++) {
          ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6})`;
          ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
     }

     // brand
     const logo = await loadImage("/yumemi.svg");
     if (logo) ctx.drawImage(logo, 80, 80, 64, 64);
     ctx.fillStyle = "#f4f1ff";
     ctx.font = font(800, 40);
     ctx.fillText("yumemi", 160, 126);
     ctx.fillStyle = "#a9a3c7";
     ctx.font = font(600, 28);
     ctx.textAlign = "right";
     ctx.fillText(`@${username}`, W - 80, 124);
     ctx.textAlign = "left";

     // headline
     ctx.fillStyle = "#a9a3c7";
     ctx.font = font(700, 26);
     ctx.fillText("MY ANIME TASTE", 80, 250);
     const grad = ctx.createLinearGradient(80, 0, W - 80, 0);
     grad.addColorStop(0, "#ff6b9a");
     grad.addColorStop(0.55, "#b26bff");
     grad.addColorStop(1, "#5b6cff");
     ctx.fillStyle = grad;
     ctx.font = font(800, 84);
     let y = 345;
     for (const line of wrap(ctx, profile.title, W - 160)) {
          ctx.fillText(line, 80, y);
          y += 92;
     }
     ctx.fillStyle = "#e6e1fa";
     ctx.font = font(500, 34);
     y += 6;
     for (const line of wrap(ctx, profile.blurb, W - 160).slice(0, 3)) {
          ctx.fillText(line, 80, y);
          y += 48;
     }

     // posters
     const picks = shows.slice(0, 5);
     const imgs = await Promise.all(picks.map((s) => loadImage(posterOf(s))));
     const gap = 22;
     const pw = (W - 160 - gap * (picks.length - 1)) / Math.max(picks.length, 1);
     const ph = pw * 1.5;
     const py = Math.max(y + 40, 690);
     imgs.forEach((img, i) => {
          const x = 80 + i * (pw + gap);
          ctx.save();
          roundRect(ctx, x, py, pw, ph, 20);
          ctx.clip();
          if (img) {
               const scale = Math.max(pw / img.width, ph / img.height);
               ctx.drawImage(img, x + (pw - img.width * scale) / 2, py + (ph - img.height * scale) / 2, img.width * scale, img.height * scale);
          } else {
               ctx.fillStyle = "#1a1736";
               ctx.fillRect(x, py, pw, ph);
          }
          ctx.restore();
          ctx.fillStyle = "#f4f1ff";
          ctx.font = font(700, 20);
          const lines = wrap(ctx, titleOf(picks[i]), pw - 18);
          const t = lines.length > 1 ? lines[0].replace(/[:,\-–]$/, "") + "…" : lines[0];
          ctx.fillText(t, x, py + ph + 34);
     });

     // traits
     let tx = 80;
     const ty = H - 150;
     ctx.font = font(700, 28);
     for (const trait of profile.traits.slice(0, 3)) {
          const w = ctx.measureText(trait).width + 48;
          ctx.fillStyle = "rgba(178,107,255,0.22)";
          roundRect(ctx, tx, ty, w, 60, 30);
          ctx.fill();
          ctx.fillStyle = "#e3ccff";
          ctx.fillText(trait, tx + 24, ty + 40);
          tx += w + 16;
     }
     ctx.fillStyle = "#6f6a8f";
     ctx.font = font(600, 24);
     ctx.fillText("Find yours on yumemi ✦", 80, H - 50);
     // watch stats, bottom-right
     const eps = shows.reduce((n, s) => n + (s.episodesWatched || 0), 0);
     const done = shows.filter((s) => s.status === "completed").length;
     if (eps > 0) {
          ctx.textAlign = "right";
          ctx.fillStyle = "#f4f1ff";
          ctx.font = font(800, 44);
          ctx.fillText(`${eps} episodes`, W - 80, H - 102);
          ctx.fillStyle = "#a9a3c7";
          ctx.font = font(600, 24);
          ctx.fillText(`watched${done ? ` · ${done} completed` : ""}`, W - 80, H - 66);
          ctx.textAlign = "left";
     }

     return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export const TasteCard = ({ username, myShows }) => {
     const [state, setState] = useState({ status: "idle" });
     const [imgUrl, setImgUrl] = useState(null);
     const [blob, setBlob] = useState(null);

     const generate = async () => {
          setState({ status: "loading" });
          try {
               const profile = await aiTaste(myShows.map((s) => s.mal_id));
               const png = await renderCard({ username, profile, shows: myShows });
               if (imgUrl) URL.revokeObjectURL(imgUrl);
               setBlob(png);
               setImgUrl(URL.createObjectURL(png));
               setState({ status: "done", profile });
          } catch (e) {
               setState({ status: "error", message: e instanceof TypeError ? "Can't reach the Yumemi server." : e.message });
          }
     };

     const fileName = `yumemi-taste-${username || "card"}.png`;
     const share = async () => {
          const file = new File([blob], fileName, { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
               try {
                    await navigator.share({ files: [file], title: "My anime taste", text: state.profile.title });
                    return;
               } catch {
                    /* user cancelled — fall through to download */
               }
          }
          const a = document.createElement("a");
          a.href = imgUrl;
          a.download = fileName;
          a.click();
     };

     if (!myShows?.length) return null;

     return (
          <section className="taste">
               <div className="taste__copy">
                    <span className="ai-badge">✦ Taste card</span>
                    <h2 className="profile-section-title">What does your list say about you?</h2>
                    <p>Turn your saved shows into a shareable card with your anime personality.</p>
                    <div className="taste__buttons">
                         <button type="button" className="ai-finder__go" onClick={generate} disabled={state.status === "loading"}>
                              {state.status === "loading" ? <span className="dots">Reading your taste</span> : state.status === "done" ? "Regenerate" : "Generate my card"}
                         </button>
                         {state.status === "done" && (
                              <button type="button" className="ghost-btn" onClick={share}>
                                   Share / Download
                              </button>
                         )}
                    </div>
                    {state.status === "error" && <p className="ai-finder__error">{state.message}</p>}
               </div>
               <div className="taste__preview">
                    {imgUrl ? (
                         <img src={imgUrl} alt={`Taste card: ${state.profile?.title}`} />
                    ) : (
                         <div className="taste__placeholder">
                              <span>✦</span>
                              Your card appears here
                         </div>
                    )}
               </div>
          </section>
     );
};
