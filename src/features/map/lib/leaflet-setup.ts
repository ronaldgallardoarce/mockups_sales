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

/** Excluded client pin — same teardrop shape as an active pin but red with an X. */
export function excludedPinIcon() {
  return L.divIcon({
    className: "",
    html: `<span class="client-pin-x"><span class="client-pin-x-mark">✕</span></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -18],
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

/**
 * Seller marker — a circular person badge tinted by the route color, with an
 * optional count badge when more than one seller attends the route.
 */
export function sellerPinIcon(color: string, count = 1) {
  // person-standing (lucide) — a clear standing person, reads as a seller.
  const person = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg>`;
  const badge = count > 1 ? `<span class="seller-pin-count">${count}</span>` : "";
  return L.divIcon({
    className: "",
    html: `<span class="seller-pin" style="--seller-color:${color}">${person}${badge}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
    tooltipAnchor: [0, -16],
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
