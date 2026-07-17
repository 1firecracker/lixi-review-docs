import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runGitHubPagesSync } from "../sync/github-pages-sync.mjs";

export async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const siteDir = process.env.LIXI_REVIEW_SITE_DIR ?? resolve(scriptDir, "..");
  try {
    const options = { siteDir };
    if (process.env.LIXI_REVIEW_SOURCE_DIR) {
      options.sourceDir = process.env.LIXI_REVIEW_SOURCE_DIR;
    }
    const result = await runGitHubPagesSync(options);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return result;
  } catch {
    process.stderr.write(`${JSON.stringify({ status: "failed", message: "GitHub Pages synchronization failed" })}\n`);
    process.exitCode = 1;
    return null;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
