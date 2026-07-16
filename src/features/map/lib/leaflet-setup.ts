import L from "leaflet";

/**
 * Build a teardrop pin as a divIcon, tinted by channel color. Using divIcons
 * avoids the classic Leaflet "missing marker image" problem under bundlers.
 */
export function clientPinIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span class="client-pin" style="display:block;width:16px;height:16px;background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
    popupAnchor: [0, -16],
  });
}

/** Highlighted (focused) client pin — larger with a pulsing ring. */
export function highlightPinIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span class="client-pin-highlight" style="--hl-color:${color};display:block;background:${color}"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20],
  });
}

/** Cluster bubble: a circle badge tinted by the dominant channel color. */
export function clusterIcon(count: number, color: string) {
  const size = count < 10 ? 34 : count < 50 ? 40 : 48;
  return L.divIcon({
    className: "marker-cluster-badge",
    html: `<div style="
        width:${size}px;height:${size}px;
        display:flex;align-items:center;justify-content:center;
        border-radius:9999px;
        background:${color};
        color:#fff;font-size:13px;font-weight:600;
        box-shadow:0 0 0 4px ${color}40, 0 2px 8px rgba(0,0,0,.3);
        border:2px solid #fff;
      ">${count}</div>`,
    iconSize: [size, size],
  });
}
