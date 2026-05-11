import { parseJsonObject } from "../ai/json.js";
import { getApiToken } from "./apiToken.js";

const requestInstant = async (body = {}) => {
    let resp;
    try {
        const token = getApiToken();
        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        resp = await fetch(`http://localhost:${process.env.AIOS_MAIN_PORT || 9501}/api/task/create/instant`, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
        });
    } catch (err) {
        throw new Error(`task service unreachable: ${err.message}`);
    }
    let data;
    try { data = await resp.json(); } catch { data = {}; }
    if (!resp.ok || data.success === false) {
        throw new Error(data.message || data.error || `request failed ${resp.status}`);
    }
    return data;
};

const instantTask = async ({
    app,
    title = "",
    payload,
    meta = null,
} = {}) => {
    return await requestInstant({
        app,
        title,
        payload,
        meta,
    });
};

const instantTaskJson = async (args = {}) => {
    const data = await instantTask(args);
    return parseJsonObject(data.response || "");
};

export { instantTask, instantTaskJson };
