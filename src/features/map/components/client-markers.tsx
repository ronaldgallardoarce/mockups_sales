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
  onManage,
  manageLabel = "Gestionar cliente",
}: {
  clients: Client[];
  highlightedClientId?: string;
  /**
   * When provided, each pin's popup shows an action that hands the client back
   * to the parent (e.g. to open a management modal). The map stays domain-free.
   */
  onManage?: (client: Client) => void;
  manageLabel?: string;
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
            // Include membership in the key so re-including a client cleanly
            // remounts the group (react-leaflet-cluster otherwise leaves stale
            // cluster bubbles instead of the individual pin).
            key={`${chId}:${list.map((c) => c.id).join(",")}`}
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
                    {onManage && (
                      <button
                        type="button"
                        onClick={() => onManage(client)}
                        className="mt-1.5 flex w-full items-center justify-center gap-1 rounded border border-primary/40 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        {manageLabel}
                      </button>
                    )}
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
