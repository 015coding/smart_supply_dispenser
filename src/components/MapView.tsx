"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
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

export function MapView({ latitude, longitude, name, address }: { latitude: number; longitude: number; name: string; address: string }) {
  const osmUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
  return <div className="detail-panel"><div className="map-wrap"><MapContainer center={[latitude, longitude]} zoom={16} scrollWheelZoom={false} attributionControl><TileLayer url={osmUrl} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' /><Marker position={[latitude, longitude]} icon={markerIcon}><Popup><strong>{name}</strong><br />{address}</Popup></Marker></MapContainer></div><div className="map-caption"><span><MapPin size={13} style={{ verticalAlign: "-2px" }} /> ตำแหน่งโดยประมาณ</span><a href={osmLink} target="_blank" rel="noreferrer">เปิดใน OpenStreetMap ↗</a></div></div>;
}
