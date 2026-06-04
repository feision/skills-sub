// src/index.ts — skills-sub Worker 入口 + 前端 SPA

import { handleApi } from "./api";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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

function buildPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Skills Sub</title>
<style>
:root{--bg:#0b0d11;--surface:#13161d;--surface2:#1a1e28;--border:#262c3a;--accent:#4fffb0;--accent2:#00b8ff;--danger:#ff4f6b;--warn:#ffb84f;--text:#e2e8f0;--muted:#64748b;--accent-dim:rgba(79,255,176,.1);--shadow:0 4px 20px rgba(0,0,0,0.3);--mono:'JetBrains Mono',monospace;--sans:'Inter','PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif;--btn-text:#000;}
:root[data-theme='light']{--bg:#f4f7f9;--surface:#ffffff;--surface2:#f0f2f5;--border:#e2e8f0;--text:#1e293b;--muted:#64748b;--accent:#F38020;--accent-dim:rgba(243,128,32,.1);--btn-text:#ffffff;--shadow:0 4px 12px rgba(0,0,0,0.05);}
@media(prefers-color-scheme:light){:root:not([data-theme='dark']){--bg:#f4f7f9;--surface:#ffffff;--surface2:#f0f2f5;--border:#e2e8f0;--text:#1e293b;--muted:#64748b;--accent:#F38020;--accent-dim:rgba(243,128,32,.1);--btn-text:#ffffff;--shadow:0 4px 12px rgba(0,0,0,0.05);}}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:var(--sans);background:var(--bg);color:var(--text);min-height:100vh;transition:background .3s,color .3s;}

.topbar{position:sticky;top:0;z-index:100;background:var(--topbar-bg,rgba(11,13,17,.92));backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:12px 24px;display:flex;align-items:center;gap:16px;}
.logo{font-family:var(--mono);font-size:18px;font-weight:700;color:var(--accent);cursor:pointer;}
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
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:16px;transition:all .2s;}
.card:hover{border-color:var(--accent-dim);}
.card-title{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;}

input,textarea{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--mono);font-size:13px;padding:10px 12px;outline:none;transition:border .2s;}
input:focus,textarea:focus{border-color:var(--accent);}
textarea{min-height:200px;resize:vertical;font-size:12px;line-height:1.6;}
label{font-size:12px;color:var(--muted);font-weight:600;margin-bottom:4px;display:block;}

.search-bar{display:flex;gap:8px;margin-bottom:20px;}
.search-bar input{flex:1;}

.skill-card{cursor:pointer;}
.skill-card:hover{border-color:var(--accent);box-shadow:0 4px 20px var(--accent-dim);transform:translateY(-2px);}
.skill-name{font-family:var(--mono);font-size:15px;font-weight:700;color:var(--accent);margin-bottom:4px;}
.skill-desc{font-size:13px;color:var(--muted);line-height:1.5;margin-bottom:8px;}
.skill-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:11px;color:var(--muted);}
.skill-tag{padding:2px 8px;border-radius:10px;background:var(--border);font-family:var(--mono);font-size:10px;}
.skill-author{font-family:var(--mono);color:var(--accent2);}
.skill-version{font-family:var(--mono);}

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
  <div class="logo" onclick="navigate('/')">Skills<span>Sub</span></div>
  <div class="topbar-right">
    <button class="btn btn-p" onclick="navigate('/publish')">+ 发布 Skill</button>
    <button class="btn btn-s" onclick="navigate('/guide')">📖 教程</button>
    <button class="btn btn-s" id="theme-btn" onclick="toggleTheme()">🌓</button>
  </div>
</div>

<div class="page" id="app"></div>
<div class="toast" id="toast"></div>

<script>
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
async function renderHome(el) {
  el.innerHTML = '<div class="empty">加载中...</div>';
  try {
    var res = await api('GET', '/api/skills');
    var skills = res.skills || [];
    var html = '<div class="card-title">Browse Skills</div>';
    html += '<div class="search-bar"><input id="search-input" placeholder="搜索 skill..." oninput="filterList(this.value)"></div>';
    html += '<div id="skill-list">';
    html += skills.map(renderSkillCard).join('');
    html += '</div>';
    if (!skills.length) html += '<div class="empty">暂无 Skill，点击上方发布第一个</div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div class="empty">加载失败: ' + e.message + '</div>';
  }
}

function renderSkillCard(s) {
  var tags = (s.tags||[]).map(function(t){ return '<span class="skill-tag">#'+t+'</span>'; }).join('');
  return '<div class="card skill-card" data-id="' + s.id + '" onclick="navigate(\'/skill/\'+this.dataset.id)">'
    + '<div class="skill-name">' + esc(s.name) + '</div>'
    + '<div class="skill-desc">' + esc(s.description) + '</div>'
    + '<div class="skill-meta">'
    + '<span class="skill-author">@' + esc(s.author) + '</span>'
    + '<span class="skill-version">v' + s.latestVersion + '</span>'
    + tags
    + '</div></div>';
}

function filterList(q) {
  q = q.toLowerCase();
  document.querySelectorAll('.skill-card').forEach(function(c) {
    var text = c.textContent.toLowerCase();
    c.style.display = text.indexOf(q) >= 0 ? '' : 'none';
  });
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

    var tags = (skill.tags||[]).map(function(t){ return '<span class="skill-tag">#'+t+'</span>'; }).join(' ');

    var html = '<div class="back-link" onclick="navigate(\'/\')">← 返回列表</div>';
    html += '<div class="card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:start;">';
    html += '<div><div class="skill-name" style="font-size:20px;">' + esc(skill.name) + '</div>';
    html += '<div class="skill-desc" style="margin-top:6px;">' + esc(skill.description) + '</div>';
    html += '<div class="skill-meta" style="margin-top:8px;"><span class="skill-author">@' + esc(skill.author) + '</span> ' + tags + '</div></div>';
    html += '<div style="display:flex;gap:6px;flex-shrink:0;">';
    html += '<button class="btn btn-p" data-id="' + id + '" onclick="downloadVersion(this.dataset.id,0)">⬇ 下载</button>';
    html += '<button class="btn btn-d" data-id="' + id + '" onclick="deleteSkill(this.dataset.id)">删除</button>';
    html += '</div></div></div>';

    html += '<div class="card"><div class="card-title">Version History (' + (skill.versions||[]).length + ')</div>';
    html += versions || '<div class="empty">无版本记录</div>';
    html += '</div>';

    html += '<div id="diff-area"></div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div class="empty">加载失败: ' + e.message + '</div>';
  }
}

async function showDiff(id, v) {
  var area = document.getElementById('diff-area');
  if (!area) return;
  area.innerHTML = '<div class="card"><div class="card-title">Diff v' + v + '</div><div class="diff-view">加载中...</div></div>';
  try {
    var res = await fetch('/api/skills/' + id + '/versions/' + v + '/diff', { headers: { 'Authorization': 'Bearer ' + API_KEY } });
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
  window.open(url + (url.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(API_KEY), '_blank');
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
  el.innerHTML = '<div class="back-link" onclick="navigate(\'/\')">← 返回列表</div>'
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
  el.innerHTML = '<div class="back-link" onclick="navigate(\'/\')">← 返回列表</div>'
    + '<div class="card"><div class="card-title">📖 Skills Sub 使用教程</div>'
    + '<div class="skill-desc" style="margin-bottom:20px;">Skills Sub 是一个 Claude Code Skills 分享平台。你可以在这里发布、浏览、下载 AI Agent 的 Skills（技能文件）。</div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">🔑 第一步：获取 API Key</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>打开浏览器控制台（F12），输入以下命令获取你的 API Key：</p>'
    + '<div class="diff-view" style="margin:10px 0;">localStorage.getItem("api_key")</div>'
    + '<p>如果没有设置，页面会弹窗提示输入。联系管理员获取。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">📦 第二步：发布 Skill</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>1. 点击顶栏「+ 发布 Skill」按钮</p>'
    + '<p>2. 填写名称（如 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">my-weather-skill</code>）</p>'
    + '<p>3. 填写描述（一句话说明用途）</p>'
    + '<p>4. 填写作者名（你的 agent 名称或你的名字）</p>'
    + '<p>5. 填写标签（逗号分隔，如 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">weather, api, openai</code>）</p>'
    + '<p>6. 粘贴你的 SKILL.md 文件内容到大文本框</p>'
    + '<p>7. 点击「发布 Skill」</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">🔍 第三步：浏览和搜索</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>首页展示所有已发布的 Skills。你可以：</p>'
    + '<p>• 在搜索框输入关键词过滤</p>'
    + '<p>• 点击卡片查看详情、版本历史、下载</p>'
    + '<p>• 点击标签筛选同类 Skill</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">⬇️ 第四步：下载 Skill</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>进入 Skill 详情页，点击「下载」按钮获取 SKILL.md 文件。</p>'
    + '<p>下载后放入 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">.claude/skills/&lt;skill-name&gt;/</code> 目录即可使用。</p>'
    + '<p>Agent（如 Claude Code）会在对话中自动识别并加载该 Skill。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">🔄 第五步：更新 Skill</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>进入你的 Skill 详情页，点击「更新」按钮。</p>'
    + '<p>每次更新会自动创建新版本，并生成与上一版本的 diff。</p>'
    + '<p>你可以随时下载任意历史版本。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">🤖 Agent 集成</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>如果你运行多个 Agent（如 Claude Code、OpenClaw），每个 Agent 可以：</p>'
    + '<p>• 用自己的 API Key 发布专属 Skill</p>'
    + '<p>• 浏览其他 Agent 发布的 Skill</p>'
    + '<p>• 通过版本历史追踪 Skill 演进</p>'
    + '<p>每个 Agent 有独立的作者名，互不干扰。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">📡 API 快速参考</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>所有请求需要 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">Authorization: Bearer &lt;API_KEY&gt;</code></p>'
    + '<div class="diff-view" style="margin:10px 0; font-size:11px;">'
    + '# 发布\n'
    + 'curl -X POST https://skills-sub.ducksaylow.workers.dev/api/skills \\\\\n'
    + '  -H "Authorization: Bearer YOUR_KEY" \\\\\n'
    + '  -H "Content-Type: application/json" \\\\\n'
    + '  -d \'{"name":"my-skill","description":"...","content":"# SKILL.md内容"}\'\n\n'
    + '# 浏览\n'
    + 'curl "https://skills-sub.ducksaylow.workers.dev/api/skills"\n\n'
    + '# 下载\n'
    + 'curl "https://skills-sub.ducksaylow.workers.dev/api/skills/SKILL_ID/download"\n\n'
    + '# 更新\n'
    + 'curl -X PUT https://skills-sub.ducksaylow.workers.dev/api/skills/SKILL_ID \\\\\n'
    + '  -H "Authorization: Bearer YOUR_KEY" \\\\\n'
    + '  -H "Content-Type: application/json" \\\\\n'
    + '  -d \'{"content":"新内容","message":"更新说明"}\'\n\n'
    + '# 删除\n'
    + 'curl -X DELETE https://skills-sub.ducksaylow.workers.dev/api/skills/SKILL_ID \\\\\n'
    + '  -H "Authorization: Bearer YOUR_KEY"'
    + '</div>'
    + '</div></div>'

    + '<div style="text-align:center;margin-top:30px;">'
    + '<button class="btn btn-p" onclick="navigate(\'/\')" style="padding:12px 24px;">开始浏览 Skills →</button>'
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
  var opts = { method: method, headers: { 'Authorization': 'Bearer ' + API_KEY, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(path, opts);
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
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
  API_KEY = localStorage.getItem('api_key') || prompt('请输入 API Key:') || '';
  if (API_KEY) localStorage.setItem('api_key', API_KEY);
  window.addEventListener('hashchange', route);
  route();
})();
</script>
</body>
</html>`;
}
