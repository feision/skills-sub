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

    .container { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 0 24px; }

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
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-grid"></div>

  <div class="container">
    <header class="hero">
      <div class="hero-icon">🧠</div>
      <h1>AI Skills</h1>
      <p>Claude Code & Agent Skills 导航库</p>
    </header>

    <div class="stats">
      <div class="stat-item"><div class="stat-value" id="stat-total">-</div><div class="stat-label">Total Skills</div></div>
      <div class="stat-item"><div class="stat-value" id="stat-human">-</div><div class="stat-label">Human</div></div>
      <div class="stat-item"><div class="stat-value" id="stat-agent">-</div><div class="stat-label">Agent</div></div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <input id="search-input" type="text" placeholder="搜索 skills..." aria-label="搜索 skills" />
      </div>
    </div>

    <div class="filter-chips" id="filter-chips"></div>
    <div class="projects-grid" id="skills-grid"></div>

    <footer>
      Built with 💜 for Claude Code Skills. <a href="https://github.com/feision/skills-sub" target="_blank" rel="noopener">GitHub</a>
    </footer>
  </div>

  <script>
    var SKILLS_API = '/api/skills';
    var allSkills = [];
    var expandedCardId = null;
    var activeCategory = 'all';
    var searchQuery = '';

    async function init() {
      try {
        var res = await fetch(SKILLS_API);
        var data = await res.json();
        allSkills = data.skills || [];
        renderStats();
        renderCategories();
        renderCards();
      } catch (e) {
        document.getElementById('skills-grid').innerHTML = '<div class="empty-state"><p>加载失败: ' + (e.message || '') + '</p></div>';
      }
    }

    function renderStats() {
      var total = allSkills.length;
      var human = allSkills.filter(function(s) { return s.authorType === 'human'; }).length;
      var agent = allSkills.filter(function(s) { return s.authorType === 'agent'; }).length;
      document.getElementById('stat-total').textContent = total;
      document.getElementById('stat-human').textContent = human;
      document.getElementById('stat-agent').textContent = agent;
    }

    function renderCategories() {
      var cats = new Set(['all']);
      allSkills.forEach(function(s) {
        (s.tags || []).forEach(function(t) { cats.add(t); });
      });
      var htmlArr = [];
      cats.forEach(function(cat) {
        var count = cat === 'all' ? allSkills.length :
          allSkills.filter(function(s) { return (s.tags || []).includes(cat); }).length;
        var active = cat === activeCategory ? ' active' : '';
        htmlArr.push('<button class="filter-chip' + active + '" type="button" data-cat="' + escapeAttr(cat) + '" aria-pressed="' + (cat === activeCategory ? 'true' : 'false') + '">' + escapeHtml(cat) + ' (' + count + ')</button>');
      });
      document.getElementById('filter-chips').innerHTML = htmlArr.join('');
    }

    function setCategory(cat) {
      activeCategory = cat;
      expandedCardId = null;
      renderCards();
      renderCategories();
    }

    function renderCards() {
      var filtered = filterSkills();
      if (!filtered.length) {
        document.getElementById('skills-grid').innerHTML = '<div class="empty-state"><p>未找到匹配的 Skills</p></div>';
        return;
      }
      var htmlArr = [];
      filtered.forEach(function(s, i) {
        var isExpanded = expandedCardId === s.id;
        htmlArr.push(buildCard(s, isExpanded, i));
      });
      document.getElementById('skills-grid').innerHTML = htmlArr.join('');
    }

    function filterSkills() {
      var result = allSkills;
      if (activeCategory !== 'all') {
        result = result.filter(function(s) { return (s.tags || []).includes(activeCategory); });
      }
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        result = result.filter(function(s) {
          var text = ((s.name||'') + ' ' + (s.description||'') + ' ' + (s.author||'') + ' ' + ((s.tags||[]).join(' '))).toLowerCase();
          return text.indexOf(q) >= 0;
        });
      }
      return result;
    }

    function buildCard(skill, expanded, index) {
      var className = expanded ? 'project-card expanded' : 'project-card';
      var idAttr = escapeAttr(String(skill.id));
      var tagHtml = (skill.tags || []).map(function(t) {
        return '<span class="card-tag">' + escapeHtml(t) + '</span>';
      }).join('');

      // icon color by authorType
      var iconColor = skill.authorType === 'agent' ? '#22c55e' : skill.authorType === 'human' ? '#6366f1' : '#8888a0';

      // authorType badge
      var badgeClass = skill.authorType === 'agent' ? 'card-author-badge agent' : 'card-author-badge';
      var badgeHtml = skill.authorType ? '<span class="' + badgeClass + '">' + escapeHtml(skill.authorType) + '</span>' : '';

      // card-footer: tags count + author
      var tagsCount = (skill.tags || []).length;
      var firstTag = tagsCount > 0 ? escapeHtml(skill.tags[0]) : '';
      var footerHtml = '<div class="card-footer">' +
        (firstTag ? '<span class="card-lang"><span class="lang-dot" style="background:' + iconColor + '"></span>' + firstTag + '</span>' : '') +
        (tagsCount > 1 ? '<span class="card-stat"><svg viewBox="0 0 24 24"><path d="M7 7h10M7 12h10M7 17h6"/></svg>+' + (tagsCount - 1) + ' tags</span>' : '') +
        (skill.author ? '<span class="card-date">' + escapeHtml(skill.author) + '</span>' : '') +
        '</div>';

      // detail panel
      var detailHtml = '<div class="card-detail">';
      if (expanded) {
        var escapedDesc = escapeAttr(skill.description || '');
        var metaLines = '';
        if (skill.author) metaLines += '<div class="detail-meta-row">作者：' + escapeHtml(skill.author) + '</div>';
        if (skill.authorType) metaLines += '<div class="detail-meta-row">类型：' + escapeHtml(skill.authorType) + '</div>';
        detailHtml += '<div class="detail-prompt">' + escapeHtml(skill.description || '') + '</div>' +
          (metaLines ? '<div class="detail-meta">' + metaLines + '</div>' : '') +
          '<div class="detail-actions">' +
          '<button class="detail-btn copy-btn" type="button" data-action="copy" data-text="' + escapedDesc + '">📋 复制描述</button>' +
          '<a class="detail-btn" href="/#/skill/' + idAttr + '" target="_blank" rel="noopener">➜ 详情页</a>' +
          '</div>';
      }
      detailHtml += '</div>';

      return '<div class="' + className + '" data-skill-id="' + idAttr + '" role="button" tabindex="0" aria-expanded="' + (expanded ? 'true' : 'false') + '" style="animation-delay:' + (index * 0.06) + 's;">' +
        '<div class="card-header">' +
        '<div class="card-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="' + iconColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 2a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"/>' +
        '</svg>' +
        '</div>' +
        '<div class="card-title-group">' +
        '<div class="card-title">' + escapeHtml(skill.name) + badgeHtml + '</div>' +
        '</div>' +
        '<span class="card-expand-hint" aria-hidden="true">点击展开 ▾</span>' +
        '</div>' +
        '<p class="card-desc">' + escapeHtml(skill.description || '暂无描述') + '</p>' +
        (tagHtml ? '<div class="card-tags">' + tagHtml + '</div>' : '') +
        footerHtml +
        detailHtml +
        '</div>';
    }

    function toggleCard(id) {
      expandedCardId = (expandedCardId === id) ? null : id;
      renderCards();
    }

    function copyPrompt(btn) {
      var text = btn.getAttribute('data-text') || '';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          showCopyFeedback(btn);
        }).catch(function() {
          fallbackCopy(text, btn);
        });
      } else {
        fallbackCopy(text, btn);
      }
    }

    function fallbackCopy(text, btn) {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopyFeedback(btn);
    }

    function showCopyFeedback(btn) {
      var orig = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '✓ 已复制';
      setTimeout(function() {
        btn.classList.remove('copied');
        btn.innerHTML = orig;
      }, 2000);
    }

    function escapeHtml(text) {
      var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return (text || '').replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function escapeAttr(text) {
      return (text || '').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    document.getElementById('search-input').addEventListener('input', function(e) {
      searchQuery = e.target.value;
      expandedCardId = null;
      renderCards();
    });

    document.getElementById('filter-chips').addEventListener('click', function(e) {
      var chip = e.target.closest('.filter-chip');
      if (chip) setCategory(chip.getAttribute('data-cat'));
    });

    var grid = document.getElementById('skills-grid');
    grid.addEventListener('click', function(e) {
      var copyBtn = e.target.closest('[data-action="copy"]');
      if (copyBtn) { copyPrompt(copyBtn); return; }
      if (e.target.closest('.detail-actions')) return;
      var card = e.target.closest('.project-card');
      if (card && card.dataset.skillId) toggleCard(card.dataset.skillId);
    });
    grid.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.project-card');
      if (card && card.dataset.skillId && !e.target.closest('.detail-actions')) {
        e.preventDefault();
        toggleCard(card.dataset.skillId);
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && expandedCardId) {
        expandedCardId = null;
        renderCards();
      }
    });

    init();
  </script>
</body>
</html>\`;`

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Portal 路由
    if (url.pathname === "/portal" || url.pathname === "/portal.html") {
      return html(PORTAL_HTML);
    }

    // API 路由
    const apiRes = await handleApi(request, env);
    if (apiRes) return apiRes;

    // 静态页面路由（SPA hash 模式，全部返回 index.html）
    return html(buildPage());
  },
};

function html(body: string) {
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ── SPA 前端 ──

// SVG icon 库（24x24 viewBox, Heroicons outline 风格）
// 在 buildPage 编译期 + SCRIPT_BODY 运行期共享
const ICONS_TS: Record<string, string> = {
  plus: '<path d="M12 4.5v15m7.5-7.5h-15"/>',
  arrowLeft: '<path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>',
  arrowRight: '<path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>',
  download: '<path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>',
  book: '<path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>',
  moon: '<path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  file: '<path d="M14.25 2.25H6a2.25 2.25 0 00-2.25 2.25v15a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25V8.25L14.25 2.25z"/><path d="M14.25 2.25v4.5a1.5 1.5 0 001.5 1.5h4.5"/><path d="M8.25 13.5h7.5M8.25 16.5h4.5"/>',
  eye: '<path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>',
  check: '<path d="M4.5 12.75l6 6 9-13.5"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="M21 21l-5.197-5.197"/>',
  brain: '<path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>',
  key: '<path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>',
  package: '<path d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>',
  refresh: '<path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>',
  trash: '<path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>',
  signal: '<path d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>',
  robot: '<path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>',
  clock: '<path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  logo: '<rect x="3" y="4" width="14" height="3" rx="1"/><rect x="3" y="10.5" width="14" height="3" rx="1"/><rect x="3" y="17" width="14" height="3" rx="1"/><path d="M19 2l.8 1.6 1.6.8-1.6.8L19 6.8l-.8-1.6-1.6-.8 1.6-.8z"/>',
  folder: '<path d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026V5.25a2.25 2.25 0 00-2.25-2.25h-4.5a.75.75 0 01-.6-.3L12 1.5l-1.05 1.2a.75.75 0 01-.6.3h-4.5A2.25 2.25 0 003 5.25v4.526z"/><path d="M3.75 11.25a.75.75 0 00-.75.75v6.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V12a.75.75 0 00-.75-.75H3.75z"/>',
  star: '<path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" fill="currentColor" stroke="none"/>',
  fork: '<path d="M8 1.5a1.5 1.5 0 013 0v1.5h3v-1.5a1.5 1.5 0 013 0V5.25a3 3 0 01-3 3H10.5v6.75h.75a2.25 2.25 0 012.25 2.25v3a1.5 1.5 0 01-3 0V18a.75.75 0 00-.75-.75H7.5a.75.75 0 00-.75.75v2.25a1.5 1.5 0 01-3 0v-3A2.25 2.25 0 016 15h.75V8.25H6a3 3 0 01-3-3V1.5a1.5 1.5 0 013 0v1.5h2.25V1.5z" fill="currentColor" stroke="none"/>',
};

function icon(name: string, size = 14): string {
  const path = ICONS_TS[name];
  if (!path) return "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;display:inline-block;">${path}</svg>`;
}


const SCRIPT_BODY = String.raw`
var ICONS = ${JSON.stringify(ICONS_TS)};
function icon(name, size) {
  size = size || 14;
  var path = ICONS[name];
  if (!path) return '';
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;display:inline-block;">' + path + '</svg>';
}

var API_KEY = '';
var ROUTES = {};

function navigate(path) {
  window.location.hash = path;
}

function route() {
  var hash = window.location.hash.slice(1) || '/';
  var app = document.getElementById('app');

  if (hash === '/publish') { renderPublish(app); return; }
  if (hash === '/guide') { renderGuide(app); return; }
  if (hash.startsWith('/skill/')) { renderDetail(app, hash.split('/skill/')[1]); return; }
  renderHome(app);
}

// ── 首页 ──
var SEARCH_MODE = 'keyword'; // 'keyword' | 'semantic'
var SEMANTIC_RESULTS = null;
var ALL_SKILLS = [];
var FILTER_TAB = 'all'; // 'all' | 'human' | 'agent'

async function renderHome(el) {
  el.innerHTML = '<div class="empty">加载中...</div>';
  try {
    var res = await api('GET', '/api/skills');
    ALL_SKILLS = res.skills || [];
    SEMANTIC_RESULTS = null;
    FILTER_TAB = 'all';
    var html = '<div class="card-title">Browse Skills</div>';
    html += renderStats();
    html += '<div class="search-bar">';
    html += '<div class="search-box">' + icon('search', 18) + '<input id="search-input" placeholder="搜索 skill..." aria-label="搜索 skill" oninput="onSearchInput(this.value)"></div>';
    html += '<button class="btn btn-s search-mode-btn" id="search-mode-btn" onclick="toggleSearchMode()">' + icon('search', 12) + ' 关键词</button>';
    html += '</div>';
    html += renderFilterTabs();
    html += '<div id="search-status" class="empty" style="font-size:11px;padding:8px;display:none;"></div>';
    html += '<div id="skill-list">';
    html += renderCardList(ALL_SKILLS);
    html += '</div>';
    if (!ALL_SKILLS.length) html += '<div class="empty">暂无 Skill，点击上方发布第一个</div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div class="empty">加载失败: ' + e.message + '</div>';
  }
}

function renderFilterTabs() {
  var total = ALL_SKILLS.length;
  var human = ALL_SKILLS.filter(function(s){ return s.authorType === 'human'; }).length;
  var agent = ALL_SKILLS.filter(function(s){ return s.authorType === 'agent'; }).length;
  return '<div class="filter-tabs">'
    + filterTab('all', '全部', total)
    + filterTab('human', '原创', human)
    + filterTab('agent', 'Agent', agent)
    + '</div>';
}

function renderStats() {
  var total = ALL_SKILLS.length;
  var human = ALL_SKILLS.filter(function(s){ return s.authorType === 'human'; }).length;
  var agent = ALL_SKILLS.filter(function(s){ return s.authorType === 'agent'; }).length;
  var avgVer = total ? (ALL_SKILLS.reduce(function(a,s){ return a + (s.latestVersion||0); }, 0) / total).toFixed(1) : '0';
  return '<div class="stats">'
    + '<div class="stat"><div class="stat-num">' + total + '</div><div class="stat-label">Skills</div></div>'
    + '<div class="stat"><div class="stat-num">' + human + '</div><div class="stat-label">原创</div></div>'
    + '<div class="stat"><div class="stat-num">' + agent + '</div><div class="stat-label">Agent</div></div>'
    + '</div>';
}

function filterTab(key, label, count) {
  var active = FILTER_TAB === key ? ' active' : '';
  return '<button class="filter-tab' + active + '" data-tab="' + key + '" onclick="setFilterTab(\'' + key + '\')">'
    + esc(label) + ' <span class="filter-tab-count">' + count + '</span></button>';
}

function setFilterTab(key) {
  FILTER_TAB = key;
  collapseAllCards();
  var tabsEl = document.querySelector('.filter-tabs');
  if (tabsEl) tabsEl.outerHTML = renderFilterTabs();
  var list = document.getElementById('skill-list');
  if (!list) return;
  var src = SEMANTIC_RESULTS || ALL_SKILLS;
  var filtered = key === 'all' ? src : src.filter(function(s){ return s.authorType === key; });
  list.innerHTML = filtered.length ? renderCardList(filtered) : '<div class="empty">该分类暂无 Skill</div>';
}

function collapseAllCards() {
  var cards = document.querySelectorAll('.skill-card.expanded');
  for (var i = 0; i < cards.length; i++) {
    cards[i].classList.remove('expanded');
  }
}

function renderCardList(arr) {
  return arr.map(function(s, i){ return renderSkillCard(s, i); }).join('');
}

function renderSkillCard(s, idx) {
  idx = idx || 0;
  var delay = Math.min(idx, 10) * 0.06;
  var tags = (s.tags||[]).slice(0, 3).map(function(t){ return '<span class="skill-tag">#' + esc(t) + '</span>'; }).join('');
  var score = s.score != null ? '<span class="skill-score">' + (s.score*100).toFixed(0) + '%</span>' : '';
  return '<div class="card skill-card" data-id="' + s.id + '" style="animation-delay:' + delay.toFixed(2) + 's;" '
    + 'role="button" tabindex="0" aria-expanded="false" '
    + 'onclick="toggleDetail(this.dataset.id,this)" '
    + 'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();toggleDetail(this.dataset.id,this);}">'
    + '<div class="skill-card-icon">' + icon('brain', 22) + '</div>'
    + '<div class="skill-card-body">'
    + '<div class="skill-card-head">'
    + '<div class="skill-name">' + esc(s.name) + '</div>'
    + score
    + '</div>'
    + '<div class="skill-desc">' + esc(s.description) + '</div>'
    + '<div class="skill-card-footer">'
    + '<span class="skill-tag" style="background:rgba(79,255,176,.1);color:var(--accent);">' + icon('check', 10) + ' ' + esc(s.author) + '</span>'
    + (s.authorType ? '<span class="skill-tag">' + esc(s.authorType) + '</span>' : '')
    + '</div></div>'
    + '<div class="skill-card-actions">'
    + '<button class="btn btn-s" data-id="' + s.id + '" onclick="event.stopPropagation();togglePreview(this.dataset.id,this)" title="预览">' + icon('eye', 12) + '</button>'
    + '<button class="btn btn-s" data-id="' + s.id + '" onclick="event.stopPropagation();navigate(\'/skill/\'+this.dataset.id)" title="详情">' + icon('arrowRight', 12) + '</button>'
    + '</div>'
    + '<div class="skill-preview" id="prev-' + s.id + '" style="display:none;"></div>'
    + '<div class="skill-detail" id="detail-' + s.id + '">'
    + renderDetailPanel(s)
    + '</div>'
    + '</div>';
}

function renderDetailPanel(s) {
  var tags = (s.tags||[]).map(function(t){ return '<span class="skill-tag">#' + esc(t) + '</span>'; }).join(' ');
  return '<div class="skill-detail-grid">'
    + '<div class="skill-detail-item"><div class="skill-detail-label">作者</div><div class="skill-detail-value">@' + esc(s.author) + '</div></div>'
    + '<div class="skill-detail-item"><div class="skill-detail-label">类型</div><div class="skill-detail-value">' + esc(s.authorType) + '</div></div>'
    + (tags ? '<div class="skill-detail-item skill-detail-full"><div class="skill-detail-label">标签</div><div class="skill-detail-value">' + tags + '</div></div>' : '')
    + '</div>'
    + '<div class="skill-detail-actions">'
    + '<button class="btn btn-s" data-id="' + s.id + '" onclick="event.stopPropagation();downloadVersion(this.dataset.id,0)">' + icon('download', 12) + ' 下载</button>'
    + '<button class="btn btn-s" data-id="' + s.id + '" data-name="' + esc(s.name) + '" onclick="event.stopPropagation();copyInstall(this.dataset.id,this.dataset.name,this)">' + icon('copy', 12) + ' 复制 cURL</button>'
    + '<button class="btn btn-s" data-id="' + s.id + '" onclick="event.stopPropagation();copyContent(this.dataset.id,this)">' + icon('file', 12) + ' 复制内容</button>'
    + '<button class="btn btn-s" data-id="' + s.id + '" onclick="event.stopPropagation();navigate(\'/skill/\'+this.dataset.id)">' + icon('arrowRight', 12) + ' 详情页</button>'
    + '</div>';
}

function toggleDetail(id, card) {
  if (!card) card = document.querySelector('.skill-card[data-id="' + id + '"]');
  if (!card) return;
  var isExpanded = card.classList.toggle('expanded');
  card.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
}

function toggleSearchMode() {
  SEARCH_MODE = SEARCH_MODE === 'keyword' ? 'semantic' : 'keyword';
  var btn = document.getElementById('search-mode-btn');
  if (btn) btn.innerHTML = SEARCH_MODE === 'keyword' ? icon('search', 12) + ' 关键词' : icon('brain', 12) + ' 语义';
  var input = document.getElementById('search-input');
  if (input) onSearchInput(input.value);
}

var SEARCH_DEBOUNCE = null;
function onSearchInput(q) {
  if (SEARCH_MODE === 'keyword') { filterList(q); hideStatus(); return; }
  // semantic: debounce 300ms
  var status = document.getElementById('search-status');
  if (status) { status.textContent = '搜索中…'; status.style.display = 'block'; }
  clearTimeout(SEARCH_DEBOUNCE);
  SEARCH_DEBOUNCE = setTimeout(function() { doSemanticSearch(q); }, 300);
}

async function doSemanticSearch(q) {
  q = (q || '').trim();
  var list = document.getElementById('skill-list');
  if (!q) {
    SEMANTIC_RESULTS = null;
    list.innerHTML = renderCardList(ALL_SKILLS);
    hideStatus();
    return;
  }
  try {
    var res = await api('GET', '/api/skills/semantic-search?q=' + encodeURIComponent(q) + '&topK=20');
    SEMANTIC_RESULTS = res.results || [];
    var src = FILTER_TAB === 'all' ? SEMANTIC_RESULTS : SEMANTIC_RESULTS.filter(function(s){ return s.authorType === FILTER_TAB; });
    list.innerHTML = src.length
      ? renderCardList(src)
      : '<div class="empty">未找到匹配的 skill</div>';
    var status = document.getElementById('search-status');
    if (status) status.textContent = '语义搜索 "' + esc(q) + '" · 命中 ' + SEMANTIC_RESULTS.length + ' 个';
  } catch(e) {
    var status = document.getElementById('search-status');
    if (status) status.textContent = '搜索失败: ' + e.message;
  }
}

function hideStatus() {
  var status = document.getElementById('search-status');
  if (status) status.style.display = 'none';
}

function filterList(q) {
  q = q.toLowerCase();
  var src = SEMANTIC_RESULTS || ALL_SKILLS;
  var filtered = FILTER_TAB === 'all' ? src : src.filter(function(s){ return s.authorType === FILTER_TAB; });
  var list = document.getElementById('skill-list');
  if (q) {
    filtered = filtered.filter(function(s){
      var text = ((s.name||'') + ' ' + (s.description||'') + ' ' + (s.author||'') + ' ' + ((s.tags||[]).join(' '))).toLowerCase();
      return text.indexOf(q) >= 0;
    });
  }
  list.innerHTML = filtered.length
    ? renderCardList(filtered)
    : '<div class="empty">未找到匹配的 skill<br><button class="btn btn-s skill-empty-reset" onclick="document.getElementById(\'search-input\').value=\'\';filterList(\'\');">重置搜索</button></div>';
}

// ── Markdown 渲染（极简：h1-h3 / code / list / link / bold） ──
function renderMarkdown(md) {
  if (!md) return '';
  var FENCE = String.fromCharCode(96,96,96);
  var lines = md.split('\n');
  var out = [];
  var inCode = false, codeBuf = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.indexOf(FENCE) === 0) {
      if (inCode) { out.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>'); codeBuf = []; inCode = false; }
      else { inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    if (line.startsWith('### ')) out.push('<h4 style="margin:8px 0 4px;font-size:13px;color:var(--accent2);">' + inlineMd(line.slice(4)) + '</h4>');
    else if (line.startsWith('## ')) out.push('<h3 style="margin:10px 0 6px;font-size:15px;color:var(--accent);">' + inlineMd(line.slice(3)) + '</h3>');
    else if (line.startsWith('# ')) out.push('<h2 style="margin:12px 0 8px;font-size:18px;color:var(--accent);">' + inlineMd(line.slice(2)) + '</h2>');
    else if (/^\s*[-*]\s+/.test(line)) out.push('<div style="padding-left:16px;">• ' + inlineMd(line.replace(/^\s*[-*]\s+/, '')) + '</div>');
    else if (/^\d+\.\s+/.test(line)) out.push('<div style="padding-left:16px;">' + line.match(/^\d+\./)[0] + ' ' + inlineMd(line.replace(/^\d+\.\s+/, '')) + '</div>');
    else if (line.trim() === '') out.push('<div style="height:6px;"></div>');
    else out.push('<div>' + inlineMd(line) + '</div>');
  }
  if (inCode) out.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>');
  return out.join('');
}

function inlineMd(s) {
  if (!s) return '';
  s = esc(s);
  var B = String.fromCharCode(96);
  s = s.replace(new RegExp(B + '([^' + B + ']+)' + B, 'g'), '<code style="background:var(--surface2);padding:1px 4px;border-radius:3px;font-size:11px;">$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--accent2);">$1</a>');
  return s;
}

// ── 预览切换 ──
var PREVIEW_CACHE = {};
async function togglePreview(id, btn) {
  var area = document.getElementById('prev-' + id);
  var card = btn.closest('.skill-card');
  if (!area) return;
  if (area.style.display !== 'none') {
    area.style.display = 'none';
    if (card) card.classList.remove('expanded');
    btn.innerHTML = icon('eye', 12);
    return;
  }
  btn.innerHTML = icon('clock', 12);
  btn.disabled = true;
  try {
    if (!PREVIEW_CACHE[id]) {
      var res = await api('GET', '/api/skills/' + id + '/preview?chars=600&lines=30');
      PREVIEW_CACHE[id] = res;
    }
    var p = PREVIEW_CACHE[id];
    area.innerHTML = renderMarkdown(p.content)
      + (p.truncated ? '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);color:var(--muted);font-size:11px;">已截断 (显示 ' + p.shownLines + '/' + p.totalLines + ' 行, ' + p.shownChars + '/' + p.totalChars + ' 字符) · <a href="#/skill/' + id + '" style="color:var(--accent);">查看完整 ' + icon('arrowRight', 12) + '</a></div>' : '');
    area.style.display = 'block';
    if (card) card.classList.add('expanded');
    btn.innerHTML = icon('eyeOff', 12);
  } catch (e) {
    area.innerHTML = '<div style="color:var(--danger);">加载失败: ' + esc(e.message) + '</div>';
    area.style.display = 'block';
    if (card) card.classList.add('expanded');
    btn.innerHTML = icon('eye', 12);
  } finally {
    btn.disabled = false;
  }
}

// ── 详情页 ──
async function renderDetail(el, id) {
  el.innerHTML = '<div class="empty">加载中...</div>';
  try {
    var skill = await api('GET', '/api/skills/' + id);
    var versions = (skill.versions || []).map(function(v) {
      return '<div class="version-item">'
        + '<span class="version-num">v' + v.version + '</span>'
        + '<span class="version-msg">' + esc(v.message) + '</span>'
        + '<span class="version-date">' + new Date(v.createdAt).toLocaleDateString() + '</span>'
        + '<div class="version-actions">'
        + '<button class="btn btn-s" data-id="' + id + '" data-v="' + v.version + '" onclick="downloadVersion(this.dataset.id,+this.dataset.v)" style="padding:4px 10px;font-size:11px;">下载</button>'
        + '<button class="btn btn-s" data-id="' + id + '" data-v="' + v.version + '" onclick="showDiff(this.dataset.id,+this.dataset.v)" style="padding:4px 10px;font-size:11px;">Diff</button>'
        + '</div></div>';
    }).join('');

    var tags = (skill.tags||[]).map(function(t){ return '<span class="skill-tag">#'+esc(t)+'</span>'; }).join(' ');

    var html = '<div class="back-link" onclick="navigate(\'/\')">' + icon('arrowLeft', 12) + ' 返回列表</div>';
    html += '<div class="card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:start;">';
    html += '<div><div class="skill-name" style="font-size:20px;">' + esc(skill.name) + '</div>';
    html += '<div class="skill-desc" style="margin-top:6px;">' + esc(skill.description) + '</div>';
    html += '<div class="skill-meta" style="margin-top:8px;"><span class="skill-author">@' + esc(skill.author) + '</span> ' + tags + '</div></div>';
    html += '<div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;">';
    html += '<button class="btn btn-p" data-id="' + id + '" onclick="downloadVersion(this.dataset.id,0)">' + icon('download', 14) + ' 下载</button>';
    html += '<button class="btn btn-s" data-id="' + id + '" data-name="' + esc(skill.name) + '" onclick="copyInstall(this.dataset.id,this.dataset.name,this)">' + icon('copy', 12) + ' 复制 cURL</button>';
    html += '<button class="btn btn-s" data-id="' + id + '" onclick="copyContent(this.dataset.id,this)">' + icon('file', 14) + ' 复制内容</button>';
    html += '<button class="btn btn-d" data-id="' + id + '" onclick="deleteSkill(this.dataset.id)">' + icon('trash', 14) + '删除</button>';
    html += '</div></div></div>';

    html += '<div class="card"><div class="card-title">Version History (' + (skill.versions||[]).length + ')</div>';
    html += versions || '<div class="empty">无版本记录</div>';
    html += '</div>';

    html += '<div class="card"><div class="card-title">' + icon('file', 14) + ' Skill 内容 (v' + skill.latestVersion + ')</div><div id="content-area"><div class="empty">加载中...</div></div></div>';

    html += '<div id="diff-area"></div>';
    el.innerHTML = html;

    // 异步加载最新内容
    fetchLatestContent(id);
  } catch(e) {
    el.innerHTML = '<div class="empty">加载失败: ' + e.message + '</div>';
  }
}

async function fetchLatestContent(id) {
  try {
    var res = await api('GET', '/api/skills/' + id + '/preview?chars=20000&lines=500');
    var area = document.getElementById('content-area');
    if (!area) return;
    area.innerHTML = '<div class="md-body">' + renderMarkdown(res.content) + '</div>';
  } catch (e) {
    var area = document.getElementById('content-area');
    if (area) area.innerHTML = '<div class="empty">内容加载失败: ' + esc(e.message) + '</div>';
  }
}

async function showDiff(id, v) {
  var area = document.getElementById('diff-area');
  if (!area) return;
  area.innerHTML = '<div class="card"><div class="card-title">Diff v' + v + '</div><div class="diff-view">加载中...</div></div>';
  try {
    var res = await fetch('/api/skills/' + id + '/versions/' + v + '/diff');
    var text = await res.text();
    var lines = text.split('\\n').map(function(l) {
      if (l.startsWith('+')) return '<div class="diff-add">' + esc(l) + '</div>';
      if (l.startsWith('-')) return '<div class="diff-remove">' + esc(l) + '</div>';
      return '<div class="diff-same">' + esc(l) + '</div>';
    }).join('');
    area.innerHTML = '<div class="card"><div class="card-title">Diff v' + v + '</div><div class="diff-view">' + lines + '</div></div>';
  } catch(e) {
    area.innerHTML = '<div class="empty">Diff 加载失败</div>';
  }
}

function downloadVersion(id, v) {
  var url = '/api/skills/' + id + '/download' + (v ? '?v=' + v : '');
  window.open(url, '_blank');
}

async function copyInstall(id, name, btn) {
  var url = location.origin + '/api/skills/' + id + '/download';
  var cmd = 'curl -L "' + url + '" -o ' + name + '/SKILL.md && mkdir -p ' + name + ' && curl -L "' + url + '" -o ' + name + '/SKILL.md';
  // 简化版：先 mkdir 再下载
  cmd = 'mkdir -p ~/.claude/skills/' + name + ' && curl -L "' + url + '" -o ~/.claude/skills/' + name + '/SKILL.md';
  await copyText(cmd, btn, '已复制安装命令');
}

async function copyContent(id, btn) {
  btn.innerHTML = icon('clock', 12) + '';
  try {
    var res = await api('GET', '/api/skills/' + id + '/preview?chars=20000&lines=500');
    await copyText(res.content, btn, '已复制 SKILL.md 内容');
  } catch (e) {
    toast('复制失败: ' + e.message, true);
    btn.innerHTML = icon('file', 14) + ' 复制内容';
  }
}

async function copyText(text, btn, okMsg) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // fallback: textarea
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast(okMsg);
    if (btn) { var orig = btn.innerHTML; btn.innerHTML = icon('check', 12) + ' 已复制'; setTimeout(function(){ btn.innerHTML = orig; }, 1500); }
  } catch (e) {
    toast('复制失败: ' + e.message, true);
  }
}

async function deleteSkill(id) {
  if (!confirm('确认删除此 Skill？')) return;
  try {
    await api('DELETE', '/api/skills/' + id);
    toast('已删除');
    navigate('/');
  } catch(e) { toast(e.message, true); }
}

// ── 发布页 ──
function renderPublish(el) {
  el.innerHTML = '<div class="back-link" onclick="navigate(\'/\')">' + icon('arrowLeft', 12) + ' 返回列表</div>'
    + '<div class="card"><div class="card-title">发布 Skill</div>'
    + '<div class="form-row"><label>名称 *</label><input id="p-name" placeholder="my-awesome-skill"></div>'
    + '<div class="form-row"><label>描述</label><input id="p-desc" placeholder="一句话描述这个 skill"></div>'
    + '<div class="form-row"><label>作者</label><input id="p-author" placeholder="agent-name 或 your-name"></div>'
    + '<div class="form-row"><label>标签（逗号分隔）</label><input id="p-tags" placeholder="cloudflare, worker, api"></div>'
    + '<div class="form-row"><label>SKILL.md 内容 *</label><textarea id="p-content" placeholder="粘贴 SKILL.md 内容..."></textarea></div>'
    + '<div class="form-row"><label>版本说明</label><input id="p-message" placeholder="initial version"></div>'
    + '<button class="btn btn-p" onclick="publishSkill()" style="width:100%;">发布 Skill</button>'
    + '</div>';
}

// ── 教程页 ──
function renderGuide(el) {
  el.innerHTML = '<div class="back-link" onclick="navigate(\'/\')">' + icon('arrowLeft', 12) + ' 返回列表</div>'
    + '<div class="card"><div class="card-title">' + icon('book', 14) + ' Skills Sub 使用教程</div>'
    + '<div class="skill-desc" style="margin-bottom:20px;">Skills Sub 是一个 Claude Code Skills 分享平台。读操作全部公开，发布/更新/删除需要 API Key。内置语义搜索（bge-m3 多语 embedding）。</div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">' + icon('key', 14) + ' API Key</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>首次点击「+ 发布 Skill」、「删除」或复制内容时，浏览器会弹窗让你输入 API Key。</p>'
    + '<p>Key 保存到 localStorage，之后不再问。清除方法：<code style="font-family:var(--mono);font-size:12px;color:var(--accent);">localStorage.removeItem("api_key")</code></p>'
    + '<p>读操作（浏览、搜索、预览、下载）无需 Key，<strong>任何 Agent 可直接调用</strong>。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">' + icon('package', 14) + ' 发布 Skill</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>1. 点「+ 发布 Skill」</p>'
    + '<p>2. 名称（如 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">my-weather-skill</code>）、描述、作者、标签（逗号分隔）</p>'
    + '<p>3. 粘贴 SKILL.md 全文 ' + icon('arrowRight', 12) + ' 发布</p>'
    + '<p>发布成功后自动 embed 进 Vectorize，秒级可被语义搜索检索到。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">' + icon('search', 12) + ' 浏览与搜索</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>• <strong>关键词模式</strong>（默认）：客户端过滤 name/description</p>'
    + '<p>• <strong>语义模式</strong>：点搜索框右侧「' + icon('search', 12) + ' 关键词」' + icon('arrowRight', 12) + '「' + icon('brain', 12) + ' 语义」切换，用自然语言描述需求（中文/英文均可）</p>'
    + '<p>语义搜索走 CF Vectorize + bge-m3，召回按相似度%排序</p>'
    + '<p>• 首页点「' + icon('eye', 12) + ' 预览」inline 展开前 30 行 markdown</p>'
    + '<p>• 点卡片进详情：完整内容渲染 + 版本历史 + diff</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">' + icon('download', 14) + '️ 下载与安装</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>详情页三个按钮：</p>'
    + '<p>• <strong>' + icon('download', 14) + ' 下载</strong>：浏览器下载 SKILL.md</p>'
    + '<p>• <strong>' + icon('copy', 12) + ' 复制 cURL</strong>：一键复制安装命令，agent 粘到 shell 就装好：</p>'
    + '<div class="diff-view" style="margin:8px 0;">mkdir -p ~/.claude/skills/NAME && curl -L URL -o ~/.claude/skills/NAME/SKILL.md</div>'
    + '<p>• <strong>' + icon('file', 14) + ' 复制内容</strong>：复制 SKILL.md 全文到剪贴板</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">' + icon('refresh', 14) + ' 更新 Skill</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>详情页的「复制 cURL」按钮旁暂未提供 update UI。当前通过 API PUT：</p>'
    + '<div class="diff-view" style="margin:8px 0;">curl -X PUT -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\<br>  -d \'{"content":"# new version","message":"fix typo"}\' \\<br>  https://skills-sub.ducksaylow.workers.dev/api/skills/ID</div>'
    + '<p>每次更新自动 embed 到向量索引。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">' + icon('robot', 14) + ' Agent 集成</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>Agent 可用 GET 接口自给自足：</p>'
    + '<p>1. 用 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">/api/skills/semantic-search?q=...</code> 发现相关 skill</p>'
    + '<p>2. 用 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">/api/skills/ID/download</code> 拉取内容</p>'
    + '<p>3. 写到自己 skills 目录</p>'
    + '<p>无需 API Key 即可完成整套流程。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">' + icon('signal', 14) + ' API 快速参考</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p><strong>读操作（公开，无需 Key）</strong>：</p>'
    + '<div class="diff-view" style="margin:8px 0; font-size:11px;">'
    + '<div class="diff-add"># 浏览列表（关键词过滤）</div>'
    + '<div class="diff-same">GET /api/skills?search=关键词&tag=标签&author=作者</div>'
    + '<div></div>'
    + '<div class="diff-add"># 语义搜索（自然语言）</div>'
    + '<div class="diff-same">GET /api/skills/semantic-search?q=AI 网关&topK=10</div>'
    + '<div></div>'
    + '<div class="diff-add"># 详情</div>'
    + '<div class="diff-same">GET /api/skills/ID</div>'
    + '<div></div>'
    + '<div class="diff-add"># 预览（前 N 行/字符）</div>'
    + '<div class="diff-same">GET /api/skills/ID/preview?chars=600&lines=30</div>'
    + '<div></div>'
    + '<div class="diff-add"># 下载 SKILL.md</div>'
    + '<div class="diff-same">GET /api/skills/ID/download</div>'
    + '<div class="diff-same">GET /api/skills/ID/download?v=2 (指定版本)</div>'
    + '<div></div>'
    + '<div class="diff-add"># 版本列表 / diff</div>'
    + '<div class="diff-same">GET /api/skills/ID/versions</div>'
    + '<div class="diff-same">GET /api/skills/ID/versions/2/diff</div>'
    + '</div>'
    + '<p style="margin-top:14px;"><strong>写操作（需 Header: <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">Authorization: Bearer YOUR_KEY</code>）</strong>：</p>'
    + '<div class="diff-view" style="margin:8px 0; font-size:11px;">'
    + '<div class="diff-add"># 发布 Skill</div>'
    + '<div class="diff-same">POST /api/skills</div>'
    + '<div class="diff-same">Body: { name, description, author, authorType, tags, content, message }</div>'
    + '<div></div>'
    + '<div class="diff-add"># 更新（创建新版本）</div>'
    + '<div class="diff-same">PUT /api/skills/ID</div>'
    + '<div class="diff-same">Body: { content, message }</div>'
    + '<div></div>'
    + '<div class="diff-add"># 删除</div>'
    + '<div class="diff-same">DELETE /api/skills/ID</div>'
    + '<div></div>'
    + '<div class="diff-add"># 管理员：全量重建向量索引</div>'
    + '<div class="diff-same">POST /api/admin/reindex</div>'
    + '</div>'
    + '</div></div>'

    + '<div style="text-align:center;margin-top:30px;">'
    + '<button class="btn btn-p" onclick="navigate(\'/\')" style="padding:12px 24px;">开始浏览 Skills ' + icon('arrowRight', 12) + '</button>'
    + '</div>'

    + '</div>';
}

async function publishSkill() {
  var name = document.getElementById('p-name').value.trim();
  var content = document.getElementById('p-content').value.trim();
  if (!name || !content) { toast('名称和内容必填', true); return; }
  try {
    var body = {
      name: name,
      description: document.getElementById('p-desc').value.trim(),
      author: document.getElementById('p-author').value.trim() || 'anonymous',
      tags: document.getElementById('p-tags').value.split(',').map(function(t){return t.trim();}).filter(Boolean),
      content: content,
      message: document.getElementById('p-message').value.trim() || 'initial version',
    };
    var res = await api('POST', '/api/skills', body);
    toast('发布成功！');
    navigate('/skill/' + res.id);
  } catch(e) { toast(e.message, true); }
}

// ── 工具 ──
async function api(method, path, body) {
  var headers = { 'Content-Type': 'application/json' };
  if (method !== 'GET' && method !== 'HEAD') {
    if (!API_KEY) {
      API_KEY = prompt('需要 API Key 才能发布/修改（读操作无需）') || '';
      if (!API_KEY) throw new Error('需要 API Key');
    }
    headers['Authorization'] = 'Bearer ' + API_KEY;
  }
  var opts = { method: method, headers: headers };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(path, opts);
  if (!res.ok) {
    var text = await res.text();
    throw new Error(text || 'HTTP ' + res.status);
  }
  return res.json();
}

function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function toast(msg, err) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  setTimeout(function(){ t.className = 'toast'; }, 3000);
}

function toggleTheme() {
  var root = document.documentElement;
  var isDark = !root.hasAttribute('data-theme');
  if (isDark) root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// ── 初始化 ──
(function() {
  var saved = localStorage.getItem('theme');
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  API_KEY = localStorage.getItem('api_key') || '';
  window.addEventListener('hashchange', route);
  // F. 点击空白收起展开卡片
  document.addEventListener('click', function(e) {
    var target = e.target;
    if (target.closest && target.closest('.skill-card')) return;
    collapseAllCards();
  });
  route();
})();
`;

function buildPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Skills Sub</title>
<style>
:root{--bg:#0a0a0f;--surface:#16161f;--surface2:#1a1e28;--border:#262c3a;--accent:#4fffb0;--accent2:#00b8ff;--danger:#ff4f6b;--warn:#ffb84f;--text:#e2e8f0;--muted:#64748b;--accent-dim:rgba(79,255,176,.1);--accent-glow:rgba(79,255,176,.15);--shadow:0 4px 20px rgba(0,0,0,0.3);--mono:'JetBrains Mono',monospace;--sans:'Inter','PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif;--btn-text:#000;--radius:16px;}
:root[data-theme='light']{--bg:#f4f7f9;--surface:#ffffff;--surface2:#f0f2f5;--border:#e2e8f0;--text:#1e293b;--muted:#64748b;--accent:#F38020;--accent-dim:rgba(243,128,32,.1);--accent-glow:rgba(243,128,32,.18);--btn-text:#ffffff;--shadow:0 4px 12px rgba(0,0,0,0.05);}
@media(prefers-color-scheme:light){:root:not([data-theme='dark']){--bg:#f4f7f9;--surface:#ffffff;--surface2:#f0f2f5;--border:#e2e8f0;--text:#1e293b;--muted:#64748b;--accent:#F38020;--accent-dim:rgba(243,128,32,.1);--accent-glow:rgba(243,128,32,.18);--btn-text:#ffffff;--shadow:0 4px 12px rgba(0,0,0,0.05);}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:var(--sans);background:var(--bg);color:var(--text);min-height:100vh;transition:background .3s,color .3s;}

.topbar{position:sticky;top:0;z-index:100;background:var(--topbar-bg,rgba(11,13,17,.92));backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:12px 24px;display:flex;align-items:center;gap:16px;}
.logo{font-family:var(--mono);font-size:18px;font-weight:700;color:var(--accent);cursor:pointer;display:inline-flex;align-items:center;}
.logo svg{margin-right:8px;flex-shrink:0;}
.logo span{color:var(--text);font-weight:400;font-size:14px;margin-left:8px;}
.topbar-right{margin-left:auto;display:flex;align-items:center;gap:12px;}
.btn{padding:8px 16px;border-radius:10px;font-family:var(--mono);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .2s;display:inline-flex;align-items:center;gap:6px;}
.btn-p{background:var(--accent);color:var(--btn-text);box-shadow:0 2px 10px var(--accent-dim);}
.btn-p:hover{filter:brightness(1.1);transform:translateY(-1px);}
.btn-s{background:var(--surface2);border:1px solid var(--border);color:var(--text);}
.btn-s:hover{border-color:var(--accent);}
.btn-d{background:transparent;border:1px solid var(--danger);color:var(--danger);}
.btn-d:hover{background:rgba(255,79,107,.1);}

.page{max-width:900px;margin:0 auto;padding:24px 20px 80px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;transition:all .25s;}
.card:hover{border-color:var(--accent);box-shadow:0 8px 40px rgba(0,0,0,0.3),0 0 30px var(--accent-glow);transform:translateY(-2px);}
.card-title{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;}

input,textarea{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--mono);font-size:13px;padding:10px 12px;outline:none;transition:border .2s;}
input:focus,textarea:focus{border-color:var(--accent);}
textarea{min-height:200px;resize:vertical;font-size:12px;line-height:1.6;}
label{font-size:12px;color:var(--muted);font-weight:600;margin-bottom:4px;display:block;}

.search-bar{display:flex;gap:10px;margin-bottom:14px;}
.search-box{flex:1;position:relative;}
.search-box svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;}
.search-box input{height:44px;padding:12px 16px 12px 42px;border-radius:12px;font-size:14px;}
.search-box input::placeholder{color:var(--muted);}
.search-box input:focus{border-color:var(--accent);box-shadow:0 0 20px var(--accent-glow);}
.search-mode-btn{align-self:stretch;height:44px;}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:18px;}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;transition:all .2s;}
.stat:hover{border-color:var(--accent);box-shadow:0 0 20px var(--accent-glow);transform:translateY(-1px);}
.stat-num{font-family:var(--mono);font-size:22px;font-weight:700;color:var(--accent);line-height:1.1;}
.stat-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:4px;}
.filter-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;}
.filter-tab{padding:8px 16px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-family:var(--mono);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;}
.filter-tab:hover{border-color:var(--accent);color:var(--text);}
.filter-tab.active{background:var(--accent);color:var(--btn-text);border-color:var(--accent);}
.filter-tab-count{font-size:10px;padding:1px 6px;border-radius:8px;background:rgba(0,0,0,0.25);color:inherit;opacity:0.85;font-weight:700;}
.filter-tab:not(.active) .filter-tab-count{background:var(--surface2);}

#skill-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}
.skill-card{position:relative;overflow:hidden;padding:14px;display:flex;align-items:center;gap:12px;aspect-ratio:16/9;transition:all .25s;cursor:default;border-radius:var(--radius);animation:fadeInUp .5s ease both;}
.skill-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--accent-glow) 0%,transparent 60%);opacity:0;transition:opacity .25s;pointer-events:none;z-index:0;}
.skill-card:hover::before{opacity:1;}
.skill-card:hover{border-color:var(--accent);box-shadow:0 8px 40px rgba(0,0,0,0.3),0 0 30px var(--accent-glow);transform:translateY(-4px);}
.skill-card.expanded{aspect-ratio:auto;align-items:flex-start;transform:none;}
.skill-card.expanded::before{opacity:1;}
.skill-card:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
.skill-card-icon{flex-shrink:0;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--accent-dim),transparent);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--accent);position:relative;z-index:1;}
.skill-card-icon svg{width:22px;height:22px;}
.skill-card-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;position:relative;z-index:1;}
.skill-card-head{display:flex;align-items:center;gap:6px;min-width:0;}
.skill-name{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;}
.skill-fork-badge{font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:6px;background:rgba(79,255,176,.15);color:var(--accent);font-weight:700;letter-spacing:.05em;flex-shrink:0;}
.skill-score{font-family:var(--mono);font-size:10px;padding:1px 6px;background:var(--accent-dim);color:var(--accent);border-radius:8px;flex-shrink:0;font-weight:700;}
.skill-desc{font-size:12px;color:var(--muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.skill-card-footer{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:auto;font-size:10px;color:var(--muted);font-family:var(--mono);}
.skill-card-footer .skill-date{margin-left:auto;}
.skill-meta{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:10px;color:var(--muted);}
.skill-tag{padding:1px 6px;border-radius:8px;background:var(--border);font-family:var(--mono);font-size:10px;}
.skill-author{font-family:var(--mono);color:var(--accent2);}
.skill-version{font-family:var(--mono);}
.skill-card-actions{position:absolute;top:8px;right:8px;display:flex;gap:4px;opacity:0;transition:opacity .2s;z-index:2;}
.skill-card:hover .skill-card-actions,.skill-card.expanded .skill-card-actions{opacity:1;}
.skill-card-actions .btn-s{padding:4px 6px;}
.skill-preview{grid-column:1/-1;width:100%;margin-top:10px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;max-height:280px;overflow:auto;font-size:12px;line-height:1.6;position:relative;z-index:1;}
.skill-detail{grid-column:1/-1;width:100%;max-height:0;overflow:hidden;opacity:0;transition:max-height .35s cubic-bezier(.4,0,.2,1),opacity .25s,padding .25s,margin .25s;border-top:1px solid transparent;margin-top:0;padding-top:0;position:relative;z-index:1;}
.skill-card.expanded .skill-detail{max-height:520px;opacity:1;border-top-color:var(--border);margin-top:10px;padding-top:12px;}
.skill-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin-bottom:12px;font-size:11px;}
.skill-detail-item{display:flex;flex-direction:column;gap:2px;}
.skill-detail-full{grid-column:1/-1;}
.skill-detail-label{color:var(--muted);font-size:10px;letter-spacing:.05em;}
.skill-detail-value{color:var(--text);font-weight:600;font-family:var(--mono);word-break:break-all;}
.skill-detail-actions{display:flex;gap:6px;flex-wrap:wrap;}
.skill-empty-reset{margin-top:10px;}
#skill-list .skill-card{margin-bottom:0;}
@media(max-width:768px){#skill-list{grid-template-columns:1fr;gap:10px;}.stat-num{font-size:18px;}.page{padding:16px 12px 60px;}}

.version-item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);}
.version-item:last-child{border-bottom:none;}
.version-num{font-family:var(--mono);font-weight:700;color:var(--accent);min-width:40px;}
.version-msg{flex:1;margin:0 12px;font-size:13px;color:var(--text);}
.version-date{font-size:11px;color:var(--muted);font-family:var(--mono);}
.version-actions{display:flex;gap:6px;}

.diff-view{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;font-family:var(--mono);font-size:12px;line-height:1.7;overflow-x:auto;white-space:pre-wrap;}
.diff-add{color:#4fffb0;}
.diff-remove{color:#ff4f6b;}
.diff-same{color:var(--muted);}

.back-link{font-size:13px;color:var(--accent);cursor:pointer;margin-bottom:16px;display:inline-block;}
.back-link:hover{text-decoration:underline;}

.empty{text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:13px;}

.md-body{font-size:13px;line-height:1.7;color:var(--text);}
.md-body pre{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;overflow-x:auto;font-size:12px;margin:8px 0;}
.md-body pre code{font-family:var(--mono);white-space:pre-wrap;}
.md-body code{font-family:var(--mono);font-size:12px;}
.md-body h2{margin:14px 0 8px;}
.md-body h3{margin:12px 0 6px;}
.md-body h4{margin:10px 0 4px;}
.md-body a{color:var(--accent2);text-decoration:none;}
.md-body a:hover{text-decoration:underline;}
.skill-card{cursor:default;}
.skill-card > div:first-child{cursor:pointer;}
.skill-card > div:first-child:hover{color:var(--accent);}

.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:var(--surface);border:1px solid var(--accent);color:var(--accent);font-family:var(--mono);padding:10px 20px;border-radius:50px;box-shadow:var(--shadow);transition:all .3s;opacity:0;z-index:999;}
.toast.show{transform:translateX(-50%) translateY(0);opacity:1;}
.toast.err{border-color:var(--danger);color:var(--danger);}

.form-row{margin-bottom:14px;}
.form-row-inline{display:flex;gap:8px;}
.form-row-inline>*{flex:1;}
</style>
</head>
<body>
<div class="topbar">
  <div class="logo" onclick="navigate('/')">${icon('logo', 22)}Skills<span>Sub</span></div>
  <div class="topbar-right">
    <button class="btn btn-p" onclick="navigate('/publish')">+ 发布 Skill</button>
    <button class="btn btn-s" onclick="navigate('/guide')">${icon('book', 16)} 教程</button>
    <button class="btn btn-s" id="theme-btn" onclick="toggleTheme()" aria-label="主题切换">${icon('moon', 16)}</button>
  </div>
</div>

<div class="page" id="app"></div>
<div class="toast" id="toast"></div>

<script>${SCRIPT_BODY}</script>
</body>
</html>`;
}
