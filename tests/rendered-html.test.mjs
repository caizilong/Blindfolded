import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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
  assert.match(html, /随机下一题/);
  assert.match(html, /揭晓答案/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
