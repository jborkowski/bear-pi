# AGENTS.md

Pi extension that integrates Bear notes via the Bear macOS CLI (`bearcli`). TypeScript, Bun runtime, `@earendil-works/pi-coding-agent` SDK.

## Project map

- `src/index.ts` - Extension entry point. Validates bearcli availability, registers tools.
- `src/bearcli.ts` - Adapter over `/Applications/Bear.app/Contents/MacOS/bearcli`. Singleton `BearCLI` class with async methods for each CLI subcommand.
- `src/tools.ts` - Registers Pi tools: `bear_search`, `bear_list`, `bear_read`, `bear_create`, `bear_update`, `bear_append`, `bear_edit`, `bear_tags_*`, `bear_trash`, `bear_archive`, `bear_restore`, `bear_search_in`, `bear_attachments_*`, `bear_open`.
- `test/smoke.test.ts` - Basic smoke test.

<important if="you need to run commands to build, test, or lint">

| Command | What it does |
|---|---|
| `bun test/smoke.test.ts` | Run smoke test |
| `oxlint` | Lint |
</important>

<important if="you are writing or modifying code">

No emoji in the codebase. Write self-documented code: names (variables, functions, types) should convey intent. Use comments only for complex functions or non-obvious logic.
</important>

<important if="you are adding new tools to the extension">

Register tools in `src/tools.ts` using `pi.registerTool()`. Follow the pattern of existing tools: `Type` schema from `@sinclair/typebox`, async execute returning `{ content: [{ type: "text", text: ... }] }`. Add the underlying method to the `BearCLI` class in `src/bearcli.ts` first.
</important>

<important if="you are modifying the bearcli adapter">

The `BearCLI` class is the single source of truth for Bear interaction. It shells out to `bearcli` via `execFile`. Bear's SQLite database is sandboxed -- all data access must go through `bearcli`. Check `bearcli help <subcommand>` for available flags and field names before adding methods.
</important>

<important if="you are working on the vector index feature">

The goal is semantic search over Bear notes using a local SQLite database with vector embeddings. Architecture:

1. **Data source**: `bearcli list --fields all,content` returns all notes with content. ~234 notes currently.
2. **Storage**: Local SQLite (prefer `better-sqlite3` over `bun:sqlite` -- `bun:sqlite` cannot load native extensions like `sqlite-vec`).
3. **Embeddings**: Call an embedding API (OpenAI `text-embedding-3-small` or Z AI). Chunk notes by markdown headers, ~500 tokens per chunk, with overlap.
4. **Vector search**: For MVP, store vectors as blobs and compute cosine similarity in TypeScript. Upgrade to `sqlite-vec` for a proper ANN index later.
5. **Incremental sync**: Track `modified` timestamps. Re-embed only changed notes.
6. **Tools to add**: `bear_index_build` (full or incremental re-index), `bear_semantic_search` (query with top-K results), `bear_index_status` (last indexed, note count).

Open decisions:
- Embedding provider: OpenAI vs Z AI vs local model
- DB location: `~/.cache/bear-vec-index/` or extension directory
- Hybrid search: combine vector results with Bear's native keyword search
- Encrypted notes: `bearcli` cannot read locked notes, skip them during indexing
</important>
