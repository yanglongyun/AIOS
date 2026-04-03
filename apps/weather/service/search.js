const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";

const search = async ({ query }) => {
  if (!query) return { status: 400, message: "query is required" };
  const res = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(query)}&count=10&language=en`);
  if (!res.ok) throw new Error(`Geocoding API error ${res.status}`);
  const data = await res.json();
  return {
    success: true,
    cities: (data.results || []).map((c) => ({
      name: c.name, country: c.country || '', countryCode: c.country_code || '',
      lat: c.latitude, lon: c.longitude, timezone: c.timezone || '',
      admin1: c.admin1 || ''
    }))
  };
};

export { search };
