# computer-use

## Description

Use this skill when the user asks the Agent to inspect or operate the local desktop: screenshots, mouse movement, clicks, scrolling, typing, keyboard shortcuts, or checking local computer automation status.

## When To Use

- The task requires visual inspection of the current desktop.
- The task requires controlling the mouse or keyboard.
- The task needs a screenshot of the local screen.
- The user explicitly asks to use the computer, desktop, mouse, keyboard, or screen.

## Workflow

Use the existing `shell` tool to inspect or run the connector code under `skills/computer-use/` when desktop automation is required. The connector exposes these local capability names internally:

- `computer_status`: get service status, available tools, and local drivers.
- `computer_shell`: execute a shell command through the computer-use connector.
- `computer_screenshot`: capture the current screen to an image file.
- `computer_mouse_move`: move pointer to screen coordinates.
- `computer_click`: click at screen coordinates.
- `computer_double_click`: double-click at screen coordinates.
- `computer_right_click`: right-click at screen coordinates.
- `computer_scroll`: scroll the active desktop application.
- `computer_type`: type text into the active application.
- `computer_key`: press one key with optional modifiers.
- `computer_hotkey`: press a shortcut such as `["command", "l"]`.

## Notes

- Prefer `computer_screenshot` before clicking when the UI state is unknown.
- Use coordinates only when they come from a recent screenshot or user-provided location.
- Ask before destructive desktop operations such as deleting files, closing unsaved work, changing system settings, or submitting forms with external effects.
- Use `dryRun: true` when checking an action plan without executing pointer or keyboard input.
