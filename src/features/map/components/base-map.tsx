import { useEffect, useRef, useState } from "react";
import { MapContainer, LayersControl, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_ZOOM, SANTA_CRUZ_CENTER } from "@/lib/geo";

interface BaseMapProps {
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  /** Show the map/satellite layer switcher. */
  layerControl?: boolean;
  /**
   * Element to take fullscreen instead of the map itself — lets a page put
   * floating overlays (e.g. a route list) inside the fullscreened area.
   */
  fullscreenTargetRef?: React.RefObject<HTMLElement>;
}

/** Recomputes the Leaflet canvas size after entering/leaving fullscreen. */
function FullscreenResizer() {
  const map = useMap();
  useEffect(() => {
    const onChange = () => window.setTimeout(() => map.invalidateSize(), 160);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [map]);
  return null;
}

export function BaseMap({
  center = SANTA_CRUZ_CENTER,
  zoom = DEFAULT_ZOOM,
  className,
  children,
  layerControl = true,
  fullscreenTargetRef,
}: BaseMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      const target = fullscreenTargetRef?.current ?? wrapperRef.current;
      target?.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div ref={wrapperRef} className="relative h-full w-full bg-muted">
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
        <FullscreenResizer />
      </MapContainer>

      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute bottom-3 left-3 z-[1000] flex h-9 w-9 items-center justify-center rounded-md border bg-background/95 text-muted-foreground shadow-md backdrop-blur transition-colors hover:text-foreground"
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
