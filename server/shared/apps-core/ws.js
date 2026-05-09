const hub = () => globalThis.__meem_ws__ || null;

const rawBroadcast = (msg) => hub()?.broadcast?.(msg);
const rawSendToClient = (clientId, msg) => hub()?.sendToClient?.(clientId, msg);

const send = (msg) => {
    if (!msg) return;
    const to = msg.to;
    if (typeof to === 'string' && to.startsWith('web:')) {
        rawSendToClient(to.slice('web:'.length), msg);
        return;
    }
    rawBroadcast(msg);
};

const broadcast = (type, data) => rawBroadcast({ type, data });
const sendToClient = (clientId, type, data) => rawSendToClient(clientId, { type, data });

const getSessionId = () => '';

module.exports = { send, sendToClient, broadcast, getSessionId };
