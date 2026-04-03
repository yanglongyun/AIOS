const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

const WMO_CODES = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
  80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers', 95: 'Thunderstorm', 96: 'Hail Storm'
};

const forecast = async ({ lat, lon }) => {
  if (!lat || !lon) return { status: 400, message: "lat and lon are required" };
  const res = await fetch(
    `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`
  );
  if (!res.ok) throw new Error(`Weather API error ${res.status}`);
  const data = await res.json();
  const current = data.current || {};
  const daily = data.daily || {};
  return {
    success: true,
    current: {
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
      weather: WMO_CODES[current.weather_code] || 'Unknown'
    },
    daily: (daily.time || []).map((date, i) => ({
      date,
      tempMax: daily.temperature_2m_max?.[i],
      tempMin: daily.temperature_2m_min?.[i],
      precipitation: daily.precipitation_sum?.[i],
      windSpeed: daily.wind_speed_10m_max?.[i],
      weatherCode: daily.weather_code?.[i],
      weather: WMO_CODES[daily.weather_code?.[i]] || 'Unknown'
    })),
    timezone: data.timezone
  };
};

export { forecast };
