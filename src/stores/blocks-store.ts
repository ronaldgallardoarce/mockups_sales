import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Block, Polygon } from "@/types";
import { SEED_BLOCKS } from "@/data/seed";
import { polygonsOverlap } from "@/lib/geo";
import { uid } from "@/lib/utils";

export interface NewBlockInput {
  polygon: Polygon;
}

interface BlocksState {
  blocks: Block[];
  addBlock: (input: NewBlockInput) => Block;
  /** Bulk-insert several blocks at once (e.g. a grid subdivision). */
  addBlocks: (inputs: NewBlockInput[]) => Block[];
  updateBlock: (id: string, patch: Partial<Omit<Block, "id">>) => void;
  removeBlock: (id: string) => void;
  resetBlocks: () => void;
  /** Ids of existing blocks that overlap the given polygon (excluding `ignoreId`). */
  findOverlaps: (polygon: Polygon, ignoreId?: string) => string[];
}

export const useBlocksStore = create<BlocksState>()(
  persist(
    (set, get) => ({
      blocks: SEED_BLOCKS,
      addBlock: (input) => {
        const block: Block = {
          id: uid("blk"),
          polygon: input.polygon,
          createdAt: new Date().toISOString(),
        };
        set({ blocks: [...get().blocks, block] });
        return block;
      },
      addBlocks: (inputs) => {
        const now = new Date().toISOString();
        const created: Block[] = inputs.map((input) => ({
          id: uid("blk"),
          polygon: input.polygon,
          createdAt: now,
        }));
        set({ blocks: [...get().blocks, ...created] });
        return created;
      },
      updateBlock: (id, patch) =>
        set({
          blocks: get().blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        }),
      removeBlock: (id) => set({ blocks: get().blocks.filter((b) => b.id !== id) }),
      resetBlocks: () => set({ blocks: SEED_BLOCKS }),
      findOverlaps: (polygon, ignoreId) =>
        get()
          .blocks.filter((b) => b.id !== ignoreId && polygonsOverlap(polygon, b.polygon))
          .map((b) => b.id),
    }),
    {
      name: "route-mgmt-blocks",
      // Bump version to drop older persisted blocks (channel-based / square seeds,
      // and the Trinidad-centered coordinates before the move to Santa Cruz).
      version: 4,
      migrate: () => ({ blocks: SEED_BLOCKS }),
    },
  ),
);
