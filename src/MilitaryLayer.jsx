// ---- IMPORTY ----
import { useEffect, useState, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import "./MilitaryLayer.css";
import axios from "axios";
import osmtogeojson from "osmtogeojson";

// ---- LISTA TYPÓW ----
const MILITARY_TYPES = [
    "barracks",
    "naval_base",
    "airfield", 
    "training_area", 
    "range", 
    "office", 
    "danger_area", 
    "shelter", 
    "bunker",
    "checkpoint",
    "primary",
    "yes"
];

// ---- ETYKIETY ----
const MILITARY_LABELS = {
    barracks: "Koszary",
    naval_base: "Baza morska",
    airfield: "Lotnisko wojskowe",
    training_area: "Obszar szkoleniowy",
    range: "Poligon",
    office: "Biuro/Administracja",
    danger_area: "Strefa niebezpieczna",
    shelter: "Schron",
    bunker: "Bunkier",
    checkpoint: "Punkt kontrolny",
    primary: "Główne obietky",
    yes: "Inne obiekty"
};

// ---- KOMPONENT ----
export default function MilitaryOSMLayer() {
    const [militaryType, setMilitaryType] = useState("barracks");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [geoStyle, setGeoStyle] = useState({
        color: "#ff0000",
        weight: 6,
        opacity: 0.45
    });

    const fetchAllLayers = async () => {
        setLoading(true);
        try {
            // Pobieramy dane dla każdego typu z tablicy MILITARY_TYPES
            const promises = MILITARY_TYPES.map(type => 
                fetch(`/data/${type}.json`).then(res => {
                    if (!res.ok) {
                        console.warn(`Nie znaleziono pliku: ${type}.json`);
                        return null; // Zwracamy null, żeby jeden brakujący plik nie zepsuł wszystkiego
                    }
                    return res.json();
             })
         );
        
            // Czekamy na wszystkie pliki
         const results = await Promise.all(promises);
        
            // Odfiltrowujemy puste wyniki (te, które zwróciły null)
         const validResults = results.filter(res => res !== null);

            // Łączymy tablice features. Dodajemy '|| []' na wypadek, gdyby któryś plik był pusty
         const combinedFeatures = validResults.flatMap(geojson => geojson.features || []);
        
         console.log("Połączone obiekty:", combinedFeatures.length); // Sprawdź to w konsoli F12!

         setData({
            type: "FeatureCollection",
            features: combinedFeatures
         });
        
            setMilitaryType("all"); // To "all" zostanie wykryte przez legendę
        } catch (error) {
         console.error("Error while reading all layers:", error);
        } finally {
            setLoading(false);
        }
    };

    const layerRef = useRef(null);
    const map = useMap();

    // ---- FUNKCJA POBIERANIA DANYCH ----
    const fetchData = async (type) => {
        if (type === "all") return;
        setLoading(true);
        setData(null);

        const url = `/data/${type}.json`;
        
        try{
            const result = await fetch(url)
        
            if (!result.ok){
                console.error("File not found.", url);
                setLoading(false);
                return;
            }

            const geojson = await result.json()
            setData(geojson);
        } catch (error) {
            console.error("File read error", error);
        } finally {
            setLoading(false);
        }
    };

    // ---- Pobieranie danych przy zmianie typu ----
    useEffect(() => {
        fetchData(militaryType);
    }, [militaryType]);

    // ---- Dopasowanie widoku mapy ----
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
                <div className="loader-overlay">
                    Ładowanie: {MILITARY_LABELS[militaryType]}
                </div>
            )}

            {/* ---- PANEL PRZYCISKÓW ---- */}
            <div className="top-control-panel">
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                    Typ obiektu wojskowego:
                </div>

                {MILITARY_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => setMilitaryType(type)}
                        title={`Pokaż obiekty typu: ${MILITARY_LABELS[type] || type}`}
                        className="military-button"
                        style={{
                            background: type === militaryType ? "#c62828" : "#eee",
                            color: type === militaryType ? "#fff" : "#000",
                         }}
                    >
                        {MILITARY_LABELS[type] || type}
                    </button>
                ))}

                 {/* PRZYCISK "POKAŻ WSZYSTKO" */}
                 <button
                    onClick={fetchAllLayers}
                    className="military-button all-layers-btn"
                    style={{
                    background: militaryType === "all" ? "#2e7d32" : "#e8f5e9",
                    color: militaryType === "all" ? "#fff" : "#2e7d32",
                    borderColor: "#2e7d32",
                    fontWeight: "bold"
                }}
            >
                Pokaż wszystkie warstwy naraz
            </button>
         </div>

            {/* ---- LEGENDA (LEWY DOLNY RÓG) ---- */}
            <div className="legend-container">
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #ccc", marginBottom: "5px" }}>
                    Legenda:
                </div>
                <div>
                    <strong>Typ:</strong> {militaryType === "all" ? "Wszystkie obiekty" : (MILITARY_LABELS[militaryType] || militaryType)}
                </div>
                <div>
                    <strong>Liczba obiektów:</strong> {data ? data.features.length : 0}
                </div>
            </div>

            {/* ---- PANEL EDYCJI STYLU (PRAWY DOLNY RÓG) ---- */}
            <div className="style-editor-panel">
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #ccc", marginBottom: "5px" }}>
                     Wygląd warstwy:
                </div>

                {/* Zmiana koloru */}
                <label>
                    Kolor linii i wypełnienia:
                    <input 
                         type="color" 
                         value={geoStyle.color} 
                         onChange={(e) => setGeoStyle({ ...geoStyle, color: e.target.value })} 
                    />
                </label>

                 {/* Zmiana grubości linii */}
                 <label>
                     Grubość linii: ({geoStyle.weight}px)
                     <input 
                         type="range" 
                         min="1" 
                         max="15" 
                         value={geoStyle.weight} 
                         onChange={(e) => setGeoStyle({ ...geoStyle, weight: parseInt(e.target.value) })} 
                     />
                 </label>

                {/* Zmiana przezroczystości */}
                 <label>
                    Przezroczystość: ({Math.round(geoStyle.opacity * 100)}%)
                    <input 
                         type="range" 
                         min="0" 
                         max="1" 
                         step="0.1" 
                         value={geoStyle.opacity} 
                         onChange={(e) => setGeoStyle({ ...geoStyle, opacity: parseFloat(e.target.value) })} 
                    />
                </label>
            </div>

            {/* ---- WARSTWA GEOJSON ---- */}
            {data && (
                <GeoJSON
                    key={`${militaryType}-${geoStyle.color}-${geoStyle.weight}-${geoStyle.opacity}`}
                    data={data}
                    ref={layerRef}
                    style={() => ({
                        color: geoStyle.color,
                        weight: geoStyle.weight,
                        opacity: 1,
                        fillColor: geoStyle.color,
                        fillOpacity: geoStyle.opacity,
                    })}
                />
            )}
        </>
    );
}
 