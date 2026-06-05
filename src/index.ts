import SCRIPT_CODE from "./inline";
// src/index.ts — skills-sub Worker 入口 + 前端 SPA

import { handleApi } from "./api";
import type { Env } from "./types";

// Portal HTML（纯静态 HTML，JS 用 var 而非 const/template literals）
const PORTAL_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Skills Portal | AI Skills 导航库</title>
  <meta name="description" content="Claude Code Skills 导航库 - 搜索、浏览、复制 AI Skills">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%236366f1'>S</text></svg>">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-card: #16161f;
      --border: #2a2a3a;
      --text-primary: #e8e8f0;
      --text-secondary: #8888a0;
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.15);
      --radius: 16px;
      --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      --success: #22c55e;
    }

    html { scroll-behavior: smooth; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.6;
    }

    .bg-glow {
      position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
      width: 800px; height: 600px;
      background: radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%);
      pointer-events: none; z-index: 0;
    }
    .bg-grid {
      position: fixed; top: 0; right: 0; bottom: 0; left: 0;
      background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
      background-size: 60px 60px; pointer-events: none; z-index: 0;
    }

    /* ── 首页 ── */
    .hero { padding: 80px 0 40px; text-align: center; }
    .hero-icon {
      width: 96px; height: 96px; border-radius: 50%; border: 3px solid var(--accent);
      box-shadow: 0 0 30px var(--accent-glow); margin-bottom: 20px;
      display: flex; align-items: center; justify-content: center; font-size: 48px;
      transition: var(--transition);
    }
    .hero-icon:hover { transform: scale(1.05); box-shadow: 0 0 50px var(--accent-glow); }
    .hero h1 {
      font-size: 2.5rem; font-weight: 800; letter-spacing: -0.02em;
      background: linear-gradient(135deg, #e8e8f0 0%, #6366f1 100%);
      -webkit-background-clip: text; background-clip: text;
      -webkit-text-fill-color: transparent; color: transparent;
      margin-bottom: 8px;
    }
    .hero p { color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 24px; }

    .stats { display: flex; justify-content: center; gap: 40px; padding: 24px 0; margin-bottom: 16px; }
    .stat-item { text-align: center; }
    .stat-value { font-size: 1.8rem; font-weight: 800; color: var(--accent); }
    .stat-label { font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; }

    .toolbar { display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; align-items: center; }
    .search-box { flex: 1; min-width: 240px; position: relative; }
    .search-box input {
      width: 100%; padding: 12px 16px 12px 42px; border-radius: 12px;
      border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary);
      font-size: 0.9rem; transition: var(--transition);
    }
    .search-box input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 20px var(--accent-glow); }
    .search-box::before { content: '🔍'; position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; pointer-events: none; }

    .filter-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .filter-chip { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); font-size: 0.85rem; cursor: pointer; transition: var(--transition); }
    .filter-chip:hover { border-color: var(--accent); color: var(--accent); }
    .filter-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }

    .projects-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 24px; }

    .project-card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 24px; display: flex; flex-direction: column; gap: 12px;
      transition: var(--transition); position: relative; overflow: hidden; cursor: pointer;
    }
    .project-card::before {
      content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0;
      background: linear-gradient(135deg, var(--accent-glow) 0%, transparent 60%);
      opacity: 0; transition: var(--transition);
    }
    .project-card:hover {
      transform: translateY(-4px); border-color: var(--accent);
      box-shadow: 0 8px 40px rgba(0,0,0,0.3), 0 0 30px var(--accent-glow);
    }
    .project-card:hover::before { opacity: 1; }
    .project-card.expanded { border-color: var(--accent); box-shadow: 0 8px 40px rgba(0,0,0,0.3), 0 0 30px var(--accent-glow); }
    .project-card.expanded::before { opacity: 1; }
    .project-card.expanded:hover { transform: none; }

    .card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; position: relative; z-index: 1; }
    .card-icon {
      width: 40px; height: 40px; border-radius: 10px; background: var(--bg-secondary);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .card-icon svg { width: 20px; height: 20px; }
    .card-title-group { flex: 1; min-width: 0; }
    .card-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-author-badge {
      display: inline-block; font-size: 0.65rem; padding: 2px 8px; border-radius: 6px;
      background: rgba(99,102,241,0.15); color: var(--accent); font-weight: 600;
      letter-spacing: 0.05em; vertical-align: middle; margin-left: 8px;
    }
    .card-author-badge.agent { background: rgba(34,197,94,0.12); color: var(--success); }
    .card-desc {
      font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;
      position: relative; z-index: 1;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .card-tag { font-size: 0.7rem; padding: 2px 8px; border-radius: 6px; background: rgba(99,102,241,0.15); color: var(--accent); }
    .card-expand-hint {
      font-size: 0.7rem; color: var(--text-secondary); opacity: 0.6;
      transition: var(--transition); margin-left: auto; flex-shrink: 0; margin-top: 4px;
    }
    .project-card:hover .card-expand-hint { opacity: 1; color: var(--accent); }
    .project-card.expanded .card-expand-hint { display: none; }
    .card-footer {
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
      position: relative; z-index: 1; margin-top: auto;
    }
    .card-lang { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-secondary); }
    .lang-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .card-stat { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--text-secondary); }
    .card-stat svg { width: 14px; height: 14px; fill: currentColor; }
    .card-date { margin-left: auto; font-size: 0.75rem; color: var(--text-secondary); }

    .card-detail {
      max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0; position: relative; z-index: 1;
      border-top: 1px solid transparent; margin-top: 0;
    }
    .project-card.expanded .card-detail {
      max-height: 500px; opacity: 1;
      border-top-color: var(--border); margin-top: 12px; padding-top: 12px;
    }
    .detail-prompt {
      background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px;
      padding: 12px 14px; font-size: 0.75rem; color: var(--text-secondary);
      line-height: 1.5; margin-bottom: 12px; font-family: 'Monaco', 'Courier New', monospace;
      white-space: pre-wrap; word-break: break-all; max-height: 120px; overflow-y: auto;
    }
    .detail-prompt::-webkit-scrollbar { width: 4px; }
    .detail-prompt::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
    .detail-actions { display: flex; gap: 8px; }
    .detail-meta { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
    .detail-meta-row { padding: 3px 8px; border-radius: 6px; background: var(--bg-secondary); border: 1px solid var(--border); }
    .detail-btn {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
      border-radius: 10px; border: 1px solid var(--border); background: var(--bg-secondary);
      color: var(--text-primary); font-size: 0.78rem; cursor: pointer;
      transition: var(--transition); font-weight: 500; text-decoration: none;
    }
    .detail-btn:hover { border-color: var(--accent); background: var(--accent); color: #fff; }
    .detail-btn.copy-btn { border-color: var(--success); color: var(--success); }
    .detail-btn.copy-btn:hover { background: var(--success); color: #fff; border-color: var(--success); }
    .detail-btn.copied { background: var(--success); color: #fff; border-color: var(--success); }

    .project-card { opacity: 0; transform: translateY(20px); animation: fadeInUp 0.5s ease forwards; }
    @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }

    .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary); }
    .empty-state p { font-size: 1rem; }

    footer { text-align: center; padding: 40px 0; color: var(--text-secondary); font-size: 0.8rem; position: relative; z-index: 1; }

    @media (max-width: 1024px) { .projects-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .hero h1 { font-size: 1.8rem; }
      .hero { padding: 48px 0 24px; }
      .projects-grid { grid-template-columns: 1fr; }
      .stats { gap: 24px; }
      .stat-value { font-size: 1.4rem; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  /* topbar */
  .topbar{position:sticky;top:0;z-index:100;background:rgba(10,10,15,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:12px 24px;display:flex;align-items:center;gap:16px;}
  .topbar .logo{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--accent);cursor:pointer;display:inline-flex;align-items:center;}
  .topbar .logo svg{margin-right:8px;flex-shrink:0;}
  .topbar .logo span{color:var(--text-primary);font-weight:400;font-size:14px;margin-left:8px;}
  .topbar-right{margin-left:auto;display:flex;align-items:center;gap:12px;}
  .btn{padding:8px 16px;border-radius:10px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .2s;display:inline-flex;align-items:center;gap:6px;}
  .btn-p{background:var(--accent);color:#000;box-shadow:0 2px 10px var(--accent-glow);}
  .btn-p:hover{filter:brightness(1.1);transform:translateY(-1px);}
  .btn-s{background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);}
  .btn-s:hover{border-color:var(--accent);}
  .btn-d{background:transparent;border:1px solid #ff4f6b;color:#ff4f6b;}
  .btn-d:hover{background:rgba(255,79,107,.1);}
  .page{max-width:900px;margin:0 auto;padding:24px 20px 80px;}

  /* SPA page styles (publish/form/guide/detail) */
  input,textarea{width:100%;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:13px;padding:10px 12px;outline:none;transition:border .2s;box-sizing:border-box;}
  input:focus,textarea:focus{border-color:var(--accent);}
  textarea{min-height:200px;resize:vertical;font-size:12px;line-height:1.6;}
  label{font-size:12px;color:var(--text-secondary);font-weight:600;margin-bottom:4px;display:block;}
  .section-title{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-secondary);margin-bottom:14px;}
  .form-row{margin-bottom:14px;}
  .search-bar{display:flex;gap:10px;margin-bottom:14px;}
  .search-box svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-secondary);pointer-events:none;}
  .search-box input{height:44px;padding:12px 16px 12px 42px;border-radius:12px;font-size:14px;}
  .search-box input::placeholder{color:var(--text-secondary);}
  .search-box input:focus{border-color:var(--accent);box-shadow:0 0 20px var(--accent-glow);}
  .search-mode-btn{align-self:stretch;height:44px;}

  /* detail page */
  .version-item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);}
  .version-num{font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--accent);min-width:40px;}
  .version-msg{flex:1;margin:0 12px;font-size:13px;color:var(--text-primary);}
  .version-date{font-size:11px;color:var(--text-secondary);font-family:'JetBrains Mono',monospace;}
  .version-actions{display:flex;gap:6px;}
  .diff-view{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.7;overflow-x:auto;white-space:pre-wrap;}
  .diff-add{color:#22c55e;}
  .diff-remove{color:#ff4f6b;}
  .diff-same{color:var(--text-secondary);}
  .back-link{font-size:13px;color:var(--accent);cursor:pointer;margin-bottom:16px;display:inline-block;}
  .empty{text-align:center;padding:40px;color:var(--text-secondary);font-family:'JetBrains Mono',monospace;font-size:13px;}
  .md-body{font-size:13px;line-height:1.7;color:var(--text-primary);}
  .md-body pre{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px;overflow-x:auto;font-size:12px;margin:8px 0;}
  .md-body pre code{font-family:'JetBrains Mono',monospace;white-space:pre-wrap;}
  .md-body code{font-family:'JetBrains Mono',monospace;font-size:12px;}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:var(--bg-card);border:1px solid var(--accent);color:var(--accent);font-family:'JetBrains Mono',monospace;padding:10px 20px;border-radius:50px;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:all .3s;opacity:0;z-index:999;}
  .toast.show{transform:translateX(-50%) translateY(0);opacity:1;}
  .toast.err{border-color:#ff4f6b;color:#ff4f6b;}

  /* SPA cards */
  #skill-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}
  .skill-card{position:relative;overflow:hidden;padding:14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);display:flex;align-items:center;gap:12px;aspect-ratio:16/9;transition:all .25s;cursor:default;animation:fadeInUp .5s ease both;}
  .skill-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--accent-glow) 0%,transparent 60%);opacity:0;transition:opacity .25s;pointer-events:none;z-index:0;}
  .skill-card:hover::before{opacity:1;}
  .skill-card:hover{border-color:var(--accent);box-shadow:0 8px 40px rgba(0,0,0,0.3),0 0 30px var(--accent-glow);transform:translateY(-4px);}
  .skill-card.expanded{aspect-ratio:auto;align-items:flex-start;transform:none;}
  .skill-card-icon{flex-shrink:0;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--accent-glow),transparent);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--accent);position:relative;z-index:1;}
  .skill-card-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;position:relative;z-index:1;}
  .skill-card-head{display:flex;align-items:center;gap:6px;min-width:0;}
  .skill-name{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:var(--accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;}
  .skill-desc{font-size:12px;color:var(--text-secondary);line-height:1.4;}
  .skill-card-footer{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:auto;font-size:10px;color:var(--text-secondary);font-family:'JetBrains Mono',monospace;}
  .skill-tag{padding:1px 6px;border-radius:8px;background:var(--border);font-family:'JetBrains Mono',monospace;font-size:10px;}
  .skill-card-actions{position:absolute;top:8px;right:8px;display:flex;gap:4px;opacity:0;transition:opacity .2s;z-index:2;}
  .skill-card:hover .skill-card-actions,.skill-card.expanded .skill-card-actions{opacity:1;}
  .skill-preview{grid-column:1/-1;width:100%;margin-top:10px;padding:12px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;max-height:280px;overflow:auto;font-size:12px;line-height:1.6;position:relative;z-index:1;}
  .skill-detail{grid-column:1/-1;width:100%;max-height:0;overflow:hidden;opacity:0;transition:max-height .35s cubic-bezier(.4,0,.2,1),opacity .25s;border-top:1px solid transparent;position:relative;z-index:1;}
  .skill-card.expanded .skill-detail{max-height:520px;opacity:1;border-top-color:var(--border);margin-top:10px;padding-top:12px;}
  .skill-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin-bottom:12px;font-size:11px;}
  .skill-detail-item{display:flex;flex-direction:column;gap:2px;}
  .skill-detail-full{grid-column:1/-1;}
  .skill-detail-label{color:var(--text-secondary);font-size:10px;letter-spacing:.05em;}
  .skill-detail-value{color:var(--text-primary);font-weight:600;font-family:'JetBrains Mono',monospace;word-break:break-all;}

  @media(max-width:768px){
    .topbar{padding:10px 16px;gap:8px;}
    .topbar .logo span{display:none;}
    .topbar-right{gap:6px;}
    .btn{padding:6px 12px;font-size:12px;}
    .page{padding:16px 12px 60px;}
    .hero h1{font-size:1.8rem;}
    .hero{padding:48px 0 24px;}
    .projects-grid{grid-template-columns:1fr;}
    #skill-list{grid-template-columns:1fr;}
  }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-grid"></div>

  <div class="topbar" id="topbar">
    <div class="logo" onclick="navigate('/')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="14" height="3" rx="1"/><rect x="3" y="10.5" width="14" height="3" rx="1"/><rect x="3" y="17" width="14" height="3" rx="1"/><path d="M19 2l.8 1.6 1.6.8-1.6.8L19 6.8l-.8-1.6-1.6-.8 1.6-.8z"/></svg>Skills<span>Sub</span></div>
    <div class="topbar-right">
      <button class="btn btn-p" onclick="navigate('/publish')">+ 发布 Skill</button>
      <button class="btn btn-s" onclick="navigate('/guide')">📖 教程</button>
      <button class="btn btn-s" id="theme-btn" onclick="toggleTheme()">🌓</button>
    </div>
  </div>

  <div class="page" id="app"></div>
  <div class="toast" id="toast"></div>

  <script>${SCRIPT_CODE}</script>
</body>
</html>`

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API 路由
    const apiRes = await handleApi(request, env);
    if (apiRes) return apiRes;

    // Portal 页面（默认根路径）
    return html(PORTAL_HTML);
  },
};

function html(body: string) {
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
