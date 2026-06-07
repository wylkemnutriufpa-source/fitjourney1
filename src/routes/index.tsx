import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogoOrbital } from "@/components/LogoOrbital";
import reel1 from "@/assets/reels/reel-1.mp4.asset.json";
import reel2 from "@/assets/reels/reel-2.mp4.asset.json";
import reel3 from "@/assets/reels/reel-3.mp4.asset.json";
import reel4 from "@/assets/reels/reel-4.mp4.asset.json";
import imgEvolucao from "@/assets/reels/evolucao-pratica.png.asset.json";
import imgDuradouras from "@/assets/reels/mudancas-duradouras.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitJourney — A evolução da Nutrição Clínica Inteligente" },
      {
        name: "description",
        content:
          "Plataforma clínica para nutricionistas. Protocolos vivos, acompanhamento diário automatizado e inteligência em tempo real. 3 dias grátis, sem cartão.",
      },
      { property: "og:title", content: "FitJourney — Nutrição Clínica Inteligente" },
      {
        property: "og:description",
        content:
          "Conduza o metabolismo humano com precisão. Cada decisão registrada, auditável e reproduzível.",
      },
    ],
  }),
  component: LandingPage,
});

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --black: #040A04;
  --dark: #081208;
  --panel: #0C1A0C;
  --card: #101E10;
  --neon: #2EE07A;
  --neon-dim: rgba(46,224,122,0.12);
  --neon-glow: rgba(46,224,122,0.08);
  --silver: #C0D4C0;
  --muted: #527052;
  --border: rgba(46,224,122,0.14);
  --border-dim: rgba(46,224,122,0.07);
  --silver-metal: linear-gradient(135deg, #f4f8f4 0%, #b8c8b8 45%, #6a7a6a 100%);
  --syne: 'Syne', sans-serif;
  --mono: 'IBM Plex Mono', monospace;
  --sans: 'IBM Plex Sans', sans-serif;
}
html { scroll-behavior: smooth; }
.fj-landing { background: var(--black); color: var(--silver); font-family: var(--sans); overflow-x: hidden; min-height: 100vh; position: relative; }
@media (min-width: 1024px) { .fj-landing { cursor: none; } }
.fj-cursor { position: fixed; width: 7px; height: 7px; background: var(--neon); border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%,-50%); box-shadow: 0 0 10px var(--neon); transition: width .2s, height .2s; display: none; }
.fj-cursor-ring { position: fixed; width: 28px; height: 28px; border: 1px solid rgba(0,255,106,0.35); border-radius: 50%; pointer-events: none; z-index: 9998; transform: translate(-50%,-50%); transition: width .3s, height .3s, border-color .3s; display: none; }
@media (min-width: 1024px) { .fj-cursor, .fj-cursor-ring { display: block; } }
.fj-scanlines { content: ''; position: fixed; inset: 0; z-index: 900; pointer-events: none; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px); }
.fj-grid-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: linear-gradient(rgba(0,255,106,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,106,0.035) 1px, transparent 1px); background-size: 64px 64px; mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%); -webkit-mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%); }

.fj-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 500; display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: rgba(4,10,4,0.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid var(--border-dim); transition: padding .3s; }
@media (min-width: 1024px) { .fj-nav { padding: 18px 56px; } }
.fj-nav-logo { font-family: var(--syne); font-size: 1rem; font-weight: 800; letter-spacing: .08em; color: white; display: flex; align-items: center; gap: 10px; }
.fj-nav-dot { width: 7px; height: 7px; background: var(--neon); border-radius: 50%; box-shadow: 0 0 8px var(--neon); animation: fj-blink 2s infinite; }
@keyframes fj-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
.fj-nav-links { display: none; gap: 32px; align-items: center; }
@media (min-width: 1024px) { .fj-nav-links { display: flex; } }
.fj-nav-links a { font-family: var(--mono); font-size: .7rem; color: var(--muted); text-decoration: none; letter-spacing: .08em; text-transform: uppercase; transition: color .2s; }
.fj-nav-links a:hover { color: var(--neon); }
.fj-nav-cta { font-family: var(--mono); font-size: .7rem; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; background: transparent; border: 1px solid var(--neon); color: var(--neon) !important; padding: 10px 20px; border-radius: 2px; cursor: pointer; transition: all .25s; box-shadow: 0 0 12px rgba(0,255,106,.08); }
.fj-nav-cta:hover { background: var(--neon-dim); box-shadow: 0 0 24px rgba(0,255,106,.2); }

.fj-hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 120px 24px 80px; position: relative; overflow: hidden; }
@media (min-width: 1024px) { .fj-hero { padding: 140px 56px 100px; } }
.fj-hero-radial { position: absolute; top: -10%; right: -5%; width: 700px; height: 700px; background: radial-gradient(circle, rgba(0,255,106,.05) 0%, transparent 70%); pointer-events: none; }
.fj-hero-tag { font-family: var(--mono); font-size: .65rem; letter-spacing: .16em; text-transform: uppercase; color: var(--neon); margin-bottom: 28px; display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
.fj-hero-tag::before { content: ''; width: 28px; height: 1px; background: var(--neon); box-shadow: 0 0 6px var(--neon); }
.fj-hero-h1 { font-family: var(--syne); font-size: clamp(2.5rem,6vw,6.5rem); font-weight: 800; line-height: .95; letter-spacing: -.03em; color: white; margin-bottom: 36px; max-width: 960px; position: relative; z-index: 1; }
.fj-hero-h1 .neon { color: var(--neon); text-shadow: 0 0 48px rgba(0,255,106,.45); }
.fj-hero-h1 .dim { color: var(--muted); }
.fj-hero-sub { font-size: 1.05rem; color: var(--silver); opacity: .65; max-width: 580px; line-height: 1.8; margin-bottom: 56px; position: relative; z-index: 1; }
.fj-hero-sub strong { color: var(--silver); opacity: 1; font-weight: 600; }
.fj-hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; margin-bottom: 88px; position: relative; z-index: 1; }
.fj-btn-neon { font-family: var(--mono); font-size: .78rem; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; background: var(--neon); color: var(--black); padding: 18px 36px; border: none; border-radius: 2px; cursor: pointer; text-decoration: none; transition: all .25s; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 0 32px rgba(0,255,106,.28), 0 0 64px rgba(0,255,106,.08); }
.fj-btn-neon:hover { background: white; box-shadow: 0 0 48px rgba(0,255,106,.5); transform: translateY(-2px); }
.fj-btn-ghost { font-family: var(--mono); font-size: .75rem; letter-spacing: .08em; text-transform: uppercase; background: transparent; color: var(--muted); padding: 18px 28px; border: 1px solid rgba(0,255,106,.15); border-radius: 2px; cursor: pointer; text-decoration: none; transition: all .25s; display: inline-flex; align-items: center; gap: 8px; }
.fj-btn-ghost:hover { color: var(--neon); border-color: rgba(0,255,106,.4); }
.fj-hero-pillars { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border-dim); border-radius: 4px; overflow: hidden; max-width: 860px; position: relative; z-index: 1; }
@media (min-width: 1024px) { .fj-hero-pillars { flex-direction: row; } }
.fj-h-pillar { flex: 1; padding: 20px 24px; border-bottom: 1px solid var(--border-dim); position: relative; }
@media (min-width: 1024px) { .fj-h-pillar { border-right: 1px solid var(--border-dim); border-bottom: none; } .fj-h-pillar:last-child { border-right: none; } }
.fj-h-pillar:last-child { border-bottom: none; }
.fj-h-p-num { font-family: var(--mono); font-size: .6rem; color: var(--neon); letter-spacing: .1em; margin-bottom: 6px; opacity: .7; }
.fj-h-p-title { font-family: var(--syne); font-size: .85rem; font-weight: 700; color: white; margin-bottom: 4px; }
.fj-h-p-desc { font-size: .72rem; color: var(--muted); line-height: 1.6; }

.fj-s { padding: 80px 24px; position: relative; }
@media (min-width: 1024px) { .fj-s { padding: 110px 56px; } }
.fj-s-tag { font-family: var(--mono); font-size: .62rem; color: var(--neon); letter-spacing: .16em; text-transform: uppercase; margin-bottom: 18px; display: flex; align-items: center; gap: 10px; }
.fj-s-tag::before { content: '//'; color: var(--muted); }
.fj-s-h2 { font-family: var(--syne); font-size: clamp(2rem,4vw,3.8rem); font-weight: 800; line-height: 1.05; letter-spacing: -.03em; color: white; margin-bottom: 18px; }
.fj-s-h2 .neon { color: var(--neon); }
.fj-s-sub { font-size: .95rem; color: var(--muted); max-width: 540px; line-height: 1.8; margin-bottom: 60px; }

.fj-dark-s { background: var(--dark); border-top: 1px solid var(--border-dim); border-bottom: 1px solid var(--border-dim); }
.fj-cap-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 1024px) { .fj-cap-grid { grid-template-columns: repeat(3,1fr); } }
.fj-cap-card { background: var(--panel); border: 1px solid var(--border-dim); border-radius: 4px; padding: 36px 28px 40px; position: relative; overflow: hidden; transition: border-color .3s, background .3s; }
.fj-cap-card:hover { border-color: var(--border); background: var(--card); }
.fj-cap-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--neon), transparent); opacity: 0; transition: opacity .3s; }
.fj-cap-card:hover::before { opacity: .8; }
.fj-cap-icon { font-size: 1.6rem; margin-bottom: 18px; display: block; }
.fj-cap-num { font-family: var(--mono); font-size: .6rem; color: var(--muted); letter-spacing: .12em; margin-bottom: 10px; }
.fj-cap-title { font-family: var(--syne); font-size: 1.05rem; font-weight: 700; color: white; margin-bottom: 10px; line-height: 1.3; }
.fj-cap-desc { font-size: .83rem; color: var(--muted); line-height: 1.8; }
.fj-cap-result { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border-dim); font-family: var(--mono); font-size: .68rem; color: var(--neon); letter-spacing: .05em; }

.fj-intel-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 1024px) { .fj-intel-grid { grid-template-columns: 1fr 1fr; } }
.fj-intel-main { background: var(--panel); border: 1px solid rgba(0,255,106,.18); border-radius: 4px; padding: 36px; position: relative; overflow: hidden; }
@media (min-width: 1024px) { .fj-intel-main { padding: 48px; } }
.fj-intel-main::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--neon), transparent); }
.fj-intel-main::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,106,.04) 0%, transparent 70%); pointer-events: none; }
.fj-intel-col { display: flex; flex-direction: column; gap: 12px; }
.fj-intel-item { background: var(--panel); border: 1px solid var(--border-dim); border-radius: 4px; padding: 28px; position: relative; overflow: hidden; transition: border-color .3s; }
.fj-intel-item:hover { border-color: var(--border); }
.fj-i-icon { font-size: 1.3rem; margin-bottom: 12px; }
.fj-i-title { font-family: var(--syne); font-size: .95rem; font-weight: 700; color: white; margin-bottom: 6px; }
.fj-i-desc { font-size: .8rem; color: var(--muted); line-height: 1.7; }
.fj-big-stat { font-family: var(--syne); font-size: 4rem; font-weight: 800; color: var(--neon); text-shadow: 0 0 32px rgba(0,255,106,.4); letter-spacing: -.04em; line-height: 1; margin: 20px 0 6px; }
.fj-big-stat-label { font-family: var(--mono); font-size: .66rem; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 24px; }
.fj-i-list { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.fj-i-list li { font-size: .8rem; color: var(--silver); opacity: .7; display: flex; align-items: flex-start; gap: 10px; line-height: 1.5; }
.fj-i-list li::before { content: '▹'; color: var(--neon); flex-shrink: 0; }

.fj-evolution-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 1024px) { .fj-evolution-grid { grid-template-columns: repeat(2,1fr); } }
.fj-evo-card { background: var(--panel); border: 1px solid var(--border-dim); border-radius: 4px; padding: 36px; transition: border-color .3s; }
.fj-evo-card:hover { border-color: var(--border); }
.fj-evo-card.wide { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: center; }
@media (min-width: 1024px) { .fj-evo-card.wide { grid-column: span 2; grid-template-columns: 1fr 1fr; gap: 48px; } }
.fj-evo-label { font-family: var(--mono); font-size: .62rem; color: var(--neon); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 12px; opacity: .8; }
.fj-evo-title { font-family: var(--syne); font-size: 1.1rem; font-weight: 700; color: white; margin-bottom: 10px; line-height: 1.3; }
.fj-evo-desc { font-size: .83rem; color: var(--muted); line-height: 1.75; }
.fj-progress-bar { margin-top: 20px; }
.fj-pb-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.fj-pb-key { font-family: var(--mono); font-size: .65rem; color: var(--muted); letter-spacing: .06em; }
.fj-pb-val { font-family: var(--mono); font-size: .65rem; color: var(--neon); }
.fj-pb-track { height: 3px; background: rgba(0,255,106,.08); border-radius: 2px; overflow: hidden; }
.fj-pb-fill { height: 100%; background: var(--neon); border-radius: 2px; box-shadow: 0 0 6px var(--neon); }
.fj-metric-row { display: flex; gap: 24px; margin-top: 24px; flex-wrap: wrap; }
.fj-m-item { display: flex; flex-direction: column; gap: 4px; }
.fj-m-val { font-family: var(--syne); font-size: 1.6rem; font-weight: 800; color: var(--neon); text-shadow: 0 0 16px rgba(0,255,106,.35); letter-spacing: -.02em; }
.fj-m-label { font-family: var(--mono); font-size: .6rem; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; }

.fj-engage-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 1024px) { .fj-engage-grid { grid-template-columns: repeat(3,1fr); } }
.fj-eng-card { background: var(--panel); border: 1px solid var(--border-dim); border-radius: 4px; padding: 32px 28px; position: relative; overflow: hidden; transition: all .3s; }
.fj-eng-card:hover { border-color: var(--border); background: var(--card); }
.fj-eng-icon { font-size: 1.8rem; margin-bottom: 16px; }
.fj-eng-title { font-family: var(--syne); font-size: 1rem; font-weight: 700; color: white; margin-bottom: 8px; line-height: 1.3; }
.fj-eng-desc { font-size: .82rem; color: var(--muted); line-height: 1.75; }
.fj-eng-chip { display: inline-block; font-family: var(--mono); font-size: .6rem; letter-spacing: .08em; text-transform: uppercase; padding: 3px 10px; border: 1px solid var(--border); border-radius: 2px; color: var(--neon); background: var(--neon-glow); margin-top: 14px; }

.fj-scale-wrap { display: grid; grid-template-columns: 1fr; gap: 32px; align-items: start; }
@media (min-width: 1024px) { .fj-scale-wrap { grid-template-columns: 1fr 1.1fr; gap: 64px; } }
.fj-scale-steps { display: flex; flex-direction: column; }
.fj-sc-step { display: grid; grid-template-columns: 40px 1fr; gap: 20px; padding: 26px 0; border-bottom: 1px solid var(--border-dim); }
.fj-sc-step:last-child { border-bottom: none; }
.fj-sc-n { font-family: var(--mono); font-size: .7rem; width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 2px; display: flex; align-items: center; justify-content: center; color: var(--muted); transition: all .25s; flex-shrink: 0; margin-top: 3px; }
.fj-sc-step:hover .fj-sc-n { color: var(--neon); border-color: rgba(0,255,106,.4); box-shadow: 0 0 10px rgba(0,255,106,.15); }
.fj-sc-title { font-family: var(--syne); font-size: .95rem; font-weight: 700; color: white; margin-bottom: 5px; }
.fj-sc-desc { font-size: .82rem; color: var(--muted); line-height: 1.7; }
@media (min-width: 1024px) { .fj-scale-right { position: sticky; top: 110px; } }
.fj-scale-panel { background: var(--panel); border: 1px solid rgba(0,255,106,.15); border-radius: 4px; padding: 36px; position: relative; overflow: hidden; }
.fj-scale-panel::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--neon), transparent); }
.fj-sp-label { font-family: var(--mono); font-size: .62rem; color: var(--neon); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 28px; }
.fj-sp-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border-dim); gap: 12px; }
.fj-sp-row:last-child { border-bottom: none; }
.fj-sp-key { font-size: .82rem; color: var(--silver); opacity: .7; }
.fj-sp-val { font-family: var(--mono); font-size: .78rem; color: var(--neon); font-weight: 500; text-align: right; }
.fj-sp-badge { font-family: var(--mono); font-size: .6rem; background: var(--neon-glow); border: 1px solid var(--border); color: var(--neon); padding: 3px 8px; border-radius: 2px; letter-spacing: .06em; display: inline-block; }

.fj-vs-section { background: var(--dark); border-top: 1px solid var(--border-dim); border-bottom: 1px solid var(--border-dim); }
.fj-vs-wrap { overflow-x: auto; }
.fj-vs-table { width: 100%; min-width: 520px; border-collapse: collapse; border: 1px solid var(--border-dim); border-radius: 4px; overflow: hidden; }
.fj-vs-table th { font-family: var(--mono); font-size: .62rem; letter-spacing: .1em; text-transform: uppercase; padding: 14px 12px; background: var(--panel); border-bottom: 1px solid var(--border-dim); text-align: left; color: var(--muted); }
.fj-vs-table th.hl { color: var(--neon); background: var(--card); border-left: 1px solid rgba(0,255,106,.15); border-right: 1px solid rgba(0,255,106,.15); }
.fj-vs-table td { padding: 14px 12px; border-bottom: 1px solid var(--border-dim); font-size: .78rem; color: var(--muted); vertical-align: middle; }
.fj-vs-table tr:last-child td { border-bottom: none; }
.fj-vs-table td.hl { background: rgba(0,255,106,.03); border-left: 1px solid rgba(0,255,106,.1); border-right: 1px solid rgba(0,255,106,.1); color: var(--silver); }
.fj-vs-table td.feat { color: var(--silver); font-weight: 500; }
.fj-yes { color: var(--neon); font-family: var(--mono); font-size: .72rem; }
.fj-no { color: #FF5F57; font-family: var(--mono); font-size: .72rem; }
.fj-partial { color: #FEBC2E; font-family: var(--mono); font-size: .72rem; }

.fj-manifesto { padding: 80px 24px; text-align: center; position: relative; overflow: hidden; }
@media (min-width: 1024px) { .fj-manifesto { padding: 100px 56px; } }
.fj-manifesto::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,255,106,.05) 0%, transparent 70%); pointer-events: none; }
.fj-mq { font-family: var(--syne); font-size: clamp(1.6rem,4vw,3.6rem); font-weight: 800; line-height: 1.12; letter-spacing: -.03em; color: white; max-width: 900px; margin: 0 auto 24px; position: relative; z-index: 1; }
.fj-mq .neon { color: var(--neon); text-shadow: 0 0 40px rgba(0,255,106,.4); }
.fj-ms { font-family: var(--mono); font-size: .78rem; color: var(--muted); letter-spacing: .06em; position: relative; z-index: 1; max-width: 480px; margin: 0 auto; line-height: 1.9; }

.fj-final { padding: 100px 24px; text-align: center; position: relative; overflow: hidden; border-top: 1px solid var(--border-dim); }
@media (min-width: 1024px) { .fj-final { padding: 140px 56px; } }
.fj-final::before { content: ''; position: absolute; top: -40%; left: 50%; transform: translateX(-50%); width: 700px; height: 700px; background: radial-gradient(circle, rgba(0,255,106,.06) 0%, transparent 70%); pointer-events: none; }
.fj-f-h2 { font-family: var(--syne); font-size: clamp(2rem,5.5vw,5.5rem); font-weight: 800; line-height: .98; letter-spacing: -.04em; color: white; max-width: 820px; margin: 0 auto 24px; position: relative; z-index: 1; }
.fj-f-h2 .neon { color: var(--neon); text-shadow: 0 0 48px rgba(0,255,106,.5); }
.fj-f-sub { font-family: var(--mono); font-size: .78rem; color: var(--muted); letter-spacing: .06em; max-width: 400px; margin: 0 auto 48px; line-height: 1.9; position: relative; z-index: 1; }
.fj-f-acts { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; position: relative; z-index: 1; }
.fj-f-note { margin-top: 24px; font-family: var(--mono); font-size: .62rem; color: var(--muted); letter-spacing: .08em; display: flex; justify-content: center; gap: 16px; position: relative; z-index: 1; flex-wrap: wrap; }
.fj-f-note span::before { content: '✓ '; color: var(--neon); }

.fj-footer { background: var(--dark); border-top: 1px solid var(--border-dim); padding: 48px 24px 32px; position: relative; z-index: 1; }
@media (min-width: 1024px) { .fj-footer { padding: 60px 56px 36px; } }
.fj-ft { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 48px; padding-bottom: 48px; border-bottom: 1px solid var(--border-dim); }
@media (min-width: 1024px) { .fj-ft { grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 48px; } }
.fj-fl { font-family: var(--syne); font-size: 1rem; font-weight: 800; color: white; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.fj-fl-dot { width: 6px; height: 6px; background: var(--neon); border-radius: 50%; box-shadow: 0 0 6px var(--neon); }
.fj-fd { font-size: .78rem; color: var(--muted); line-height: 1.8; max-width: 210px; }
.fj-fc-t { font-family: var(--mono); font-size: .6rem; color: var(--neon); letter-spacing: .14em; text-transform: uppercase; margin-bottom: 18px; }
.fj-fc-l { list-style: none; display: flex; flex-direction: column; gap: 11px; }
.fj-fc-l a { font-size: .78rem; color: var(--muted); text-decoration: none; transition: color .2s; }
.fj-fc-l a:hover { color: var(--neon); }
.fj-fb { display: flex; flex-direction: column; gap: 16px; justify-content: space-between; align-items: flex-start; font-family: var(--mono); font-size: .62rem; color: var(--muted); letter-spacing: .05em; }
@media (min-width: 1024px) { .fj-fb { flex-direction: row; align-items: center; } }
.fj-fb-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.fj-fb-badge { border: 1px solid var(--border-dim); color: var(--muted); font-size: .58rem; letter-spacing: .08em; padding: 4px 9px; border-radius: 2px; }

.fj-reveal { opacity: 0; transform: translateY(22px); transition: opacity .8s ease, transform .8s ease; }
.fj-reveal.visible { opacity: 1; transform: translateY(0); }
`;

function LandingPage() {
  useEffect(() => {
    // Carrega fontes
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(fontLink);

    // Cursor custom (apenas desktop)
    const cur = document.getElementById("fj-cur");
    const curR = document.getElementById("fj-curR");
    let mx = 0, my = 0, rx = 0, ry = 0, raf = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const anim = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      if (cur) { cur.style.left = mx + "px"; cur.style.top = my + "px"; }
      if (curR) { curR.style.left = rx + "px"; curR.style.top = ry + "px"; }
      raf = requestAnimationFrame(anim);
    };
    document.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(anim);

    const enter = () => { if (curR) { curR.style.width = "44px"; curR.style.height = "44px"; curR.style.borderColor = "rgba(0,255,106,.7)"; } };
    const leave = () => { if (curR) { curR.style.width = "28px"; curR.style.height = "28px"; curR.style.borderColor = "rgba(0,255,106,.35)"; } };
    const interactive = document.querySelectorAll(".fj-landing a, .fj-landing button");
    interactive.forEach((el) => { el.addEventListener("mouseenter", enter); el.addEventListener("mouseleave", leave); });

    // Reveal on scroll
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.1 });
    document.querySelectorAll(".fj-reveal").forEach((el) => obs.observe(el));

    // Nav scroll shrink
    const nav = document.querySelector(".fj-nav") as HTMLElement | null;
    const onScroll = () => {
      if (!nav) return;
      const small = window.scrollY > 40;
      nav.style.paddingTop = small ? "12px" : "18px";
      nav.style.paddingBottom = small ? "12px" : "18px";
    };
    window.addEventListener("scroll", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      interactive.forEach((el) => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); });
      obs.disconnect();
      fontLink.remove();
    };
  }, []);

  return (
    <div className="fj-landing">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fj-cursor" id="fj-cur" />
      <div className="fj-cursor-ring" id="fj-curR" />
      <div className="fj-scanlines" />
      <div className="fj-grid-bg" />

      <nav className="fj-nav">
        <a href="/" className="fj-nav-logo" style={{ textDecoration: "none" }}>
          <LogoOrbital sizePx={36} effect="orbit" />
          <span style={{ background: "var(--silver-metal)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>FITJOURNEY</span>
        </a>
        <div className="fj-nav-links">
          <a href="#capacidades">O que você faz</a>
          <a href="#inteligencia">Inteligência</a>
          <a href="#engajamento">Engajamento</a>
          <a href="#vs">Comparativo</a>
          <a href="/signup/nutritionist" className="fj-nav-cta">Começar grátis →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="fj-hero">
        <div className="fj-hero-radial" />
        <div className="fj-hero-tag">Para nutricionistas · Plataforma clínica</div>
        <h1 className="fj-hero-h1 fj-reveal">
          A evolução da<br />
          <span className="neon">Nutrição Clínica</span><br />
          <span className="dim">Inteligente.</span>
        </h1>
        <p className="fj-hero-sub fj-reveal">
          Não se trata de montar dietas mais rápido.<br />
          Trata-se de <strong>conduzir o metabolismo humano com precisão</strong> — com cada decisão registrada, auditável e reproduzível. Você constrói protocolos. A plataforma faz o resto.
        </p>
        <div className="fj-hero-ctas fj-reveal">
          <a href="/signup/nutritionist" className="fj-btn-neon">Começar 3 dias grátis →</a>
          <a href="#capacidades" className="fj-btn-ghost">▶ Ver o que você pode fazer</a>
        </div>
        <div className="fj-hero-pillars fj-reveal">
          <div className="fj-h-pillar">
            <div className="fj-h-p-num">// 01</div>
            <div className="fj-h-p-title">Planos 100% personalizados</div>
            <div className="fj-h-p-desc">Metabolismo, rotina e objetivos do paciente — em um único protocolo clínico.</div>
          </div>
          <div className="fj-h-pillar">
            <div className="fj-h-p-num">// 02</div>
            <div className="fj-h-p-title">Acompanhamento diário automatizado</div>
            <div className="fj-h-p-desc">Check-ins, metas e evolução sem precisar cobrar o paciente manualmente.</div>
          </div>
          <div className="fj-h-pillar">
            <div className="fj-h-p-num">// 03</div>
            <div className="fj-h-p-title">Inteligência em tempo real</div>
            <div className="fj-h-p-desc">A plataforma identifica estagnação, projeta tendências e sugere ajustes.</div>
          </div>
          <div className="fj-h-pillar">
            <div className="fj-h-p-num">// 04</div>
            <div className="fj-h-p-title">Resultados duradouros</div>
            <div className="fj-h-p-desc">Construção de hábitos, constância e sem efeito rebote. Para a vida toda.</div>
          </div>
        </div>
      </section>

      {/* CAPACIDADES */}
      <section className="fj-s fj-dark-s" id="capacidades">
        <div className="fj-s-tag">O que você faz com o FitJourney</div>
        <h2 className="fj-s-h2 fj-reveal">Muito além de um<br /><span className="neon">plano alimentar.</span></h2>
        <p className="fj-s-sub fj-reveal">Com análise evolutiva avançada, projeção de resultados e simulação corporal futura, o sistema transforma dados em decisões clínicas estratégicas.</p>
        <div className="fj-cap-grid fj-reveal">
          {[
            { i: "🧬", n: "01", t: "Você constrói planos baseados no metabolismo real", d: "Análise completa do metabolismo do paciente — não estimativas genéricas. Você prescreve considerando TMB, TDEE, composição corporal e resposta fisiológica individual.", r: "→ Plano 100% personalizado por paciente" },
            { i: "🎯", n: "02", t: "Você alinha rotina, objetivos e estratégia em um único protocolo", d: "Consideração da rotina diária e alinhamento com os objetivos pessoais de cada paciente. Um protocolo que funciona na vida real — não apenas no consultório.", r: "→ Adesão que vai além da primeira semana" },
            { i: "📡", n: "03", t: "Você acompanha cada paciente todos os dias — sem estar presente", d: "Check-ins diários personalizados, monitoramento contínuo do progresso e presença digital 24/7. Seu paciente nunca está sozinho.", r: "→ Vínculo clínico além da consulta" },
            { i: "📈", n: "04", t: "Você vê o corpo do paciente evoluindo semana a semana", d: "Gráficos de progresso corporal, medições precisas, marcos de evolução visíveis e projeção de metas futuras.", r: "→ Decisão clínica baseada em evidência" },
            { i: "🔄", n: "05", t: "Você ajusta o plano quando a vida do paciente muda", d: "Se algo mudar na rotina, trabalho ou objetivo do paciente, o protocolo se adapta com você. Ajustes baseados em progresso real — aprovados por você antes de publicar.", r: "→ Protocolo vivo, não estático" },
            { i: "🏆", n: "06", t: "Você celebra cada vitória — e o paciente sente isso", d: "Notificações positivas, celebração de conquistas, reconhecimento de marcos e comunidade que celebra junto.", r: "→ Adesão constante. Menos abandono." },
          ].map((c) => (
            <div className="fj-cap-card" key={c.n}>
              <span className="fj-cap-icon">{c.i}</span>
              <div className="fj-cap-num">// {c.n}</div>
              <div className="fj-cap-title">{c.t}</div>
              <p className="fj-cap-desc">{c.d}</p>
              <div className="fj-cap-result">{c.r}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="fj-manifesto">
        <div className="fj-mq fj-reveal">Não buscamos mudanças rápidas.<br />Buscamos <span className="neon">mudanças duradouras.</span></div>
        <p className="fj-ms fj-reveal">Construção de hábitos saudáveis, foco em constância, sem efeito rebote. Transformação para a vida toda — e você como protagonista disso.</p>
      </section>

      {/* INTELIGÊNCIA */}
      <section className="fj-s" id="inteligencia">
        <div className="fj-s-tag">Inteligência clínica</div>
        <h2 className="fj-s-h2 fj-reveal">Inteligência que<br /><span className="neon">acompanha o metabolismo</span><br />em tempo real.</h2>
        <p className="fj-s-sub fj-reveal">Como se existisse uma inteligência clínica monitorando cada etapa da jornada do paciente — e reportando direto para você.</p>

        <div className="fj-intel-grid fj-reveal">
          <div className="fj-intel-main">
            <div className="fj-s-tag" style={{ marginBottom: 12 }}>Motor preditivo</div>
            <div style={{ fontFamily: "var(--syne)", fontSize: "1.4rem", fontWeight: 800, color: "white", marginBottom: 10, lineHeight: 1.2, position: "relative", zIndex: 1 }}>Um ecossistema digital de inteligência nutricional</div>
            <p style={{ fontSize: ".85rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: 20, position: "relative", zIndex: 1 }}>Integração entre dados clínicos, comportamento alimentar, evolução corporal e algoritmos preditivos — criando protocolos nutricionais vivos.</p>
            <ul className="fj-i-list" style={{ position: "relative", zIndex: 1 }}>
              <li>Análise de padrões de resposta fisiológica</li>
              <li>Identificação de riscos de estagnação antes que aconteçam</li>
              <li>Previsão de tendências de evolução corporal</li>
              <li>Ajuste automático de estratégias nutricionais</li>
              <li>Projeção realista do corpo futuro do paciente</li>
              <li>Inspiração visual clara para manter a motivação</li>
            </ul>
            <div className="fj-big-stat" style={{ position: "relative", zIndex: 1 }}>3×</div>
            <div className="fj-big-stat-label" style={{ position: "relative", zIndex: 1 }}>Mais adesão com acompanhamento inteligente</div>
          </div>
          <div className="fj-intel-col">
            <div className="fj-intel-item">
              <div className="fj-i-icon">⚡</div>
              <div className="fj-i-title">Nutrição orientada por dados</div>
              <p className="fj-i-desc">Resultados orientados por inteligência. Uma nova geração de acompanhamento nutricional onde tecnologia, ciência e prática clínica trabalham juntas.</p>
            </div>
            <div className="fj-intel-item">
              <div className="fj-i-icon">🔮</div>
              <div className="fj-i-title">Continue seguindo o protocolo. Seu futuro já está sendo construído.</div>
              <p className="fj-i-desc">Projeção realista, metas tangíveis e visíveis. O paciente sabe para onde está indo — e isso mantém o compromisso.</p>
            </div>
            <div className="fj-intel-item">
              <div className="fj-i-icon">🎯</div>
              <div className="fj-i-title">Transformação não é só estética. É qualidade de vida.</div>
              <p className="fj-i-desc">Mais energia durante o dia, melhor disposição geral, saúde otimizada, bem-estar emocional. Você entrega resultado que vai além do peso na balança.</p>
            </div>
          </div>
        </div>
      </section>

      {/* EVOLUÇÃO */}
      <section className="fj-s fj-dark-s">
        <div className="fj-s-tag">Evolução visível</div>
        <h2 className="fj-s-h2 fj-reveal">Veja o corpo do seu paciente<br /><span className="neon">evoluindo semana a semana.</span></h2>
        <p className="fj-s-sub fj-reveal">Gráficos de progresso, medições precisas, marcos visíveis e projeção futura. Dados que tornam a evolução concreta.</p>

        <div className="fj-evolution-grid fj-reveal">
          <div className="fj-evo-card wide">
            <div>
              <div className="fj-evo-label">Progresso corporal</div>
              <div className="fj-evo-title">Veja antes. Veja depois. Construa o futuro.</div>
              <p className="fj-evo-desc">O FitJourney registra cada etapa da evolução com precisão. Medições semanais, composição corporal, marcos conquistados e projeção realista do corpo futuro do paciente.</p>
              <div className="fj-metric-row">
                <div className="fj-m-item"><div className="fj-m-val">+10%</div><div className="fj-m-label">Massa muscular</div></div>
                <div className="fj-m-item"><div className="fj-m-val">−3%</div><div className="fj-m-label">Gordura corporal</div></div>
                <div className="fj-m-item"><div className="fj-m-val">Sem rebote</div><div className="fj-m-label">Sustentável</div></div>
              </div>
            </div>
            <div>
              <div className="fj-evo-label">Indicadores semanais</div>
              {[
                { k: "Adesão ao plano", v: 94 },
                { k: "Metas semanais atingidas", v: 88 },
                { k: "Evolução corporal esperada", v: 100 },
                { k: "Check-ins diários realizados", v: 91 },
              ].map((p, idx) => (
                <div className="fj-progress-bar" key={p.k} style={{ marginTop: idx === 0 ? 20 : 14 }}>
                  <div className="fj-pb-row"><span className="fj-pb-key">{p.k}</span><span className="fj-pb-val">{p.v}%</span></div>
                  <div className="fj-pb-track"><div className="fj-pb-fill" style={{ width: `${p.v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="fj-evo-card">
            <div className="fj-evo-label">Resultados sustentáveis</div>
            <div className="fj-evo-title">Não buscamos mudanças rápidas. Buscamos mudanças duradouras.</div>
            <p className="fj-evo-desc">Construção de hábitos saudáveis, foco em constância, sem efeito rebote. Transformação para a vida toda.</p>
          </div>
          <div className="fj-evo-card">
            <div className="fj-evo-label">Qualidade de vida</div>
            <div className="fj-evo-title">Transformação não é só estética.</div>
            <p className="fj-evo-desc">Mais energia, melhor disposição, saúde otimizada e bem-estar emocional. Resultados que o paciente sente — e te recomenda por isso.</p>
          </div>
        </div>
      </section>

      {/* ENGAJAMENTO */}
      <section className="fj-s" id="engajamento">
        <div className="fj-s-tag">Engajamento do paciente</div>
        <h2 className="fj-s-h2 fj-reveal">Você nunca mais vai<br /><span className="neon">cobrar adesão manualmente.</span></h2>
        <p className="fj-s-sub fj-reveal">O FitJourney mantém o paciente engajado, motivado e no caminho certo — enquanto você foca em atender e crescer.</p>

        <div className="fj-engage-grid fj-reveal">
          {[
            { i: "📅", t: "Check-ins diários personalizados", d: "Seu paciente reporta o dia, registra refeições e sinaliza dificuldades — automaticamente, todo dia, sem precisar de você no WhatsApp.", c: "Monitoramento 24/7" },
            { i: "🏅", t: "Cada pequena vitória conta", d: "Notificações positivas, celebração de cada conquista e reconhecimento de marcos. Motivação constante, sem esforço seu.", c: "Gamificação clínica" },
            { i: "📊", t: "Progresso visível para o paciente", d: "Gráficos de evolução, marcos conquistados, projeção do corpo futuro. O paciente vê com clareza para onde está indo.", c: "Evolução visual" },
            { i: "🔔", t: "Suporte inteligente sempre disponível", d: "Presença digital 24/7. Quando o paciente tem dúvida às 22h, o sistema responde. Quando você quiser, você entra.", c: "Presença digital" },
            { i: "🎯", t: "Metas que fazem sentido para a vida real", d: "Hidratação, sono, passos, treino — metas claras com acompanhamento visual. O paciente sabe o que fazer hoje.", c: "Metas semanais" },
            { i: "💬", t: "Direção, estratégia e acompanhamento", d: "Direção clara, estratégia inteligente, tecnologia ao seu favor e controle total. Você no centro, o sistema nos bastidores.", c: "Controle total" },
          ].map((e) => (
            <div className="fj-eng-card" key={e.t}>
              <div className="fj-eng-icon">{e.i}</div>
              <div className="fj-eng-title">{e.t}</div>
              <p className="fj-eng-desc">{e.d}</p>
              <span className="fj-eng-chip">{e.c}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ESCALABILIDADE */}
      <section className="fj-s fj-dark-s">
        <div className="fj-s-tag">Performance e escalabilidade</div>
        <h2 className="fj-s-h2 fj-reveal">Mais ciência. Mais estratégia.<br /><span className="neon">Mais resultado real.</span></h2>
        <p className="fj-s-sub fj-reveal">Performance clínica e escalabilidade profissional — para você atender mais, melhor, sem aumentar a equipe.</p>

        <div className="fj-scale-wrap fj-reveal">
          <div className="fj-scale-steps">
            {[
              { n: "01", t: "Redução drástica do tempo operacional", d: "Protocolos clínicos reutilizáveis, templates inteligentes e automações que eliminam retrabalho. O que levava horas vira minutos." },
              { n: "02", t: "Protocolos personalizados em escala", d: "Você cria uma vez, adapta em segundos. Cada paciente recebe um protocolo construído para o seu metabolismo — mesmo com 100 pacientes na carteira." },
              { n: "03", t: "Priorização automática de pacientes", d: "O sistema identifica quem precisa de atenção agora, quem está estagnado e quem está no caminho certo. Você age onde importa." },
              { n: "04", t: "Identificação de casos críticos em tempo real", d: "Alertas automáticos quando um paciente desvia do protocolo ou perde check-ins consecutivos. Intervenção antes do abandono." },
              { n: "05", t: "Você escala sem contratar", d: "O FitJourney substitui assistente, planilhista e suporte de WhatsApp. Você atende mais pacientes com o mesmo tempo — e entrega mais qualidade." },
            ].map((s) => (
              <div className="fj-sc-step" key={s.n}>
                <div className="fj-sc-n">{s.n}</div>
                <div>
                  <div className="fj-sc-title">{s.t}</div>
                  <p className="fj-sc-desc">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="fj-scale-right">
            <div className="fj-scale-panel">
              <div className="fj-sp-label">// Painel de performance</div>
              <div className="fj-sp-row"><span className="fj-sp-key">Pacientes ativos</span><span className="fj-sp-val">143 <span style={{ fontSize: ".6rem", color: "var(--muted)" }}>↑ de 80</span></span></div>
              <div className="fj-sp-row"><span className="fj-sp-key">Tempo por plano</span><span className="fj-sp-val">12 min <span style={{ fontSize: ".6rem", color: "var(--muted)" }}>↓ de 1h</span></span></div>
              <div className="fj-sp-row"><span className="fj-sp-key">Adesão média</span><span className="fj-sp-val"><span className="fj-sp-badge">+60%</span></span></div>
              <div className="fj-sp-row"><span className="fj-sp-key">Casos em risco</span><span className="fj-sp-val">Automático</span></div>
              <div className="fj-sp-row"><span className="fj-sp-key">Retrabalho</span><span className="fj-sp-val" style={{ color: "#FF5F57" }}>Eliminado</span></div>
              <div className="fj-sp-row"><span className="fj-sp-key">Equipe adicional</span><span className="fj-sp-val" style={{ color: "#FF5F57" }}>Desnecessária</span></div>
              <div className="fj-sp-row"><span className="fj-sp-key">Resultados sustentáveis</span><span className="fj-sp-val"><span className="fj-sp-badge">✓ Sim</span></span></div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="fj-s fj-vs-section" id="vs">
        <div className="fj-s-tag">Comparativo</div>
        <h2 className="fj-s-h2 fj-reveal">FitJourney vs<br /><span className="neon">outras soluções.</span></h2>
        <p className="fj-s-sub fj-reveal">O que diferencia uma plataforma de nutrição clínica inteligente de um software de dieta comum.</p>

        <div className="fj-reveal fj-vs-wrap">
          <table className="fj-vs-table">
            <thead>
              <tr>
                <th>Funcionalidade</th>
                <th className="hl">FitJourney</th>
                <th>Plataformas comuns</th>
                <th>Planilhas / PDF</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Plano personalizado por metabolismo real", "✓ Completo", "~ Parcial", "✕ Manual", "yes", "partial", "no"],
                ["Protocolo nutricional vivo (ajusta com o paciente)", "✓ Automático", "✕ Não tem", "✕ Não tem", "yes", "no", "no"],
                ["Inteligência preditiva de estagnação", "✓ Tempo real", "✕ Não tem", "✕ Não tem", "yes", "no", "no"],
                ["Check-ins diários automatizados", "✓ Sim", "~ Limitado", "✕ WhatsApp manual", "yes", "partial", "no"],
                ["Evolução corporal com projeção futura", "✓ Visual + dados", "~ Básico", "✕ Não tem", "yes", "partial", "no"],
                ["Gamificação clínica", "✓ Completo", "✕ Não tem", "✕ Não tem", "yes", "no", "no"],
                ["Priorização automática de casos críticos", "✓ Alertas", "✕ Não tem", "✕ Não tem", "yes", "no", "no"],
                ["Resultados sustentáveis", "✓ Metodologia", "~ Depende", "~ Depende", "yes", "partial", "partial"],
                ["Escala sem contratar equipe", "✓ Sim", "~ Limitado", "✕ Impossível", "yes", "partial", "no"],
              ].map((r) => (
                <tr key={r[0]}>
                  <td className="feat">{r[0]}</td>
                  <td className="hl"><span className={`fj-${r[4]}`}>{r[1]}</span></td>
                  <td><span className={`fj-${r[5]}`}>{r[2]}</span></td>
                  <td><span className={`fj-${r[6]}`}>{r[3]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MANIFESTO FINAL */}
      <section className="fj-manifesto">
        <div className="fj-mq fj-reveal">
          <span className="neon">Nutrição orientada por dados.</span><br />
          Resultados orientados por inteligência.
        </div>
        <p className="fj-ms fj-reveal">Uma nova geração de acompanhamento nutricional, onde tecnologia, ciência e prática clínica trabalham juntas para acelerar transformações corporais de forma segura e sustentável — com você no controle.</p>
      </section>

      {/* CTA FINAL */}
      <section className="fj-final">
        <h2 className="fj-f-h2 fj-reveal">
          Mais ciência.<br />Mais estratégia.<br /><span className="neon">Mais resultado real.</span>
        </h2>
        <p className="fj-f-sub fj-reveal">3 dias grátis. Sem cartão de crédito.<br />Acesso imediato ao sistema completo.</p>
        <div className="fj-f-acts fj-reveal">
          <a href="/signup/nutritionist" className="fj-btn-neon" style={{ fontSize: ".82rem", padding: "20px 44px" }}>Criar minha conta agora →</a>
          <a href="#capacidades" className="fj-btn-ghost">Explorar a plataforma</a>
        </div>
        <div className="fj-f-note fj-reveal">
          <span>Sem cartão de crédito</span>
          <span>Acesso imediato</span>
          <span>Pacientes por convite</span>
          <span>LGPD compliant</span>
          <span>99.9% Uptime</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="fj-footer">
        <div className="fj-ft">
          <div>
            <div className="fj-fl"><div className="fj-fl-dot" />FITJOURNEY</div>
            <p className="fj-fd">A evolução da Nutrição Clínica Inteligente. Para nutricionistas que levam a sério a própria reputação.</p>
          </div>
          <div>
            <div className="fj-fc-t">// Plataforma</div>
            <ul className="fj-fc-l">
              <li><a href="#capacidades">O que você faz</a></li>
              <li><a href="#inteligencia">Inteligência clínica</a></li>
              <li><a href="#engajamento">Engajamento</a></li>
              <li><a href="#vs">Comparativo</a></li>
            </ul>
          </div>
          <div>
            <div className="fj-fc-t">// Acesso</div>
            <ul className="fj-fc-l">
              <li><a href="/app">Entrar no painel</a></li>
              <li><a href="/signup/nutritionist">Criar conta</a></li>
              <li><a href="/suporte">Suporte</a></li>
            </ul>
          </div>
          <div>
            <div className="fj-fc-t">// Legal</div>
            <ul className="fj-fc-l">
              <li><a href="/termos">Termos de uso</a></li>
              <li><a href="/privacidade">Privacidade</a></li>
              <li><a href="mailto:sistemafitjourney.suporte@gmail.com">sistemafitjourney.suporte@gmail.com</a></li>
            </ul>
          </div>
        </div>
        <div className="fj-fb">
          <div>© 2026 FitJourney — Feito com precisão clínica no Brasil.</div>
          <div className="fj-fb-badges">
            <span className="fj-fb-badge">LGPD</span>
            <span className="fj-fb-badge">Criptografado</span>
            <span className="fj-fb-badge">99.9% Uptime</span>
            <span className="fj-fb-badge">IA Clínica</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
