const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

function getApiKey() {
  if (!API_KEY || API_KEY === "tu_clave_de_api_aqui") {
    throw new Error(
      "Configura una clave válida en NEXT_PUBLIC_WEATHER_API_KEY dentro de .env.",
    );
  }

  return API_KEY;
}

async function fetchWeather(params, errorMessage) {
  const query = new URLSearchParams({
    ...params,
    units: "metric",
    lang: "es",
    appid: getApiKey(),
  });
  const response = await fetch(`${BASE_URL}/weather?${query}`);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "La clave de OpenWeather no es válida o aún no está activada.",
      );
    }

    if (response.status === 404) {
      throw new Error(errorMessage);
    }

    if (response.status === 429) {
      throw new Error("Se alcanzó el límite de consultas de OpenWeather.");
    }

    throw new Error(`OpenWeather respondió con un error (${response.status}).`);
  }

  return response.json();
}

export function getWeatherByCity(city) {
  return fetchWeather(
    { q: city },
    "No se encontró la ciudad solicitada.",
  );
}

export function getWeatherByCoords(lat, lon) {
  return fetchWeather(
    { lat: String(lat), lon: String(lon) },
    "Error al consultar el clima para tu ubicación.",
  );
}
