import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Trava arquitetural: preview NÃO pode importar do editor/store/template-data.
// Única ponte permitida: snapshot/storage + snapshot.v2.schema + food-images.

const PREVIEW = resolve(
  process.cwd(),
  "src/routes/_authenticated/my-plan-v2-preview.tsx",
);

const FORBIDDEN = [
  "@/lib/v2/editor",
  "v2/editor",
  "@/lib/v2/template-data.v2",
  "template-data.v2",
  "@/lib/v2/snapshot/build",
  "snapshot/build",
];

describe("preview isolation", () => {
  it("my-plan-v2-preview.tsx não importa store/editor/template-data/build", () => {
    const src = readFileSync(PREVIEW, "utf8");
    for (const needle of FORBIDDEN) {
      expect(src, `import proibido: ${needle}`).not.toMatch(
        new RegExp(`from\\s+["'][^"']*${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"']*["']`),
      );
    }
  });
});
