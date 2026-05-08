# Agent Onboarding: keymapgen

Welcome, fellow agent! This document will help you get up to speed with the `keymapgen` repository quickly and efficiently.

## Repository Overview & Onboarding
- **Tech Stack**: React + Vite. The app is a client-side visual keyboard configuration tool.
- **Core Logic**:
  - `src/utils/keydParser.js` and `src/utils/ahkParser.js`: These handle the bi-directional parsing between the internal JSON format and Keyd (`.conf`) / AutoHotkey (`.ahk`) formats.
  - `src/components/Editor.jsx`: Contains the physical keyboard layout definitions and rendering logic.
  - `src/App.jsx`: Manages the main application state (layers, mappings, loading, and exporting).
- **Efficiency Tip**: When modifying parser logic or key layouts, be careful to maintain the exact string mappings for modifiers (like `C-`, `M-`, `S-`) and system scan codes as expected by Keyd and AHK.

## Examples Directory

All configuration examples are stored in the `/examples/` directory at the root of the project.
- You will find existing `.conf` files here (like `famak.conf`, `colemak.conf`, and `dvorak.conf`).
- These files are standard Keyd configuration files used to provide users with templates or starting points.

## How to Add a New Example Layout

If a user requests the addition of a new example layout (e.g., Halmak, Workman, Colemak-DH), follow these steps:

1. **Create the File**: Create a new text file in the `/examples/` directory named appropriately (e.g., `halmak.conf`).
2. **Define the Structure**: Provide at least an `[ids]` section containing `*` and a `[main]` section.
3. **Map the Keys**: In the `[main]` section, write out the QWERTY-to-Target mapping. The left side of the `=` should be the physical QWERTY key, and the right side should be the output character or action in the target layout (e.g., for QWERTY to Halmak, map `f = h`, etc.).
4. **Keep it Clean**: Usually, you only need to define the alpha keys and standard symbols for basic layouts. You do not need to add custom layers (like `[nav]` or `[sym]`) unless the user specifically asks for a layered example.