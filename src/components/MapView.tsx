"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapPin } from "lucide-react";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LeafletMapCanvasProps {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  osmUrl: string;
  expanded?: boolean;
}

function LeafletMapCanvas({ latitude, longitude, name, address, osmUrl, expanded = false }: LeafletMapCanvasProps) {
  const mapWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mapWrap = mapWrapRef.current;
    if (!mapWrap) return;

    const mapHost = document.createElement("div");
    mapHost.style.height = expanded ? "100%" : "310px";
    mapHost.style.minHeight = expanded ? "0" : "310px";
    mapHost.style.width = "100%";
    mapWrap.replaceChildren(mapHost);

    const map = L.map(mapHost, { scrollWheelZoom: false, attributionControl: true }).setView([latitude, longitude], 16);
    L.tileLayer(osmUrl, { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);

    const popupContent = document.createElement("div");
    const popupTitle = document.createElement("strong");
    popupTitle.textContent = name;
    popupContent.append(popupTitle, document.createElement("br"), document.createTextNode(address));
    L.marker([latitude, longitude], { icon: markerIcon }).addTo(map).bindPopup(popupContent);

    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
      window.cancelAnimationFrame(frame);
      map.remove();
      if (mapWrap.contains(mapHost)) mapWrap.removeChild(mapHost);
    };
  }, [address, expanded, latitude, longitude, name, osmUrl]);

  return <div ref={mapWrapRef} className={`map-wrap${expanded ? " map-wrap-expanded" : ""}`} aria-label={`แผนที่ตำแหน่ง ${name}`} />;
}

export function MapView({ latitude, longitude, name, address }: { latitude: number; longitude: number; name: string; address: string }) {
  const [expanded, setExpanded] = useState(false);
  const osmUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded]);

  return <>
    {!expanded && <div className="detail-panel">
      <div className="map-frame">
        <LeafletMapCanvas latitude={latitude} longitude={longitude} name={name} address={address} osmUrl={osmUrl} />
        <button className="map-expand-button" type="button" onClick={() => setExpanded(true)} aria-label="ขยายแผนที่"><span className="map-expand-mark" aria-hidden="true">⛶</span>ขยายแผนที่</button>
      </div>
      <div className="map-caption"><span><MapPin size={13} style={{ verticalAlign: "-2px" }} /> แผนที่ OpenStreetMap</span><a href={googleMapsLink} target="_blank" rel="noreferrer">เปิดใน Google Maps ↗</a></div>
    </div>}
    {expanded && <div className="map-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpanded(false); }}>
      <section className="map-modal" role="dialog" aria-modal="true" aria-labelledby="expanded-map-title">
        <header className="map-modal-header"><div><strong id="expanded-map-title">{name}</strong><span>{address}</span></div><button className="button button-quiet" type="button" onClick={() => setExpanded(false)} aria-label="ปิดแผนที่"><span className="map-modal-close-mark" aria-hidden="true">×</span></button></header>
        <div className="map-modal-canvas"><LeafletMapCanvas latitude={latitude} longitude={longitude} name={name} address={address} osmUrl={osmUrl} expanded /></div>
        <footer className="map-modal-footer"><span>แผนที่ภายในเว็บใช้ OpenStreetMap</span><a className="button button-primary" href={googleMapsLink} target="_blank" rel="noreferrer">นำทางด้วย Google Maps ↗</a></footer>
      </section>
    </div>}
  </>;
}
