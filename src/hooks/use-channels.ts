import { useQuery } from "@tanstack/react-query";
import { channelsService } from "@/services/channels-service";
import { queryKeys } from "@/lib/query-client";

export function useChannels() {
  return useQuery({
    queryKey: queryKeys.channels,
    queryFn: channelsService.listChannels,
  });
}

export function useSubcanales() {
  return useQuery({
    queryKey: queryKeys.subcanales,
    queryFn: channelsService.listSubcanales,
  });
}
