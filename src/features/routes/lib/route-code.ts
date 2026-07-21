import type { Route } from "@/types";
import { getChannel } from "@/data/channels";
import { numId } from "@/lib/utils";
import { channelAbbr } from "../components/route-code-input";

/**
 * Plain-text route code in the same order as the form's segmented field:
 * `city-channel-channel-id-name`, e.g. "SC-FE-PA-123-Zona Norte".
 * The id is the integer id (backend ids are int; the mock's string ids map via `numId`).
 */
export function formatRouteCode(route: Route, city = "SC"): string {
  const channels = route.channelIds
    .map((id) => getChannel(id)?.name)
    .filter((n): n is string => !!n)
    .map(channelAbbr);
  return [city, ...channels, numId(route.id), route.name].join("-");
}
