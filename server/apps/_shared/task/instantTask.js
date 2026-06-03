import { parseJsonObject } from "../../../shared/ai/json.js";

const requestInstant = async (body = {}) => {
    let resp;
    try {
        resp = await fetch(`http://localhost:${process.env.AIOS_MAIN_PORT || 9502}/api/task/create/instant`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
    responseFormat = null,
    monitor = null,
} = {}) => {
    return await requestInstant({
        app,
        title,
        payload,
        meta,
        responseFormat,
        monitor,
    });
};

const instantTaskJson = async (args = {}) => {
    const data = await instantTask({
        ...args,
        responseFormat: "json",
    });
    return parseJsonObject(data.response || "");
};

export { instantTask, instantTaskJson };
