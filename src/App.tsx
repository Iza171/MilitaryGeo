import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import MilitaryOSMLayer from "./MilitaryLayer";

function SetView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
 }, [map, center, zoom]);

 return null;
}

export default function App() {

 const center: [number, number] = [52.069167, 19.480556];
 const zoom = 7;
 return (
 <MapContainer
 style={{ height: "100vh", width: "100vw" }}
 >
 {/* Dodajemy nasz komponent SetView, który ustawi widok mapy na
center i zoom */}
 <SetView center={center} zoom={zoom} />
 {/* TileLayer to warstwa kafelków mapy.
 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  – to adres serwera OpenStreetMap, który dostarcza obrazki mapy.
 {s} – subdomena,
 {z} – poziom zoomu,
 {x} i {y} – współrzędne kafelka.
 */}
 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
 <MilitaryOSMLayer />
 </MapContainer>
 );
}