const GEOCODING_API = "https://nominatim.openstreetmap.org/search";
const FALLBACK_GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";

const normalizeLocale = (locale) => {
  const value = String(locale || "").trim();
  return value || "en";
};

const normalizeCountryCode = (countryCode) => String(countryCode || "").trim().toUpperCase();

const looksLikeShortChineseCity = (query) => /^[\u3400-\u9fff]{2,4}$/.test(String(query || "").trim());

const buildFallbackQueries = (query) => {
  const value = String(query || "").trim();
  if (!value) return [];
  const list = [];
  if (looksLikeShortChineseCity(value) && !/[市区县州盟旗]$/.test(value)) {
    list.push(`${value}市`);
  }
  list.push(value);
  return list;
};

const cityWeight = (item) => {
  const type = String(item?.type || "").toLowerCase();
  if (type === "city") return 5;
  if (type === "administrative") return 4;
  if (type === "town") return 3;
  if (type === "municipality") return 2;
  if (type === "village") return 1;
  return 0;
};

const mapCity = (item) => {
  const address = item?.address || {};
  const name = String(
    item?.name ||
    address.city ||
    address.town ||
    address.municipality ||
    address.county ||
    address.state ||
    ""
  ).trim();
  const country = String(address.country || "").trim();
  const admin1 = String(address.state || address.region || "").trim();
  const countryCode = normalizeCountryCode(address.country_code);
  return {
    name,
    country,
    countryCode,
    lat: Number(item?.lat),
    lon: Number(item?.lon),
    timezone: "",
    admin1,
    type: String(item?.type || "").trim(),
    importance: Number(item?.importance || 0)
  };
};

const sortCities = (cities) => cities.sort((a, b) => {
  const byWeight = cityWeight(b) - cityWeight(a);
  if (byWeight !== 0) return byWeight;
  const byImportance = Number(b.importance || 0) - Number(a.importance || 0);
  if (byImportance !== 0) return byImportance;
  return String(a.name || "").localeCompare(String(b.name || ""));
});

const dedupeCities = (cities) => {
  const seen = new Set();
  const result = [];
  for (const city of cities) {
    const key = [
      city.name,
      city.admin1,
      city.country,
      Number(city.lat).toFixed(4),
      Number(city.lon).toFixed(4)
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(city);
  }
  return result;
};

const search = async ({ query, locale }) => {
  if (!query) return { status: 400, message: "query is required" };
  try {
    const params = new URLSearchParams({
      q: String(query || "").trim(),
      format: "jsonv2",
      limit: "10",
      addressdetails: "1"
    });
    const res = await fetch(`${GEOCODING_API}?${params.toString()}`, {
      headers: {
        "User-Agent": "AIOS/1.0 weather search",
        "Accept-Language": normalizeLocale(locale)
      },
      signal: AbortSignal.timeout(8e3)
    });
    if (!res.ok) throw new Error(`Geocoding API error ${res.status}`);
    const data = await res.json();
    const cities = dedupeCities(sortCities((Array.isArray(data) ? data : []).map(mapCity))).map(({ type, importance, ...city }) => city);
    return { success: true, cities };
  } catch {
    const fallbackLocale = normalizeLocale(locale).split(/[-_]/)[0] || "en";
    const results = [];
    const seen = new Set();
    for (const candidate of buildFallbackQueries(query)) {
      const params = new URLSearchParams({
        name: candidate,
        count: "10",
        language: fallbackLocale
      });
      const res = await fetch(`${FALLBACK_GEOCODING_API}?${params.toString()}`, {
        signal: AbortSignal.timeout(8e3)
      });
      if (!res.ok) throw new Error(`Fallback geocoding API error ${res.status}`);
      const data = await res.json();
      for (const c of data.results || []) {
        const city = {
          name: c.name,
          country: c.country || '',
          countryCode: c.country_code || '',
          lat: c.latitude,
          lon: c.longitude,
          timezone: c.timezone || '',
          admin1: c.admin1 || ''
        };
        const key = `${city.name}|${city.country}|${city.admin1}|${city.lat}|${city.lon}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(city);
      }
      if (results.length > 0 && candidate !== String(query || "").trim()) break;
    }
    return { success: true, cities: results };
  }
};

export { search };
