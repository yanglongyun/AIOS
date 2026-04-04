import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { search } from "../service/search.js";
import { forecast } from "../service/forecast.js";
import { advice } from "../service/advice.js";
import { addCity, removeCity, listCities } from "../repository/city.js";

const handleWeatherApi = async (req, res, path) => {
  if (path === "/apps/weather/search" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = url.searchParams.get("q") || "";
    const locale = url.searchParams.get("locale") || "";
    const data = await search({ query, locale });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/apps/weather/forecast" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));
    const data = await forecast({ lat, lon });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/apps/weather/advice" && req.method === "POST") {
    const body = await readBody(req);
    const data = await advice(body);
    return json(res, data);
  }
  if (path === "/apps/weather/cities" && req.method === "GET") {
    return json(res, { success: true, cities: listCities() });
  }
  if (path === "/apps/weather/city" && req.method === "POST") {
    const body = await readBody(req);
    addCity({ name: body.name, country: body.country, lat: body.lat, lon: body.lon });
    return json(res, { success: true });
  }
  if (path === "/apps/weather/city/remove" && req.method === "POST") {
    const body = await readBody(req);
    removeCity(body.id);
    return json(res, { success: true });
  }
  return false;
};

export { handleWeatherApi };
