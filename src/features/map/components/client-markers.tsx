import { useMemo } from "react";
import { Marker, Popup, Tooltip } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Client } from "@/types";
import { channelColor, getChannel, getSubcanal } from "@/data/channels";
import { clientPinIcon, highlightPinIcon, clusterIcon } from "../lib/leaflet-setup";

/**
 * Renders one MarkerClusterGroup per channel so both the pins and the cluster
 * bubbles are colored by channel — keeping color-coding consistent everywhere.
 */
export function ClientMarkers({
  clients,
  highlightedClientId,
}: {
  clients: Client[];
  highlightedClientId?: string;
}) {
  const byChannel = useMemo(() => {
    const map = new Map<string, Client[]>();
    for (const c of clients) {
      const list = map.get(c.channelId) ?? [];
      list.push(c);
      map.set(c.channelId, list);
    }
    return map;
  }, [clients]);

  return (
    <>
      {[...byChannel.entries()].map(([chId, list]) => {
        const color = channelColor(chId);
        return (
          <MarkerClusterGroup
            key={chId}
            chunkedLoading
            showCoverageOnHover={false}
            maxClusterRadius={45}
            iconCreateFunction={(cluster: { getChildCount: () => number }) =>
              clusterIcon(cluster.getChildCount(), color)
            }
          >
            {list.map((client) => {
              const isHighlighted = client.id === highlightedClientId;
              const icon = isHighlighted ? highlightPinIcon(color) : clientPinIcon(color);
              return (
                <Marker key={client.id} position={[client.lat, client.lng]} icon={icon}>
                <Tooltip direction="top" offset={[0, -14]}>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div style={{ color }}>
                      {getChannel(client.channelId)?.name} · {getSubcanal(client.subcanalId)?.name}
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.code} · {client.ownerName}</p>
                    <p className="text-xs">{client.address}</p>
                    <p className="text-xs">{client.phone}</p>
                    <p className="mt-1 text-xs font-medium" style={{ color }}>
                      {getChannel(client.channelId)?.name} · {getSubcanal(client.subcanalId)?.name}
                    </p>
                  </div>
                </Popup>
              </Marker>
              );
            })}
          </MarkerClusterGroup>
        );
      })}
    </>
  );
}
