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


const SCRIPT_BODY = String.raw`
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

async function renderHome(el) {
  el.innerHTML = '<div class="empty">加载中...</div>';
  try {
    var res = await api('GET', '/api/skills');
    ALL_SKILLS = res.skills || [];
    SEMANTIC_RESULTS = null;
    var html = '<div class="card-title">Browse Skills</div>';
    html += '<div class="search-bar">';
    html += '<input id="search-input" placeholder="搜索 skill..." oninput="onSearchInput(this.value)" style="flex:1;">';
    html += '<button class="btn btn-s" id="search-mode-btn" onclick="toggleSearchMode()" style="padding:8px 12px;font-size:11px;">🔍 关键词</button>';
    html += '</div>';
    html += '<div id="search-status" class="empty" style="font-size:11px;padding:8px;display:none;"></div>';
    html += '<div id="skill-list">';
    html += ALL_SKILLS.map(renderSkillCard).join('');
    html += '</div>';
    if (!ALL_SKILLS.length) html += '<div class="empty">暂无 Skill，点击上方发布第一个</div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div class="empty">加载失败: ' + e.message + '</div>';
  }
}

function renderSkillCard(s) {
  var tags = (s.tags||[]).map(function(t){ return '<span class="skill-tag">#'+t+'</span>'; }).join('');
  var score = s.score != null ? '<span class="skill-tag" style="background:var(--accent-dim);color:var(--accent);">' + (s.score*100).toFixed(0) + '%</span>' : '';
  return '<div class="card skill-card" data-id="' + s.id + '">'
    + '<div onclick="navigate(\'/skill/\'+this.dataset.id)" data-id="' + s.id + '">'
    + '<div class="skill-name">' + esc(s.name) + score + '</div>'
    + '<div class="skill-desc">' + esc(s.description) + '</div>'
    + '<div class="skill-meta">'
    + '<span class="skill-author">@' + esc(s.author) + '</span>'
    + '<span class="skill-version">v' + s.latestVersion + '</span>'
    + tags
    + '</div></div>'
    + '<div style="margin-top:10px;display:flex;gap:6px;">'
    + '<button class="btn btn-s" data-id="' + s.id + '" onclick="togglePreview(this.dataset.id,this)" style="padding:4px 10px;font-size:11px;">👁 预览</button>'
    + '<button class="btn btn-s" data-id="' + s.id + '" onclick="navigate(\'/skill/\'+this.dataset.id)" style="padding:4px 10px;font-size:11px;">详情 →</button>'
    + '</div>'
    + '<div class="skill-preview" id="prev-' + s.id + '" style="display:none;margin-top:10px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;max-height:300px;overflow:auto;font-size:12px;line-height:1.6;"></div>'
    + '</div>';
}

function toggleSearchMode() {
  SEARCH_MODE = SEARCH_MODE === 'keyword' ? 'semantic' : 'keyword';
  var btn = document.getElementById('search-mode-btn');
  if (btn) btn.textContent = SEARCH_MODE === 'keyword' ? '🔍 关键词' : '🧠 语义';
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
    list.innerHTML = ALL_SKILLS.map(renderSkillCard).join('');
    hideStatus();
    return;
  }
  try {
    var res = await api('GET', '/api/skills/semantic-search?q=' + encodeURIComponent(q) + '&topK=20');
    var results = res.results || [];
    list.innerHTML = results.length
      ? results.map(renderSkillCard).join('')
      : '<div class="empty">未找到匹配的 skill</div>';
    var status = document.getElementById('search-status');
    if (status) status.textContent = '语义搜索 "' + esc(q) + '" · 命中 ' + results.length + ' 个';
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
  document.querySelectorAll('.skill-card').forEach(function(c) {
    var text = c.textContent.toLowerCase();
    c.style.display = text.indexOf(q) >= 0 ? '' : 'none';
  });
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
  if (!area) return;
  if (area.style.display !== 'none') { area.style.display = 'none'; btn.textContent = '👁 预览'; return; }
  btn.textContent = '⏳ 加载…';
  btn.disabled = true;
  try {
    if (!PREVIEW_CACHE[id]) {
      var res = await api('GET', '/api/skills/' + id + '/preview?chars=600&lines=30');
      PREVIEW_CACHE[id] = res;
    }
    var p = PREVIEW_CACHE[id];
    area.innerHTML = renderMarkdown(p.content)
      + (p.truncated ? '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);color:var(--muted);font-size:11px;">已截断 (显示 ' + p.shownLines + '/' + p.totalLines + ' 行, ' + p.shownChars + '/' + p.totalChars + ' 字符) · <a href="#/skill/' + id + '" style="color:var(--accent);">查看完整 →</a></div>' : '');
    area.style.display = 'block';
    btn.textContent = '🙈 收起';
  } catch (e) {
    area.innerHTML = '<div style="color:var(--danger);">加载失败: ' + esc(e.message) + '</div>';
    area.style.display = 'block';
    btn.textContent = '👁 重试';
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

    var tags = (skill.tags||[]).map(function(t){ return '<span class="skill-tag">#'+t+'</span>'; }).join(' ');

    var html = '<div class="back-link" onclick="navigate(\'/\')">← 返回列表</div>';
    html += '<div class="card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:start;">';
    html += '<div><div class="skill-name" style="font-size:20px;">' + esc(skill.name) + '</div>';
    html += '<div class="skill-desc" style="margin-top:6px;">' + esc(skill.description) + '</div>';
    html += '<div class="skill-meta" style="margin-top:8px;"><span class="skill-author">@' + esc(skill.author) + '</span> ' + tags + '</div></div>';
    html += '<div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;">';
    html += '<button class="btn btn-p" data-id="' + id + '" onclick="downloadVersion(this.dataset.id,0)">⬇ 下载</button>';
    html += '<button class="btn btn-s" data-id="' + id + '" data-name="' + esc(skill.name) + '" onclick="copyInstall(this.dataset.id,this.dataset.name,this)">📋 复制 cURL</button>';
    html += '<button class="btn btn-s" data-id="' + id + '" onclick="copyContent(this.dataset.id,this)">📄 复制内容</button>';
    html += '<button class="btn btn-d" data-id="' + id + '" onclick="deleteSkill(this.dataset.id)">删除</button>';
    html += '</div></div></div>';

    html += '<div class="card"><div class="card-title">Version History (' + (skill.versions||[]).length + ')</div>';
    html += versions || '<div class="empty">无版本记录</div>';
    html += '</div>';

    html += '<div class="card"><div class="card-title">📄 Skill 内容 (v' + skill.latestVersion + ')</div><div id="content-area"><div class="empty">加载中...</div></div></div>';

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
  btn.textContent = '⏳';
  try {
    var res = await api('GET', '/api/skills/' + id + '/preview?chars=20000&lines=500');
    await copyText(res.content, btn, '已复制 SKILL.md 内容');
  } catch (e) {
    toast('复制失败: ' + e.message, true);
    btn.textContent = '📄 复制内容';
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
    if (btn) { var orig = btn.textContent; btn.textContent = '✅ 已复制'; setTimeout(function(){ btn.textContent = orig; }, 1500); }
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
    + '<div class="skill-desc" style="margin-bottom:20px;">Skills Sub 是一个 Claude Code Skills 分享平台。读操作全部公开，发布/更新/删除需要 API Key。内置语义搜索（bge-m3 多语 embedding）。</div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">🔑 API Key</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>首次点击「+ 发布 Skill」、「删除」或复制内容时，浏览器会弹窗让你输入 API Key。</p>'
    + '<p>Key 保存到 localStorage，之后不再问。清除方法：<code style="font-family:var(--mono);font-size:12px;color:var(--accent);">localStorage.removeItem("api_key")</code></p>'
    + '<p>读操作（浏览、搜索、预览、下载）无需 Key，<strong>任何 Agent 可直接调用</strong>。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">📦 发布 Skill</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>1. 点「+ 发布 Skill」</p>'
    + '<p>2. 名称（如 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">my-weather-skill</code>）、描述、作者、标签（逗号分隔）</p>'
    + '<p>3. 粘贴 SKILL.md 全文 → 发布</p>'
    + '<p>发布成功后自动 embed 进 Vectorize，秒级可被语义搜索检索到。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">🔍 浏览与搜索</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>• <strong>关键词模式</strong>（默认）：客户端过滤 name/description</p>'
    + '<p>• <strong>语义模式</strong>：点搜索框右侧「🔍 关键词」→「🧠 语义」切换，用自然语言描述需求（中文/英文均可）</p>'
    + '<p>语义搜索走 CF Vectorize + bge-m3，召回按相似度%排序</p>'
    + '<p>• 首页点「👁 预览」inline 展开前 30 行 markdown</p>'
    + '<p>• 点卡片进详情：完整内容渲染 + 版本历史 + diff</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">⬇️ 下载与安装</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>详情页三个按钮：</p>'
    + '<p>• <strong>⬇ 下载</strong>：浏览器下载 SKILL.md</p>'
    + '<p>• <strong>📋 复制 cURL</strong>：一键复制安装命令，agent 粘到 shell 就装好：</p>'
    + '<div class="diff-view" style="margin:8px 0;">mkdir -p ~/.claude/skills/NAME && curl -L URL -o ~/.claude/skills/NAME/SKILL.md</div>'
    + '<p>• <strong>📄 复制内容</strong>：复制 SKILL.md 全文到剪贴板</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">🔄 更新 Skill</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>详情页的「复制 cURL」按钮旁暂未提供 update UI。当前通过 API PUT：</p>'
    + '<div class="diff-view" style="margin:8px 0;">curl -X PUT -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\<br>  -d \'{"content":"# new version","message":"fix typo"}\' \\<br>  https://skills-sub.ducksaylow.workers.dev/api/skills/ID</div>'
    + '<p>每次更新自动 embed 到向量索引。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">🤖 Agent 集成</h3>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.8;">'
    + '<p>Agent 可用 GET 接口自给自足：</p>'
    + '<p>1. 用 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">/api/skills/semantic-search?q=...</code> 发现相关 skill</p>'
    + '<p>2. 用 <code style="font-family:var(--mono);font-size:12px;color:var(--accent);">/api/skills/ID/download</code> 拉取内容</p>'
    + '<p>3. 写到自己 skills 目录</p>'
    + '<p>无需 API Key 即可完成整套流程。</p>'
    + '</div></div>'

    + '<div style="margin-bottom:20px;"><h3 style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:12px;">📡 API 快速参考</h3>'
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
  API_KEY = localStorage.getItem('api_key') || prompt('请输入 API Key:') || '';
  if (API_KEY) localStorage.setItem('api_key', API_KEY);
  window.addEventListener('hashchange', route);
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
  <div class="logo" onclick="navigate('/')">Skills<span>Sub</span></div>
  <div class="topbar-right">
    <button class="btn btn-p" onclick="navigate('/publish')">+ 发布 Skill</button>
    <button class="btn btn-s" onclick="navigate('/guide')">📖 教程</button>
    <button class="btn btn-s" id="theme-btn" onclick="toggleTheme()">🌓</button>
  </div>
</div>

<div class="page" id="app"></div>
<div class="toast" id="toast"></div>

<script>${SCRIPT_BODY}</script>
</body>
</html>`;
}
