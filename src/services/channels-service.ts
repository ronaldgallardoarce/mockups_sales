import type { Channel, Subcanal } from "@/types";
import { CHANNELS, SUBCANALES } from "@/data/channels";
import { delay } from "@/lib/utils";

/**
 * Channel / subcanal catalog service. Swap the bodies for real HTTP calls
 * later — signatures already return promises.
 */
export const channelsService = {
  listChannels: (): Promise<Channel[]> => delay(CHANNELS, 250),
  listSubcanales: (): Promise<Subcanal[]> => delay(SUBCANALES, 250),
  subcanalesByChannel: (channelId: string): Promise<Subcanal[]> =>
    delay(SUBCANALES.filter((s) => s.channelId === channelId), 200),
};
