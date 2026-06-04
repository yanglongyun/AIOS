# browser-use

## Description

Use this skill when the user asks the Agent to inspect or operate Chrome through the browser connector: list tabs, open or activate tabs, navigate pages, evaluate JavaScript, or capture browser screenshots.

## When To Use

- The task requires controlling Chrome tabs or pages.
- The task needs page state from the user browser rather than a generic HTTP request.
- The task requires running JavaScript in an open Chrome tab.
- The task requires a browser screenshot through the Chrome extension.

## Setup

The browser connector has two parts:

- Local service: `node skills/browser-use/server/index.js` starts the HTTP/WebSocket bridge on port `9522` by default.
- Chrome extension: load `skills/browser-use/extension` in Chrome and keep it connected to the local service.

If the connector is not running or the extension is not connected, inspect service status first and tell the user the connector needs to be running.

## Workflow

Use the existing `shell` tool to inspect or run the connector code under `skills/browser-use/` when browser automation is required. The connector exposes these local capability names internally:

- `browser_status`: get bridge status and active tab information.
- `browser_open_tab`: open a new Chrome tab.
- `browser_tabs`: list Chrome tabs.
- `browser_activate_tab`: focus a Chrome tab.
- `browser_close_tab`: close a Chrome tab.
- `browser_navigate`: navigate a tab to a URL.
- `browser_evaluate`: run JavaScript in a tab.
- `browser_screenshot`: capture the visible area of a tab.

## Notes

- Prefer `browser_tabs` or `browser_status` before acting when the target tab is unclear.
- Use `tabId` whenever operating on a specific tab.
- Avoid executing destructive JavaScript or submitting external forms without user confirmation.
- Use `browser_screenshot` when visual layout matters.
