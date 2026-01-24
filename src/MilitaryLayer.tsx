// ---- IMPORTY ----
// Dokumentacja React hooków: https://react.dev/reference/react
import { useEffect, useState, useRef } from "react";

// Dokumentacja react-leaflet:
//https://react-leaflet.js.org/docs/start-introduction
import { GeoJSON, useMap } from "react-leaflet";

// Dokumentacja Axios: https://axios-http.com/docs/intro
import axios from "axios";

import L from "leaflet";

// Dokumentacja osmtogeojson: https://github.com/tyrasd/osmtogeojson
import osmtogeojson from "osmtogeojson";


// ---- TYPY ----
type MilitaryType =
 | "barracks"
 | "naval_base"
 | "airfield"
 | "training_area"
 | "range"
 | "primary"
 | "office"
 | "danger_area"
 | "shelter"
 | "bunker";

// Typ danych GeoJSON
type GeoJSONData = GeoJSON.FeatureCollection;


// ---- LISTA TYPÓW ----
const MILITARY_TYPES: MilitaryType[] = [
 "barracks",
 "naval_base",
 "airfield",
 "training_area",
 "range",
 "primary",
 "office",
 "danger_area",
 "shelter",
 "bunker"
];


// ---- ETYKIETY ----
const MILITARY_LABELS: Record<MilitaryType, string> = {
 barracks: "Koszary",
 naval_base: "Baza morska",
 airfield: "Lotnisko wojskowe",
 training_area: "Obszar szkoleniowy",
 range: "Poligon",
 primary: "Główny obiekt",
 office: "Biuro/Dowództwo",
 danger_area: "Strefa niebezpieczna",
 shelter: "Schron",
 bunker: "Bunkier"
};


// ---- KOMPONENT MilitaryOSMLayer ----
export default function MilitaryOSMLayer() {
 // TODO: Zmień domyślny typ na bazę morską i sprawdź efekt
 const [militaryType, setMilitaryType] =
useState<MilitaryType>("barracks");

 // TODO: Dodaj typowanie dla danych (GeoJSONData | null)
 const [data, setData] = useState<GeoJSONData | null>(null);

 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState<boolean>(false);

 const layerRef = useRef<L.GeoJSON | null>(null);

 const map = useMap();


 // ---- FUNKCJA POBIERANIA DANYCH ----
 const fetchData = async (type: MilitaryType) => {
 setLoading(true);
 setError(null);
 setData(null);

 const query = `
 [out:json][timeout:60];
 area["ISO3166-1"="PL"]->.a;
 (
 way["military"="${type}"](area.a);
 relation["military"="${type}"](area.a);
 );
 out geom;
 `;

 const requestUrl =
 "https://overpass.kumi.systems/api/interpreter?data=" +
 encodeURIComponent(query);

 try {
 const res = await axios.get(requestUrl);

 const geojson = osmtogeojson(res.data) as GeoJSONData;

 setData(geojson);
 } catch (e) {
 console.error("Błąd Overpass:", e);
 setError("Nie udało się pobrać danych z serwera.");
 setData(null);
 } finally {
    setLoading(false);
 }
 };


 // ---- useEffect: pobieranie danych ----
 useEffect(() => {
 fetchData(militaryType);
 }, [militaryType]);

 // ---- useEffect: dopasowanie widoku mapy ----
 useEffect(() => {
 if (!data || !layerRef.current) return;

 const bounds = layerRef.current.getBounds();
 if (bounds.isValid()) {
 map.fitBounds(bounds, { animate: true });
 }
 }, [data, map]);


 // ---- RENDER ----
 return (
 <>
 {/* ---- LOADER ---- */}
 {loading && (
    <div
        style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "24px",
            fontWeight: "bold",
        }}
     >
    Ładowanie: {MILITARY_LABELS[militaryType]}
     </div>
 )}

 {/* ---- KOMUNIKAT BŁĘDU ---- */}
{error && (
  <div style={{
    position: "fixed", 
    bottom: "20px", 
    right: "20px", 
    background: "#ff5252",
    color: "white", 
    padding: "10px", 
    borderRadius: "8px", 
    zIndex: 10000
  }}>
    {error}
  </div>
)}

 {/* ---- PRZYCISKI ---- */}
     <div
        style={{
             position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 9999,
            background: "rgba(255,255,255,0.9)",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            width: "fit-content",
            maxWidth: "80vw"
        }}
    >
    
    <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
    Typ obiektu wojskowego:
    </div>

    {/* TODO: Dodaj tooltipy (podpowiedzi) do przycisków */}
    {MILITARY_TYPES.map((type) => (
        <button
            key={type}
            title={`Pokaż na mapie: ${MILITARY_LABELS[type]}`}
            onClick={() => setMilitaryType(type)}
            style={{
                margin: "4px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #555",
                background: type === militaryType ? "#c62828" : "#eee",
                color: type === militaryType ? "#fff" : "#000",
                cursor: "pointer",
             }}
        >
 
            {MILITARY_LABELS[type] || type}
        </button>
    ))}
 </div>


            {/* ---- WARSTWA GEOJSON ---- */}
            {data && (
                <GeoJSON
                    key={militaryType}
                    data={data}
                    ref={layerRef}
                    style={() => ({
                        color: "#ff0000",
                        weight: 6,
                        opacity: 1,
                        fillColor: "#ff0000",
                        fillOpacity: 0.45,
                     })}
                />
            )}
        </>
     );
}
