// api.ts — REST API 处理

import type { Env, SkillMeta, SkillListItem } from "./types";
import {
  createSkill, updateSkill, getSkillMeta, deleteSkill,
  listSkills, getVersion, listVersions, downloadSkill, getDiff,
  semanticSearch, indexSkill, readContent,
} from "./storage";

// ── 工具函数 ──

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

function bad(message: string) { return json({ ok: false, error: message }, { status: 400 }); }
function notFound(message: string) { return json({ ok: false, error: message }, { status: 404 }); }

function auth(request: Request, env: Env): boolean {
  const h = request.headers.get("Authorization");
  return h === `Bearer ${env.API_KEY}`;
}

function requireAuth(request: Request, env: Env): Response | null {
  return auth(request, env) ? null : new Response("Unauthorized", { status: 401 });
}

function genId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + crypto.randomUUID().slice(0, 6);
}

// ── 路由 ──

export async function handleApi(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  const method = request.method;
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts[0] !== "api") return null;

  // GET 公开，POST/PUT/DELETE 鉴权
  if (method !== "GET" && method !== "HEAD") {
    const denied = requireAuth(request, env);
    if (denied) return denied;
  }

  // GET /api/skills — 列表
  if (parts.length === 2 && parts[1] === "skills" && method === "GET") {
    const search = url.searchParams.get("search") || undefined;
    const tag = url.searchParams.get("tag") || undefined;
    const author = url.searchParams.get("author") || undefined;
    const skills = await listSkills(env, { search, tag, author });
    return json({ skills, total: skills.length });
  }

  // POST /api/skills — 发布
  if (parts.length === 2 && parts[1] === "skills" && method === "POST") {
    try {
      const body = await request.json() as any;
      if (!body?.name || !body?.content) return bad("name and content required");
      const meta: SkillMeta = {
        id: genId(body.name),
        name: body.name,
        description: body.description || "",
        author: body.author || "anonymous",
        authorType: body.authorType || "human",
        tags: body.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        latestVersion: 1,
      };
      const ver = await createSkill(env, meta, body.content, body.message || "initial version");
      return json({ ok: true, id: meta.id, version: ver.version }, { status: 201 });
    } catch (e: any) {
      return bad(e.message);
    }
  }

  // /api/skills/:id — 详情/更新/删除
  if (parts.length === 3 && parts[1] === "skills" && parts[2] !== "semantic-search") {
    const id = parts[2];

    if (method === "GET") {
      const meta = await getSkillMeta(env, id);
      if (!meta) return notFound("skill not found");
      const versions = await listVersions(env, id);
      return json({ ...meta, versions });
    }

    if (method === "PUT") {
      try {
        const body = await request.json() as any;
        if (!body?.content) return bad("content required");
        const ver = await updateSkill(env, id, body.content, body.message || "update");
        if (!ver) return notFound("skill not found");
        return json({ ok: true, version: ver.version });
      } catch (e: any) {
        return bad(e.message);
      }
    }

    if (method === "DELETE") {
      const ok = await deleteSkill(env, id);
      if (!ok) return notFound("skill not found");
      return json({ ok: true });
    }
  }

  // GET /api/skills/:id/download — 下载
  if (parts.length === 4 && parts[1] === "skills" && parts[3] === "download" && method === "GET") {
    const v = url.searchParams.get("v") ? Number(url.searchParams.get("v")) : undefined;
    const result = await downloadSkill(env, parts[2], v);
    if (!result) return notFound("skill or version not found");
    return new Response(result.content, { headers: { "Content-Type": result.contentType, "Content-Disposition": `attachment; filename="SKILL.md"` } });
  }

  // GET /api/skills/:id/preview?chars=500&lines=20 — 预览截断
  if (parts.length === 4 && parts[1] === "skills" && parts[3] === "preview" && method === "GET") {
    const maxChars = Math.min(Number(url.searchParams.get("chars") || 600), 4000);
    const maxLines = Math.min(Number(url.searchParams.get("lines") || 30), 200);
    const result = await downloadSkill(env, parts[2]);
    if (!result) return notFound("skill not found");
    const text = result.content;
    const lines = text.split("\n");
    let truncated = lines.slice(0, maxLines).join("\n");
    if (truncated.length > maxChars) truncated = truncated.slice(0, maxChars);
    const totalLines = lines.length;
    const shownLines = Math.min(maxLines, totalLines);
    return json({
      content: truncated,
      truncated: shownLines < totalLines || truncated.length < text.length,
      totalLines,
      totalChars: text.length,
      shownLines,
      shownChars: truncated.length,
    });
  }

  // GET /api/skills/:id/versions — 版本列表
  if (parts.length === 4 && parts[1] === "skills" && parts[3] === "versions" && method === "GET") {
    const versions = await listVersions(env, parts[2]);
    return json({ versions });
  }

  // GET /api/skills/:id/versions/:v/diff — diff
  if (parts.length === 6 && parts[1] === "skills" && parts[3] === "versions" && parts[5] === "diff" && method === "GET") {
    const diff = await getDiff(env, parts[2], Number(parts[4]));
    if (diff === null) return notFound("diff not found");
    return new Response(diff, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  // GET /api/skills/:id/versions/:v — 下载指定版本
  if (parts.length === 5 && parts[1] === "skills" && parts[3] === "versions" && method === "GET") {
    const result = await downloadSkill(env, parts[2], Number(parts[4]));
    if (!result) return notFound("version not found");
    return new Response(result.content, { headers: { "Content-Type": result.contentType } });
  }

  // GET /api/skills/semantic-search?q=...&topK=N — 语义搜索
  if (parts.length === 3 && parts[1] === "skills" && parts[2] === "semantic-search" && method === "GET") {
    const q = url.searchParams.get("q") || "";
    const topK = Math.min(Number(url.searchParams.get("topK") || 10), 50);
    try {
      const hits = await semanticSearch(env, q, topK);
      return json({ query: q, total: hits.length, results: hits });
    } catch (e: any) {
      return json({ ok: false, error: e.message, results: [] }, { status: 500 });
    }
  }

  // POST /api/admin/reindex — 全量重建语义索引（需 API Key）
  if (parts.length === 3 && parts[1] === "admin" && parts[2] === "reindex" && method === "POST") {
    const skills = await listSkills(env, {});
    let ok = 0, fail = 0;
    for (const item of skills) {
      try {
        const meta = await getSkillMeta(env, item.id);
        if (!meta) continue;
        const content = await readContent(env, item.id, meta.latestVersion);
        if (!content) continue;
        await indexSkill(env, meta, content);
        ok++;
      } catch (e) {
        fail++;
        console.error("reindex", item.id, e);
      }
    }
    return json({ ok: true, total: skills.length, indexed: ok, failed: fail });
  }

  return null;
}
