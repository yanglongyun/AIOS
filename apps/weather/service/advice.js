import { agentTask } from "../../app_shared/agentTask.js";

const advice = async ({ city, current, daily, locale = "en" }) => {
  const lang = locale === "zh" ? "中文" : "English";
  const dailyStr = (daily || []).slice(0, 3).map((d) =>
    `${d.date}: ${d.weather}, ${d.tempMin}°~${d.tempMax}°C, rain ${d.precipitation}mm`
  ).join('\n');

  const prompt = `Based on this weather data for ${city}, give practical advice in ${lang}. Include: what to wear, whether to carry an umbrella, outdoor activity suggestions. Be concise (3-4 sentences).

Current: ${current?.weather}, ${current?.temp}°C (feels like ${current?.feelsLike}°C), humidity ${current?.humidity}%, wind ${current?.windSpeed}km/h
Next 3 days:
${dailyStr}

Return only the advice, nothing else.`;

  const result = await agentTask({ app: "weather", title: `Weather Advice: ${city}`, prompt });
  return { success: true, advice: result.response || "" };
};

export { advice };
