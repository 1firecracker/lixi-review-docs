import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import test from "node:test";

const artifactRoot = new URL("../dist-pages/", import.meta.url);

test("Pages build contains the static app and complete content snapshot", async () => {
  const requiredFiles = [
    "index.html",
    "content/manifest.json",
    "content/site-config.json",
  ];

  for (const path of requiredFiles) {
    assert.equal((await stat(new URL(path, artifactRoot))).isFile(), true, path);
  }

  const manifest = JSON.parse(
    await readFile(new URL("content/manifest.json", artifactRoot), "utf8"),
  );
  assert.ok(manifest.files.length > 0, "expected at least one published source file");
  assert.equal(
    (await stat(new URL(`content/raw/${manifest.files[0].path}`, artifactRoot))).isFile(),
    true,
  );

  const siteConfig = JSON.parse(
    await readFile(new URL("content/site-config.json", artifactRoot), "utf8"),
  );
  assert.equal(siteConfig.schemaVersion, 1);
  assert.equal(typeof siteConfig.siteName, "string");
  assert.ok(siteConfig.siteName.trim().length > 0);
  assert.equal("sourceDir" in siteConfig, false);

  const assets = await readdir(new URL("assets/", artifactRoot));
  assert.ok(
    assets.some((name) => /-[A-Za-z0-9_-]+\.js$/.test(name)),
    "expected at least one hashed JavaScript asset",
  );
  assert.ok(
    assets.some((name) => /^mermaid\.core-[A-Za-z0-9_-]+\.js$/.test(name)),
    "expected the bundled Mermaid runtime chunk",
  );

  const html = await readFile(new URL("index.html", artifactRoot), "utf8");
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>LIXI Review Docs<\/title>/);
  assert.match(html, /\/lixi-review-docs\/og\.png/);
  assert.match(html, /\/lixi-review-docs\/assets\/[^"']+\.js/);
});
