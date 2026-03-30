import { exec } from "child_process";
import { getSettings } from "../service/settings/get.js";
const getPlatformBase = () => {
  const { apiUrl, apiKey } = getSettings();
  const base = apiUrl.replace(/\/api\/llm\/.*$/, "");
  return { base, apiKey };
};
const shell = ({ command }) => {
  return new Promise((resolve) => {
    exec(String(command || ""), { timeout: 3e4, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        resolve(`exit code ${err.code}
${stderr || err.message}`);
        return;
      }
      resolve(stdout || stderr || "(no output)");
    });
  });
};
const search = async ({ query }) => {
  try {
    const { base, apiKey } = getPlatformBase();
    const url = `${base}/api/llm/tools/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error(`search API ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "search failed");
    return JSON.stringify(data.data);
  } catch (e) {
    return `search error: ${e.message}`;
  }
};
const get_url = async ({ url }) => {
  try {
    const { base, apiKey } = getPlatformBase();
    const apiUrl = `${base}/api/llm/tools/get-url?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error(`get-url API ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "get-url failed");
    return data.content || "(no content)";
  } catch (e) {
    return `get-url error: ${e.message}`;
  }
};
export {
  get_url,
  search,
  shell
};
