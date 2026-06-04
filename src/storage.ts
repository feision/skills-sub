// storage.ts — KV + Vectorize 操作封装

import type { Env, SkillMeta, SkillVersion, SkillListItem } from "./types";

// ── KV Keys ──
const kSkill = (id: string) => `skill:${id}`;
const kVersion = (id: string, v: number) => `skill:${id}:v${v}`;
const kContent = (id: string, v: number) => `content:${id}:v${v}`;
const kDiff = (id: string, v: number) => `diff:${id}:v${v}`;
const kIndex = "index:skills";
const kAuthorIndex = (author: string) => `index:author:${author}`;
const kTagIndex = (tag: string) => `index:tag:${tag}`;

// ── Vectorize helpers ──

const EMBED_MODEL = "@cf/baai/bge-m3";
// bge-m3 token limit ~8192, 3000 chars ≈ 1500-2000 zh tokens，留余量
const EMBED_MAX_CHARS = 6000;

function buildEmbedText(meta: SkillMeta, content: string): string {
  return [meta.name, meta.description, content].join("\n").slice(0, EMBED_MAX_CHARS);
}

export async function embedText(env: Env, text: string): Promise<number[]> {
  const result = await env.AI.run(EMBED_MODEL, { text: text.slice(0, EMBED_MAX_CHARS) }) as { data: number[][] };
  return result.data[0];
}

export async function indexSkill(env: Env, meta: SkillMeta, content: string): Promise<void> {
  const text = buildEmbedText(meta, content);
  const values = await embedText(env, text);
  await env.VECTORIZE.upsert([{
    id: meta.id,
    values,
    metadata: {
      name: meta.name,
      description: meta.description,
      author: meta.author,
      tags: meta.tags,
    },
  }]);
}

export async function deindexSkill(env: Env, id: string): Promise<void> {
  await env.VECTORIZE.deleteByIds([id]);
}

export interface SemanticHit {
  id: string;
  score: number;
  name: string;
  description: string;
  author: string;
  tags: string[];
}

export async function semanticSearch(env: Env, query: string, topK = 10): Promise<SemanticHit[]> {
  if (!query.trim()) return [];
  const values = await embedText(env, query);
  const res = await env.VECTORIZE.query(values, { topK, returnMetadata: true });
  return (res.matches || []).map(m => {
    const md = (m.metadata || {}) as Record<string, unknown>;
    return {
      id: m.id,
      score: m.score ?? 0,
      name: String(md.name || ""),
      description: String(md.description || ""),
      author: String(md.author || ""),
      tags: Array.isArray(md.tags) ? md.tags.map(String) : [],
    };
  });
}

// ── Skill CRUD ──

export async function createSkill(env: Env, meta: SkillMeta, content: string, message: string): Promise<SkillVersion> {
  const version = 1;
  const now = new Date().toISOString();

  // 写文件内容到 KV
  await env.SKILLS_KV.put(kContent(meta.id, version), content);

  // 写版本元数据
  const ver: SkillVersion = { version, message, createdAt: now, size: new TextEncoder().encode(content).length };
  await env.SKILLS_KV.put(kVersion(meta.id, version), JSON.stringify(ver));

  // 写 skill 元数据
  meta.latestVersion = version;
  meta.updatedAt = now;
  await env.SKILLS_KV.put(kSkill(meta.id), JSON.stringify(meta));

  // 更新索引
  await addToIndex(env, kIndex, meta.id);
  await addToIndex(env, kAuthorIndex(meta.author), meta.id);
  for (const tag of meta.tags) await addToIndex(env, kTagIndex(tag), meta.id);

  // 语义索引（失败不阻塞主流程）
  try { await indexSkill(env, meta, content); }
  catch (e) { console.error("indexSkill failed:", e); }

  return ver;
}

export async function updateSkill(env: Env, id: string, content: string, message: string): Promise<SkillVersion | null> {
  const meta = await getSkillMeta(env, id);
  if (!meta) return null;

  const version = meta.latestVersion + 1;
  const now = new Date().toISOString();

  // 读旧版本生成 diff
  const oldContent = await readContent(env, id, version - 1);
  if (oldContent !== null) {
    const diff = generateDiff(oldContent, content);
    await env.SKILLS_KV.put(kDiff(id, version), diff);
  }

  // 写新版本到 KV
  await env.SKILLS_KV.put(kContent(id, version), content);

  // 写版本元数据
  const ver: SkillVersion = { version, message, createdAt: now, size: new TextEncoder().encode(content).length };
  await env.SKILLS_KV.put(kVersion(id, version), JSON.stringify(ver));

  // 更新 skill 元数据
  meta.latestVersion = version;
  meta.updatedAt = now;
  await env.SKILLS_KV.put(kSkill(id), JSON.stringify(meta));

  // 重新语义索引
  try { await indexSkill(env, meta, content); }
  catch (e) { console.error("indexSkill failed:", e); }

  return ver;
}

export async function getSkillMeta(env: Env, id: string): Promise<SkillMeta | null> {
  const raw = await env.SKILLS_KV.get(kSkill(id));
  return raw ? JSON.parse(raw) : null;
}

export async function deleteSkill(env: Env, id: string): Promise<boolean> {
  const meta = await getSkillMeta(env, id);
  if (!meta) return false;

  // 删所有 KV 数据
  await env.SKILLS_KV.delete(kSkill(id));
  for (let v = 1; v <= meta.latestVersion; v++) {
    await env.SKILLS_KV.delete(kVersion(id, v));
    await env.SKILLS_KV.delete(kContent(id, v));
    await env.SKILLS_KV.delete(kDiff(id, v));
  }

  // 从索引移除
  await removeFromIndex(env, kIndex, id);
  await removeFromIndex(env, kAuthorIndex(meta.author), id);
  for (const tag of meta.tags) await removeFromIndex(env, kTagIndex(tag), id);

  // 语义索引移除
  try { await deindexSkill(env, id); }
  catch (e) { console.error("deindexSkill failed:", e); }

  return true;
}

// ── 版本 ──

export async function getVersion(env: Env, id: string, v: number): Promise<SkillVersion | null> {
  const raw = await env.SKILLS_KV.get(kVersion(id, v));
  return raw ? JSON.parse(raw) : null;
}

export async function listVersions(env: Env, id: string): Promise<SkillVersion[]> {
  const meta = await getSkillMeta(env, id);
  if (!meta) return [];
  const versions: SkillVersion[] = [];
  for (let v = 1; v <= meta.latestVersion; v++) {
    const ver = await getVersion(env, id, v);
    if (ver) versions.push(ver);
  }
  return versions.reverse();
}

export async function readContent(env: Env, id: string, v: number): Promise<string | null> {
  return await env.SKILLS_KV.get(kContent(id, v));
}

export async function downloadSkill(env: Env, id: string, version?: number): Promise<{ content: string; contentType: string } | null> {
  const meta = await getSkillMeta(env, id);
  if (meta) {
    const v = version || meta.latestVersion;
    const content = await readContent(env, id, v);
    if (content) return { content, contentType: "text/markdown; charset=utf-8" };
  }
  return null;
}

export async function getDiff(env: Env, id: string, v: number): Promise<string | null> {
  return await env.SKILLS_KV.get(kDiff(id, v));
}

// ── 列表/搜索 ──

export async function listSkills(env: Env, opts: { search?: string; tag?: string; author?: string } = {}): Promise<SkillListItem[]> {
  let ids: string[] = [];

  if (opts.author) {
    const raw = await env.SKILLS_KV.get(kAuthorIndex(opts.author));
    ids = raw ? JSON.parse(raw) : [];
  } else if (opts.tag) {
    const raw = await env.SKILLS_KV.get(kTagIndex(opts.tag));
    ids = raw ? JSON.parse(raw) : [];
  } else {
    const raw = await env.SKILLS_KV.get(kIndex);
    ids = raw ? JSON.parse(raw) : [];
  }

  const items: SkillListItem[] = [];
  for (const id of ids) {
    const meta = await getSkillMeta(env, id);
    if (!meta) continue;
    if (opts.search) {
      const q = opts.search.toLowerCase();
      if (!meta.name.toLowerCase().includes(q) && !meta.description.toLowerCase().includes(q)) continue;
    }
    items.push({
      id: meta.id, name: meta.name, description: meta.description,
      author: meta.author, authorType: meta.authorType,
      tags: meta.tags, latestVersion: meta.latestVersion, updatedAt: meta.updatedAt,
    });
  }
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// ── 索引操作 ──

async function addToIndex(env: Env, key: string, id: string) {
  const raw = await env.SKILLS_KV.get(key);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  if (!ids.includes(id)) { ids.push(id); await env.SKILLS_KV.put(key, JSON.stringify(ids)); }
}

async function removeFromIndex(env: Env, key: string, id: string) {
  const raw = await env.SKILLS_KV.get(key);
  if (!raw) return;
  const ids: string[] = JSON.parse(raw);
  const filtered = ids.filter(i => i !== id);
  await env.SKILLS_KV.put(key, JSON.stringify(filtered));
}

// ── Diff 引擎 ──

function generateDiff(oldText: string, newText: string): string {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: string[] = [];

  // 简单 LCS diff
  const lcs = lcsMatrix(oldLines, newLines);
  let i = oldLines.length, j = newLines.length;
  const ops: { type: "add" | "remove" | "same"; oldLine?: number; newLine?: number; content: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i-1] === newLines[j-1]) {
      ops.unshift({ type: "same", oldLine: i, newLine: j, content: oldLines[i-1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || lcs[i][j-1] >= lcs[i-1][j])) {
      ops.unshift({ type: "add", newLine: j, content: newLines[j-1] });
      j--;
    } else {
      ops.unshift({ type: "remove", oldLine: i, content: oldLines[i-1] });
      i--;
    }
  }

  for (const op of ops) {
    if (op.type === "same") result.push(`  ${op.content}`);
    else if (op.type === "add") result.push(`+ ${op.content}`);
    else result.push(`- ${op.content}`);
  }
  return result.join("\n");
}

function lcsMatrix(a: string[], b: string[]): number[][] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp;
}
