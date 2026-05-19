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
    name: "bear_append",
    label: "Bear Append to Note",
    description: "Append or prepend content to an existing Bear note.",
    promptSnippet: "Append content to a Bear note",
    parameters: Type.Object({
      id: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or id." })),
      content: Type.String({ description: "Content to append or prepend to the note." }),
      position: Type.Optional(Type.String({ description: "Where to insert: 'end' (default) or 'beginning'." })),
      noUpdateModified: Type.Optional(Type.Boolean({ description: "Preserve the note's modification date." }))
    }),
    async execute(_id, params) {
      await bearcli.append({
        id: params.id,
        title: params.title,
        content: params.content,
        position: params.position as 'beginning' | 'end' | undefined,
        noUpdateModified: params.noUpdateModified
      });
      const target = params.id ?? params.title ?? 'note';
      const pos = params.position === 'beginning' ? 'prepended to' : 'appended to';
      return {
        content: [{ type: "text", text: `Content ${pos} ${target} successfully.` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_edit",
    label: "Bear Edit Note",
    description: "Edit a note by finding exact text and replacing or inserting around it. Provide exactly one of replace, insertAfter, or insertBefore.",
    promptSnippet: "Edit Bear note content",
    parameters: Type.Object({
      id: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or id." })),
      find: Type.String({ description: "Exact text to find." }),
      replace: Type.Optional(Type.String({ description: "Replace matched text with this." })),
      insertAfter: Type.Optional(Type.String({ description: "Insert text immediately after the match." })),
      insertBefore: Type.Optional(Type.String({ description: "Insert text immediately before the match." })),
      all: Type.Optional(Type.Boolean({ description: "Apply to all occurrences." })),
      ignoreCase: Type.Optional(Type.Boolean({ description: "Case-insensitive matching." })),
      word: Type.Optional(Type.Boolean({ description: "Match whole words only." })),
      noUpdateModified: Type.Optional(Type.Boolean({ description: "Preserve the note's modification date." })),
      force: Type.Optional(Type.Boolean({ description: "Bypass attachment-removal safety check." }))
    }),
    async execute(_id, params) {
      await bearcli.edit({
        id: params.id,
        title: params.title,
        find: params.find,
        replace: params.replace,
        insertAfter: params.insertAfter,
        insertBefore: params.insertBefore,
        all: params.all,
        ignoreCase: params.ignoreCase,
        word: params.word,
        noUpdateModified: params.noUpdateModified,
        force: params.force
      });
      const target = params.id ?? params.title ?? 'note';
      return {
        content: [{ type: "text", text: `Note ${target} edited successfully.` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_tags_list",
    label: "Bear List Tags",
    description: "List tags globally or for a specific note.",
    promptSnippet: "List Bear note tags",
    parameters: Type.Object({
      noteId: Type.Optional(Type.String({ description: "Note ID to list tags for. Omit for all tags." })),
      title: Type.Optional(Type.String({ description: "Note title (case-insensitive). Use instead of noteId." })),
      count: Type.Optional(Type.Boolean({ description: "Return only the count of tags." }))
    }),
    async execute(_id, params) {
      const results = await bearcli.tagsList({ noteId: params.noteId, title: params.title, count: params.count });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  });

  pi.registerTool({
    name: "bear_tags_add",
    label: "Bear Add Tags",
    description: "Add tags to a note. Already-present tags are silently skipped.",
    promptSnippet: "Add tags to Bear note",
    parameters: Type.Object({
      noteId: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or noteId." })),
      tags: Type.Array(Type.String(), { minItems: 1, description: "Tag names to add (without #)." })
    }),
    async execute(_id, params) {
      await bearcli.tagsAdd(params.noteId, params.title, params.tags);
      const target = params.noteId ?? params.title ?? 'note';
      return {
        content: [{ type: "text", text: `Tags added to ${target}: ${params.tags.join(', ')}` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_tags_remove",
    label: "Bear Remove Tags",
    description: "Remove tags from a note. Tags not present are silently skipped.",
    promptSnippet: "Remove tags from Bear note",
    parameters: Type.Object({
      noteId: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or noteId." })),
      tags: Type.Array(Type.String(), { minItems: 1, description: "Tag names to remove (without #)." })
    }),
    async execute(_id, params) {
      await bearcli.tagsRemove(params.noteId, params.title, params.tags);
      const target = params.noteId ?? params.title ?? 'note';
      return {
        content: [{ type: "text", text: `Tags removed from ${target}: ${params.tags.join(', ')}` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_tags_rename",
    label: "Bear Rename Tag",
    description: "Rename a tag across all notes. Use force to merge if the new tag already exists.",
    promptSnippet: "Rename Bear tag globally",
    parameters: Type.Object({
      oldTag: Type.String({ description: "Current tag name (without #)." }),
      newTag: Type.String({ description: "New tag name (without #)." }),
      force: Type.Optional(Type.Boolean({ description: "Force merge if new tag already exists." }))
    }),
    async execute(_id, params) {
      await bearcli.tagsRename(params.oldTag, params.newTag, params.force);
      return {
        content: [{ type: "text", text: `Tag renamed: #${params.oldTag} -> #${params.newTag}` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_tags_delete",
    label: "Bear Delete Tag",
    description: "Delete a tag from all notes.",
    promptSnippet: "Delete Bear tag globally",
    parameters: Type.Object({
      tag: Type.String({ description: "Tag name to delete from all notes (without #)." })
    }),
    async execute(_id, params) {
      await bearcli.tagsDelete(params.tag);
      return {
        content: [{ type: "text", text: `Tag deleted from all notes: #${params.tag}` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_trash",
    label: "Bear Trash Note",
    description: "Move a note to the trash (soft-delete). Can be restored with bear_restore.",
    promptSnippet: "Trash Bear note",
    parameters: Type.Object({
      id: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or id." }))
    }),
    async execute(_id, params) {
      await bearcli.trash(params.id, params.title);
      const target = params.id ?? params.title ?? 'note';
      return {
        content: [{ type: "text", text: `Note ${target} moved to trash.` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_archive",
    label: "Bear Archive Note",
    description: "Move a note to the archive. Hidden from active notes but can be restored.",
    promptSnippet: "Archive Bear note",
    parameters: Type.Object({
      id: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or id." }))
    }),
    async execute(_id, params) {
      await bearcli.archive(params.id, params.title);
      const target = params.id ?? params.title ?? 'note';
      return {
        content: [{ type: "text", text: `Note ${target} archived.` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_restore",
    label: "Bear Restore Note",
    description: "Restore a note from trash or archive back to the active notes list.",
    promptSnippet: "Restore Bear note",
    parameters: Type.Object({
      id: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or id." }))
    }),
    async execute(_id, params) {
      await bearcli.restore(params.id, params.title);
      const target = params.id ?? params.title ?? 'note';
      return {
        content: [{ type: "text", text: `Note ${target} restored.` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_search_in",
    label: "Bear Search in Note",
    description: "Find exact string occurrences within a specific note, with context snippets.",
    promptSnippet: "Search within a Bear note",
    parameters: Type.Object({
      id: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or id." })),
      string: Type.String({ description: "Exact text to find (case-insensitive)." }),
      context: Type.Optional(Type.Number({ description: "Snippet length in characters (default 120)." })),
      limit: Type.Optional(Type.Number({ description: "Maximum number of matches to return." })),
      count: Type.Optional(Type.Boolean({ description: "Return only the total number of matches." }))
    }),
    async execute(_id, params) {
      const results = await bearcli.searchIn({
        id: params.id,
        title: params.title,
        string: params.string,
        context: params.context,
        limit: params.limit,
        count: params.count
      });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  });

  pi.registerTool({
    name: "bear_attachments_list",
    label: "Bear List Attachments",
    description: "List attachments on a note.",
    promptSnippet: "List Bear note attachments",
    parameters: Type.Object({
      noteId: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or noteId." }))
    }),
    async execute(_id, params) {
      const results = await bearcli.attachmentsList({ noteId: params.noteId, title: params.title });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  });

  pi.registerTool({
    name: "bear_attachments_add",
    label: "Bear Add Attachment",
    description: "Add a file as an attachment to a note.",
    promptSnippet: "Add attachment to Bear note",
    parameters: Type.Object({
      noteId: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or noteId." })),
      filename: Type.String({ description: "Filename for the attachment (e.g. 'photo.jpg')." }),
      filePath: Type.String({ description: "Local path to the file to attach." }),
      noUpdateModified: Type.Optional(Type.Boolean({ description: "Preserve the note's modification date." }))
    }),
    async execute(_id, params) {
      await bearcli.attachmentsAdd(params.noteId, params.title, params.filename, params.filePath, params.noUpdateModified);
      const target = params.noteId ?? params.title ?? 'note';
      return {
        content: [{ type: "text", text: `Attachment ${params.filename} added to ${target}.` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_attachments_delete",
    label: "Bear Delete Attachment",
    description: "Delete an attachment from a note.",
    promptSnippet: "Delete Bear note attachment",
    parameters: Type.Object({
      noteId: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or noteId." })),
      filename: Type.String({ description: "Filename of the attachment to delete." }),
      noUpdateModified: Type.Optional(Type.Boolean({ description: "Preserve the note's modification date." }))
    }),
    async execute(_id, params) {
      await bearcli.attachmentsDelete(params.noteId, params.title, params.filename, params.noUpdateModified);
      const target = params.noteId ?? params.title ?? 'note';
      return {
        content: [{ type: "text", text: `Attachment ${params.filename} deleted from ${target}.` }],
      };
    }
  });

  pi.registerTool({
    name: "bear_attachments_save",
    label: "Bear Save Attachment",
    description: "Retrieve an attachment's content as base64-encoded data.",
    promptSnippet: "Save Bear note attachment",
    parameters: Type.Object({
      noteId: Type.Optional(Type.String({ description: "Note ID. Use this or title." })),
      title: Type.Optional(Type.String({ description: "Case-insensitive note title. Use this or noteId." })),
      filename: Type.String({ description: "Filename of the attachment to retrieve." })
    }),
    async execute(_id, params) {
      const result = await bearcli.attachmentsSave({ noteId: params.noteId, title: params.title, filename: params.filename });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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