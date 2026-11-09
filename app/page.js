"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import InstallPrompt from "./components/InstallPrompt";
import { getWeatherByCity, getWeatherByCoords } from "@/lib/weather";
import "./page.css";

function subscribeToWeatherCache(onChange) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getWeatherCacheSnapshot() {
  return localStorage.getItem("last_weather");
}

export default function Home() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cachedWeather = useSyncExternalStore(
    subscribeToWeatherCache,
    getWeatherCacheSnapshot,
    () => null,
  );
  let cachedWeatherData = null;
  let cacheError = "";

  if (cachedWeather) {
    try {
      cachedWeatherData = JSON.parse(cachedWeather);
    } catch {
      cacheError = "No se pudieron cargar los datos guardados del clima.";
    }
  }
  const displayedWeather = weather ?? cachedWeatherData;

  useEffect(() => {
    if (cacheError) {
      localStorage.removeItem("last_weather");
    }
  }, [cacheError]);

  const executeFetch = async (apiCall) => {
    setLoading(true);
    setError("");

    try {
      const data = await apiCall();
      setWeather(data);
      localStorage.setItem("last_weather", JSON.stringify(data));
    } catch (fetchError) {
      setError(fetchError.message || "Error al obtener datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!city.trim()) return;

    executeFetch(() => getWeatherByCity(city.trim()));
  };

  const handleGeoLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no ofrece acceso a la ubicación.");
      return;
    }

    if (!window.isSecureContext) {
      setError(
        "Para usar tu ubicación, abre la app mediante HTTPS o desde localhost.",
      );
      return;
    }

    setError("");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        executeFetch(() => getWeatherByCoords(coords.latitude, coords.longitude));
      },
      (locationError) => {
        setLoading(false);

        if (locationError.code === locationError.PERMISSION_DENIED) {
          setError(
            "No se permitió el acceso a tu ubicación. Habilita Ubicación en los permisos de este sitio en tu navegador y vuelve a intentarlo.",
          );
        } else if (locationError.code === locationError.POSITION_UNAVAILABLE) {
          setError(
            "No se pudo determinar tu ubicación. Activa los servicios de ubicación de tu dispositivo e inténtalo de nuevo.",
          );
        } else {
          setError(
            "La ubicación tardó demasiado en responder. Comprueba la señal e inténtalo de nuevo.",
          );
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  };

  return (
    <main className="weather-page">
      <header className="weather-header">
        <h1 className="weather-title">WeatherPWA</h1>
        <InstallPrompt />
      </header>

      <section className="weather-search">
        <form onSubmit={handleSearch} className="weather-search-form">
          <input
            type="text"
            placeholder="Ejemplo: Oaxaca, Madrid..."
            aria-label="Buscar ciudad"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="weather-input"
          />
          <button
            type="submit"
            disabled={loading}
            className="weather-button"
          >
            Buscar
          </button>
        </form>

        <button
          onClick={handleGeoLocation}
          disabled={loading}
          className="weather-location-button"
        >
          Usar mi ubicación actual
        </button>
        <p className="location-help">
          Al continuar, tu navegador te pedirá permiso para acceder a tu
          ubicación.
        </p>
      </section>

      {loading && (
        <p role="status" className="weather-status">
          Cargando datos del clima...
        </p>
      )}
      {(error || cacheError) && (
        <p role="alert" className="weather-error">
          {error || cacheError}
        </p>
      )}

      {displayedWeather && !loading && (
        <article className="weather-card">
          <h2 className="weather-city">
            {displayedWeather.name}, {displayedWeather.sys.country}
          </h2>
          <div className="weather-summary">
            <Image
              src={`https://openweathermap.org/img/wn/${displayedWeather.weather[0].icon}@2x.png`}
              alt={displayedWeather.weather[0].description}
              width={100}
              height={100}
              className="weather-icon"
            />
            <span className="weather-temperature">
              {Math.round(displayedWeather.main.temp)}°C
            </span>
          </div>
          <p className="weather-description">
            {displayedWeather.weather[0].description}
          </p>
          <div className="weather-details">
            <div className="weather-detail">
              Humedad:{" "}
              <strong>{displayedWeather.main.humidity}%</strong>
            </div>
            <div className="weather-detail">
              Viento:{" "}
              <strong>{displayedWeather.wind.speed} m/s</strong>
            </div>
          </div>
        </article>
      )}
    </main>
  );
}
