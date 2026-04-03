const USGS_API = "https://earthquake.usgs.gov/fdsnws/event/1/query";

const list = async ({ minMagnitude = 2.5, days = 7, limit = 200 } = {}) => {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const url = `${USGS_API}?format=geojson&starttime=${start.toISOString()}&endtime=${end.toISOString()}&minmagnitude=${minMagnitude}&limit=${limit}&orderby=time`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS API error ${res.status}`);
  const data = await res.json();
  return {
    success: true,
    quakes: (data.features || []).map((f) => ({
      id: f.id,
      mag: f.properties.mag,
      place: f.properties.place || '',
      time: f.properties.time,
      url: f.properties.url,
      tsunami: f.properties.tsunami,
      lng: f.geometry?.coordinates?.[0],
      lat: f.geometry?.coordinates?.[1],
      depth: f.geometry?.coordinates?.[2]
    })),
    count: data.metadata?.count || 0
  };
};

export { list };
