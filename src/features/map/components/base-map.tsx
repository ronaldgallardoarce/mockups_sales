import { MapContainer, LayersControl, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { cn } from "@/lib/utils";
import { DEFAULT_ZOOM, SANTA_CRUZ_CENTER } from "@/lib/geo";

interface BaseMapProps {
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  /** Show the map/satellite layer switcher. */
  layerControl?: boolean;
}

export function BaseMap({
  center = SANTA_CRUZ_CENTER,
  zoom = DEFAULT_ZOOM,
  className,
  children,
  layerControl = true,
}: BaseMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className={cn("h-full w-full", className)}
      zoomControl
    >
      {layerControl ? (
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Mapa">
            <TileLayer
              className="osm-tiles"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
      ) : (
        <TileLayer
          className="osm-tiles"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}
      {children}
    </MapContainer>
  );
}
