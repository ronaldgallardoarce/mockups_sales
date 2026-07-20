import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { Client } from "@/types";

export function FlyToClient({ client }: { client?: Client | null }) {
  const map = useMap();

  useEffect(() => {
    if (client) map.flyTo([client.lat, client.lng], 17, { duration: 0.8 });
  }, [client, map]);

  return null;
}
