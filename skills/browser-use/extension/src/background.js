// AGENT browser-use connector service worker.
// WS bridge -> ws.js
// Popup status -> popup-bridge.js
// Tool implementations -> tools/*

import { connect } from './ws.js';
import './popup-bridge.js';

chrome.runtime.onInstalled.addListener(() => { connect(); });
chrome.runtime.onStartup.addListener(() => { connect(); });
connect();
