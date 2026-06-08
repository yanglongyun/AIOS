---
name: frontend-design
description: AIOS main frontend design language. Defines the Vue Web UI's skeuomorphic visuals, responsive layout, chat, tasks, and app interfaces.
---

# AIOS Frontend Design Language

The main AIOS project is a local Web UI. Keep the visual direction warm, restrained, and tactile: paper surfaces, glass buttons, soft shadows, and gold highlights. It is not a desktop admin dashboard.

## Core Character

- Warm paper, light leather texture, glass buttons, and gold accents.
- Controls should feel pressable, inputs should feel inset, and app icons should feel like standalone objects.
- Do not use Material 3 / Gemini blue-gray styling or flat SaaS styling.
- Stay responsive, but do not introduce complex window systems, desktop rails, or hover-dependent interactions.

## Color

Prefer tokens from `ui/src/style.css`:

- Background: warm cream, paper surfaces, subtle gradients.
- Top and bottom bars: deep warm brown, wood-like or glass-like materials.
- Accents: gold, amber, and soft teal.
- Text: deep warm ink for primary text, muted warm tones for secondary text.
- Status colors may use red/green, but keep them muted.

## Material And Depth

- Use subtle inset shadows, outer shadows, and edge highlights to express depth.
- Inputs, search fields, and the bottom composer should feel inset into a base.
- Send buttons, app icons, and top buttons should feel slightly raised.
- Keep content clear; do not turn every list item into a heavy card.

## Layout

- Keep the main navigation focused on Chat, Apps, and Tasks.
- On small screens, preserve comfortable touch targets; on large screens, preserve reading width and information density.
- The chat composer stays at the bottom, the message area scrolls vertically, and content must not create horizontal scrolling.
- App grids and task lists need stable loading, empty, and error states.

## Chat

- Chat is the core experience. User messages, AI messages, subscription messages, and tool calls need distinct visual treatment.
- Once AI content starts streaming, the thinking placeholder should disappear or become the real message; it must not coexist with the final content.
- Tool calls and results are shown as groups, with summaries first and details expandable.
- Code blocks and long text must wrap safely and never force horizontal page scrolling.

## Apps

- App entries use skeuomorphic square icons with short labels underneath.
- App internals may split into `views/`, `components/`, `composables/`, and `api.js`.
- Do not build app landing pages; the first screen should be the usable feature.

## Tasks

- Tasks are system work records. Split list and detail views; details show input, process, output, and errors.
- Use small badges, hairlines, and muted blocks for status.
- When subscription results return to chat, render them as subscription messages, not fake user messages.

## Reference Files

- `ui/src/style.css` — global visual tokens and skeuomorphic foundations
- `ui/src/App.vue` — main shell and primary navigation
- `ui/src/system/components/TopBar.vue` — top bar
- `ui/src/system/components/TabBar.vue` — bottom navigation
- `ui/src/apps/chat/views/index.vue` — chat experience
- `ui/src/system/views/apps/AppsView.vue` — apps grid
- `ui/src/system/views/tasks/index.vue` — task list and detail
