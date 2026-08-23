"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Crosshair, MapPin, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DEFAULT_CENTER: L.LatLngExpression = [13.7563, 100.5018];
const DEFAULT_ZOOM = 6;
const SELECTED_ZOOM = 16;

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface AdminLocationPickerProps {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
}

function selectedPosition(latitude: string, longitude: string): L.LatLng | null {
  if (!latitude.trim() || !longitude.trim()) return null;
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) return null;
  if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) return null;
  return L.latLng(parsedLatitude, parsedLongitude);
}

function coordinateValue(value: number): string {
  return value.toFixed(6);
}

export function AdminLocationPicker({ latitude, longitude, onChange }: AdminLocationPickerProps) {
  const mapHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const osmUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const position = selectedPosition(latitude, longitude);
  const positionLatitude = position?.lat ?? null;
  const positionLongitude = position?.lng ?? null;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => mapRef.current?.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [expanded]);

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

  useEffect(() => {
    const mapHost = mapHostRef.current;
    if (!mapHost) return;

    const map = L.map(mapHost, { scrollWheelZoom: true, attributionControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    mapRef.current = map;
    L.tileLayer(osmUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.on("click", ({ latlng }) => {
      setLocationError("");
      onChangeRef.current(coordinateValue(latlng.lat), coordinateValue(latlng.lng));
    });

    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
      window.cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [osmUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (positionLatitude === null || positionLongitude === null) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const nextPosition = L.latLng(positionLatitude, positionLongitude);
    if (!markerRef.current) {
      const marker = L.marker(nextPosition, { draggable: true, icon: markerIcon }).addTo(map);
      marker.on("dragend", () => {
        const draggedPosition = marker.getLatLng();
        onChangeRef.current(coordinateValue(draggedPosition.lat), coordinateValue(draggedPosition.lng));
      });
      markerRef.current = marker;
      map.setView(nextPosition, SELECTED_ZOOM);
      return;
    }

    markerRef.current.setLatLng(nextPosition);
    map.panTo(nextPosition);
  }, [positionLatitude, positionLongitude]);

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("เบราว์เซอร์นี้ไม่รองรับการค้นหาตำแหน่งปัจจุบัน");
      return;
    }

    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextPosition = L.latLng(coords.latitude, coords.longitude);
        onChange(coordinateValue(nextPosition.lat), coordinateValue(nextPosition.lng));
        mapRef.current?.flyTo(nextPosition, SELECTED_ZOOM);
        setLocating(false);
      },
      () => {
        setLocationError("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาอนุญาตตำแหน่งหรือลองปักหมุดบนแผนที่");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
  }

  function clearLocation() {
    setLocationError("");
    onChange("", "");
    mapRef.current?.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }

  return <div className="location-picker full">
    <div className="location-picker-heading">
      <div>
        <strong>ตำแหน่งเครื่องบนแผนที่</strong>
        <p>คลิกบนแผนที่เพื่อปักหมุด หรือลากหมุดเพื่อปรับตำแหน่งให้แม่นยำ</p>
      </div>
      <div className="location-picker-actions">
        <button className="button button-secondary" type="button" onClick={useCurrentLocation} disabled={locating}>
          <Crosshair size={15} />{locating ? "กำลังค้นหา…" : "ใช้ตำแหน่งปัจจุบัน"}
        </button>
        {position && <button className="button button-quiet" type="button" onClick={clearLocation}>
          <Trash2 size={15} />ล้างหมุด
        </button>}
      </div>
    </div>

    <div className={`location-map-shell${expanded ? " expanded" : ""}`}>
      <div ref={mapHostRef} className="location-map-canvas" aria-label="แผนที่สำหรับปักหมุดตำแหน่งเครื่อง" />
      <button className="map-expand-button location-map-expand-button" type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded} aria-label={expanded ? "ย่อแผนที่กลับขนาดเดิม" : "ขยายแผนที่เต็มจอ"}>
        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        {expanded ? "ย่อแผนที่" : "ขยายเต็มจอ"}
      </button>
      <div className="location-map-hint"><MapPin size={15} /> คลิกเพื่อปักหมุด</div>
    </div>

    <div className={`location-coordinate-status${position ? " selected" : ""}`} aria-live="polite">
      <MapPin size={15} />
      {position
        ? <span>ปักหมุดแล้ว: {coordinateValue(position.lat)}, {coordinateValue(position.lng)}</span>
        : <span>ยังไม่ได้ปักหมุด — สามารถบันทึกเป็นฉบับร่างไว้ก่อนได้</span>}
    </div>
    {locationError && <p className="form-error" role="alert">{locationError}</p>}

    <details className="location-manual-fields">
      <summary>กรอกพิกัดเอง (ตัวเลือกเสริม)</summary>
      <div className="location-manual-grid">
        <div className="input-wrap">
          <label htmlFor="dispenser-latitude">Latitude</label>
          <input className="input" id="dispenser-latitude" type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => onChange(event.target.value, longitude)} />
        </div>
        <div className="input-wrap">
          <label htmlFor="dispenser-longitude">Longitude</label>
          <input className="input" id="dispenser-longitude" type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => onChange(latitude, event.target.value)} />
        </div>
      </div>
    </details>
  </div>;
}
