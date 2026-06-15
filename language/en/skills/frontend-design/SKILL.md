---
name: frontend-design
description: AIOS frontend design language (v6). Gray-white-blue, restrained, generous whitespace; token-driven colors, global utilities, standard page skeleton, lucide-only icons, and mobile overlay rules.
---

# AIOS Frontend Design Language (v6)

AIOS is a local Web UI. Visual direction: **gray-white-blue, restrained, generous whitespace**. Clean light-gray background + white cards + a touch of blue. No skeuomorphism, no heavy dark textures, no marketing pages.

## Colors and Tokens

All colors go through tokens in `ui/src/style.css`; hardcoded color values are forbidden:

- Page background `--color-bg` #f6f6f7; white cards `--color-bg-elev`; ink text `--color-ink` #1d1d20; secondary `--color-muted` / `--color-faint`; hairlines `--color-line` / `--color-line-hi`.
- Accent blue `--color-accent` #3b82f6, light blue fill `--color-blue-bg`; status colors `--color-good` green, `--color-bad` red.
- Shadows use the three `--shadow` tiers; do not invent shadows.

## Global Utilities

- `.dot-grid` dotted background texture (full-bleed app background)
- `.page` max-width 860px centered content container
- `.soft-card` large-radius white card
- `.halo-focus` focus halo
- `.chip-card` suggestion chip
- `.save-btn` primary button (flat blue), `.text-input` input field

## Standard Page Skeleton

```html
<div class="absolute inset-0 overflow-y-auto dot-grid">
  <div class="page"> ... </div>
</div>
```

Standard page = full-bleed dot-grid background + 860px centered `.page` + title row (h2 17px/700 + right-side actions) + white card lists/forms (10-16px radius + 1px hairline border + `--shadow`).

## Forbidden

- No gradients, textures, embossed/inset shadows, or serif fonts.
- No emoji as icons. **Icons are lucide-vue-next only**, imported per component; the app icon is declared as a component reference in the `ui/src/apps.js` registry.
- No component libraries; no store for a single app.

## Layout and Shell

- The system owns only the global top bar (`ui/src/system/panel/TopBar.vue`): the left side holds the current app's registered action + title; the right grid button opens the app panel (3-column grid). Everything below the top bar belongs to the app.
- Apps interact with the top bar via `topTitle` / `topLeftAction` (`ui/src/system/shell.js`) and must clean up in `onUnmounted`.
- Mobile: overlay panels use a floating layer + scrim (see the chat history sidebar's `@media (max-width: 768px)`) instead of squeezing content; messages and long text wrap, never causing horizontal scroll.

## Chat and Tool Calls

- User messages, AI messages, and tool calls must be visually distinct.
- Tool calls render as independent single-tool cards. Each tool call is its own collapsed card and expands to show input/output. Component: `ui/src/apps/chat/components/bubbles/ToolCall.vue`, reusable across apps.

## App Signature Layers

Apps may have their own signature layer (like notepad's macaron sticky-note palette), but it must sit on the token skeleton, stay light and fresh, and not break the overall language. Loading, empty, and error states are required.

## Reference Files

- `ui/src/style.css` — design tokens and global utilities
- `ui/src/App.vue` — shell: global top bar + current app filling the rest
- `ui/src/system/panel/TopBar.vue` — top bar and app panel
- `ui/src/apps/notepad/` — the most complete app sample (with a signature layer)
- `ui/src/apps/chat/components/bubbles/ToolCall.vue` — single tool-call card
