import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { bearcli } from "./bearcli";

export function registerBearTools(pi: ExtensionAPI) {
  pi.registerTool({
    name: "bear_search",
    label: "Bear Search",
    description: "Search Bear notes using Bear's search syntax. Use this to find notes by keyword, tags, or exact phrase.",
    promptSnippet: "Search Bear notes",
    parameters: Type.Object({
      query: Type.String({ description: "Search query (e.g. '@todo', 'meeting', '#work')" }),
      limit: Type.Optional(Type.Number({ description: "Max results to return (default 20)" }))
    }),
    async execute(_id, params) {
      const results = await bearcli.search(params.query, params.limit ?? 20);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  });

  pi.registerTool({
    name: "bear_list",
    label: "Bear List",
    description: "List recent Bear notes.",
    promptSnippet: "List recent Bear notes",
    parameters: Type.Object({
      limit: Type.Optional(Type.Number({ description: "Max results to return (default 20)" }))
    }),
    async execute(_id, params) {
      const results = await bearcli.list(params.limit ?? 20);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  });

  pi.registerTool({
    name: "bear_read",
    label: "Bear Read Note",
    description: "Read the full content and metadata of a Bear note by its ID.",
    promptSnippet: "Read a Bear note by ID",
    parameters: Type.Object({
      id: Type.String({ description: "Note ID" })
    }),
    async execute(_id, params) {
      const result = await bearcli.read(params.id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  });

  pi.registerTool({
    name: "bear_create",
    label: "Bear Create Note",
    description: "Create a new Bear note.",
    promptSnippet: "Create a new Bear note",
    parameters: Type.Object({
      title: Type.Optional(Type.String({ description: "Note title. If omitted, derived from content." })),
      content: Type.String({ description: "Note body content." }),
      tags: Type.Optional(Type.String({ description: "Comma-separated tags (e.g. 'work, draft')" }))
    }),
    async execute(_id, params) {
      const result = await bearcli.create(params.title, params.content, params.tags);
      return {
        content: [{ type: "text", text: `Note created successfully.\n\n${JSON.stringify(result, null, 2)}` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_update",
    label: "Bear Update Note",
    description: "Overwrite the entire content of a Bear note.",
    promptSnippet: "Overwrite a Bear note",
    parameters: Type.Object({
      id: Type.String({ description: "Note ID to update." }),
      content: Type.String({ description: "New complete note content." })
    }),
    async execute(_id, params) {
      await bearcli.update(params.id, params.content);
      return {
        content: [{ type: "text", text: `Note ${params.id} updated successfully.` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_open",
    label: "Bear Open Note",
    description: "Open a Bear note in the Bear app.",
    promptSnippet: "Open a Bear note in the app",
    parameters: Type.Object({
      id: Type.String({ description: "Note ID to open." })
    }),
    async execute(_id, params) {
      await bearcli.open(params.id);
      return {
        content: [{ type: "text", text: `Note ${params.id} opened in Bear app.` }],
      };
    }
  });
}