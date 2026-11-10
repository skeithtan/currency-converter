import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

const SERVICE_WORKER_FILE = "sw.js";

/**
 * Generates `sw.js` after the build has been written to disk.
 *
 * The service worker template is prefixed with the exact list of files in the
 * build and a version hash derived from their contents. Every deploy therefore
 * produces a byte-different `sw.js`, which is what makes the browser install
 * the new worker, and the worker can precache the whole build atomically.
 */
export function serviceWorkerPlugin(templatePath: string): Plugin {
  let config: ResolvedConfig;

  return {
    name: "vert:service-worker",
    apply: "build",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    closeBundle() {
      const outDir = config.build.outDir;
      const files = listFiles(outDir)
        .map((file) => relative(outDir, file).split(sep).join("/"))
        .filter((file) => file !== SERVICE_WORKER_FILE)
        .sort();

      const hash = createHash("sha256");
      for (const file of files) {
        hash.update(file);
        hash.update(readFileSync(join(outDir, file)));
      }
      const version = hash.digest("hex").slice(0, 12);

      // The app shell is cached under the scope URL ("./"), which is what
      // GitHub Pages serves index.html at and what the manifest start_url is.
      const precachePaths = files.map((file) =>
        file === "index.html" ? "./" : file
      );

      const header = [
        "// Generated at build time by plugins/serviceWorkerPlugin.ts",
        `const BUILD_VERSION = ${JSON.stringify(version)};`,
        `const PRECACHE_PATHS = ${JSON.stringify(precachePaths, null, 2)};`,
        "",
      ].join("\n");

      writeFileSync(
        join(outDir, SERVICE_WORKER_FILE),
        header + readFileSync(templatePath, "utf8"),
      );
    },
  };
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}
