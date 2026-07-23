import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server renders the blindfolded training desk", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>三阶盲拧编码训练器<\/title>/i);
  assert.match(html, /三阶盲拧编码训练器/);
  assert.match(html, /黄顶红前/);
  assert.match(html, /随机下一个公式/);
  assert.match(html, /回看上一个公式/);
  assert.match(html, /揭晓答案/);
  assert.match(html, /公式参考/);
  assert.doesNotMatch(html, /orientation-badge/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server renders the formula reference as real HTML", async () => {
  const response = await render("/reference");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>盲拧公式参考手册<\/title>/i);
  assert.match(html, /魔方编码/);
  assert.match(html, /Jb Perm/);
  assert.match(html, />翻色</);
  assert.match(html, /Setup 公式/);
  assert.match(html, /U(&#x27;|') \(R U R(&#x27;|') F(&#x27;|')\)/);
  assert.match(html, /F2 U(&#x27;|') F2/);
  assert.match(html, /E(&#x27;|') L E(&#x27;|')2 L(&#x27;|')/);
  assert.match(html, /BV1jm9eBoEgA/);
  assert.match(html, /lyt0112\.com\/blog\/blindfold-zh/);
  assert.doesNotMatch(html, /奇偶处理使用完整公式/);
  assert.doesNotMatch(html, /codex-clipboard|\.xlsx|<img\b/i);
});
