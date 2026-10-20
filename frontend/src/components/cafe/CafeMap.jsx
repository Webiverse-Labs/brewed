import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { groupCafeLocations } from "../../lib/cafeLocations.js";

const CENTER = [14.75, 121.035];
const bean = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.2 3.3A6.2 6.2 0 0 1 20.7 13.8l-6.9 6.9A6.2 6.2 0 0 1 3.3 10.2Z"/><path d="M7.5 16.5c-1.5-6 7.5-3 6-9"/></svg>';

function fitCafes(map, cafes) {
  const points = groupCafeLocations(cafes).map(({ location }) => [location.lat, location.lng]);
  if (points.length) map.fitBounds(points, { padding: [48, 48], maxZoom: 16, animate: false });
  else map.setView(CENTER, 13, { animate: false });
}

function CafeMap({ cafes, selectedId, onSelect }) {
  const navigate = useNavigate();
  const container = useRef(null);
  const engine = useRef(null);
  const markers = useRef(new Map());
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    const markerIndex = markers.current;
    const map = L.map(container.current, { zoomControl: false, scrollWheelZoom: false }).setView(CENTER, 13);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    tiles.on("tileload", () => setTileError(false));
    const pins = L.layerGroup().addTo(map);
    engine.current = { map, pins, tiles };
    const resize = () => map.invalidateSize({ pan: false });
    const observer = window.ResizeObserver ? new window.ResizeObserver(resize) : null;
    observer?.observe(container.current);
    window.addEventListener("resize", resize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      map.remove();
      engine.current = null;
      markerIndex.clear();
    };
  }, []);

  useEffect(() => {
    const { map, pins } = engine.current;
    pins.clearLayers();
    markers.current.clear();
    for (const group of groupCafeLocations(cafes)) {
      const names = group.cafes.map((cafe) => cafe.name).join(", ");
      const icon = L.divIcon({
        className: "brewed-map-pin",
        html: `<span>${group.cafes.length > 1 ? group.cafes.length : bean}</span>`,
        iconSize: [40, 46], iconAnchor: [20, 44], popupAnchor: [0, -40],
      });
      const marker = L.marker([group.location.lat, group.location.lng], { icon, title: names, alt: names }).addTo(pins);
      const popup = document.createElement("div");
      popup.className = "cafe-map-choices";
      for (const cafe of group.cafes) {
        const entry = document.createElement("div");
        const choice = document.createElement("button");
        choice.type = "button";
        choice.textContent = cafe.name;
        choice.addEventListener("click", () => onSelect(cafe.id));
        const view = document.createElement("a");
        view.href = `/cafes/${encodeURIComponent(cafe.id)}`;
        view.textContent = "View café";
        view.addEventListener("click", (event) => { event.preventDefault(); navigate(view.getAttribute("href")); });
        entry.append(choice, view);
        popup.append(entry);
        markers.current.set(cafe.id, marker);
      }
      marker.bindPopup(popup, { maxWidth: 280 });
      marker.on("click", () => onSelect(group.cafes[0].id));
    }
    fitCafes(map, cafes);
  }, [cafes, onSelect, navigate]);

  useEffect(() => {
    const marker = markers.current.get(selectedId);
    if (!marker) {
      engine.current.map.closePopup();
      return;
    }
    const { map } = engine.current;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 16), { animate: false });
    marker.openPopup();
  }, [selectedId, cafes]);

  return (
    <div className="relative isolate h-full min-h-[420px] overflow-hidden rounded-3xl border border-base-300 bg-base-200">
      <div ref={container} role="region" aria-label="Café locations map" className="cafe-map absolute inset-0 z-0" />
      <button
        type="button"
        onClick={() => fitCafes(engine.current.map, cafes)}
        className="absolute top-4 right-4 z-[500] flex h-10 items-center gap-2 rounded-full border border-base-300 bg-surface px-4 text-sm font-medium shadow-soft hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <LocateFixed size={16} /> Show all pins
      </button>
      {tileError && (
        <div role="status" className="absolute top-18 right-4 left-4 z-[500] rounded-xl bg-surface p-3 text-sm shadow-soft">
          Map tiles couldn't load. Café details are still available.{" "}
          <button type="button" className="font-medium text-accent underline" onClick={() => { setTileError(false); engine.current.tiles.redraw(); }}>Retry</button>
        </div>
      )}
    </div>
  );
}

export default CafeMap;
