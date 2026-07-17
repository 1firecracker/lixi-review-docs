import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";

import { DocsSite } from "../app/components/DocsSite";
import { pagesDocumentHref } from "../lib/pages/routing";
import type { ContentManifest, ManifestFile } from "../lib/content/types";

const HASH = "0123456789abcdef".repeat(4);

function file(path: string, kind: ManifestFile["kind"] = "markdown"): ManifestFile {
  return {
    path,
    sha256: HASH,
    bytes: 20,
    mediaType: kind === "asset" ? "image/png" : "text/markdown; charset=utf-8",
    kind,
  };
}

const manifest: ContentManifest = {
  schemaVersion: 1,
  revision: `snapshot-${"a".repeat(64)}`,
  generatedAt: "2026-07-17T12:00:00.000Z",
  files: [
    file("README.md"),
    file("指南/开始.md"),
    file("指南/进阶/配置.html", "html"),
    file("images/logo.png", "asset"),
  ],
};

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://example.test/",
});
Object.assign(globalThis, {
  IS_REACT_ACT_ENVIRONMENT: true,
  document: dom.window.document,
  window: dom.window,
});
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;
const originalFetch = globalThis.fetch;

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  container?.remove();
  container = undefined;
  globalThis.fetch = originalFetch;
});

test("DocsSite generates a hierarchical index for any source folder", async () => {
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === "/api/content/manifest") {
      return new Response("Not found", { status: 404 });
    }
    if (url.endsWith("/content/manifest.json")) return Response.json(manifest);
    if (url.endsWith("/content/site-config.json")) {
      return Response.json({ schemaVersion: 1, siteName: "任意文档目录" });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(
      <DocsSite
        basePath="/docs-site/"
        documentHrefFor={pagesDocumentHref}
        homeHref="#/"
      />,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  assert.equal(container.querySelector(".document-header h1")?.textContent, "文档索引");
  assert.equal(document.title, "任意文档目录");

  const index = container.querySelector('nav[aria-label="文档索引"]');
  assert.ok(index);
  assert.equal(index.querySelector('a[href="#/docs/README.md"]')?.textContent, "文档总览");
  assert.equal(
    index.querySelector(
      'a[href="#/docs/%E6%8C%87%E5%8D%97/%E8%BF%9B%E9%98%B6/%E9%85%8D%E7%BD%AE.html"]',
    )?.textContent,
    "配置",
  );
  assert.match(index.textContent ?? "", /指南.*进阶.*配置/s);
  assert.doesNotMatch(index.textContent ?? "", /logo\.png/);
  assert.equal(container.querySelector('[role="alert"]'), null);
});
