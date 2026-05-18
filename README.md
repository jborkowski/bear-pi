# Bear Pi Extension

A Pi extension that integrates Bear notes through the Bear macOS CLI. 

This extension depends on the system-installed Bear app CLI (`/Applications/Bear.app/Contents/MacOS/bearcli`). It provides full support for listing, searching, reading, creating, and updating Bear notes directly from your Pi agent.

## Prerequisites

- macOS
- Bear 2.8+ installed (must include `bearcli` in the app bundle)
- Pi coding agent

## Installation

1. Clone or copy this package to a directory of your choice.
2. Run `npm install` inside the folder to install dependencies.
3. Link the extension to your local Pi agent configuration by adding it to `~/.pi/settings.json` or `.pi/settings.json` in your project:

```json
{
  "extensions": [
    "/absolute/path/to/bear-pi"
  ]
}
```

Alternatively, you can test it directly:
```bash
pi -e ./src/index.ts
```

## Available Tools

- **bear_search**: Search notes using Bear's native syntax (e.g., `@todo`, `#work`).
- **bear_list**: List recent notes.
- **bear_read**: Fetch a complete note along with its metadata.
- **bear_create**: Create a new note.
- **bear_update**: Overwrite an existing note.
- **bear_open**: Open the note directly in the Bear UI.

## Capabilities Map

| Pi Action / Tool | BearCLI Subcommand |
|------------------|--------------------|
| `bear_search`    | `bearcli search`   |
| `bear_list`      | `bearcli list`     |
| `bear_read`      | `bearcli show`     |
| `bear_create`    | `bearcli create`   |
| `bear_update`    | `bearcli overwrite`|
| `bear_open`      | `bearcli open`     |

## Next Steps (MCP Mode)

Currently, the extension shells out directly to `bearcli` commands via an adapter pattern in `src/bearcli.ts`. Since Bear 2.8+ provides a built-in MCP server, you can migrate this extension to use MCP by swapping the adapter to communicate over `stdio` using `bearcli mcp-server`. This would enable standard MCP tool discovery.

To test MCP, run:
```bash
bearcli mcp-server
```

For now, direct CLI commands are used for simplicity, minimal overhead, and exact output control.
