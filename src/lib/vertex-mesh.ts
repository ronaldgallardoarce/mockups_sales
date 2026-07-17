import type { Block } from "@/types";

/**
 * Maps every polygon vertex to the list of `{blockId, vertexIndex}` that sit
 * at that exact coordinate. Coordinates are used as-is (no rounding here) —
 * `Block.polygon` values are already rounded to 1e-6 before they ever reach
 * the store (see `blocks-editor.tsx`'s `coordsFromLayer`), so an exact string
 * key reliably detects vertices shared between adjacent blocks (e.g. from
 * grid subdivision or the line-cut tool, which both compute the shared
 * boundary as the same deterministic floating-point expression for both
 * resulting pieces).
 *
 * Only keys with 2+ entries (i.e. actually shared by more than one block/
 * vertex) are included in the returned map.
 */
export function buildVertexMesh(
  blocks: Block[],
): Map<string, { blockId: string; vertexIndex: number }[]> {
  const mesh = new Map<string, { blockId: string; vertexIndex: number }[]>();

  for (const block of blocks) {
    block.polygon.forEach(([lat, lng], vertexIndex) => {
      const key = `${lat},${lng}`;
      const entry = mesh.get(key);
      if (entry) {
        entry.push({ blockId: block.id, vertexIndex });
      } else {
        mesh.set(key, [{ blockId: block.id, vertexIndex }]);
      }
    });
  }

  for (const [key, entries] of mesh) {
    if (entries.length < 2) mesh.delete(key);
  }

  return mesh;
}
