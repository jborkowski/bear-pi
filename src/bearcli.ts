import { execFile } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

export class BearCLIError extends Error {
  constructor(message: string, public code: number, public stdout: string, public stderr: string) {
    super(message);
    this.name = 'BearCLIError';
  }
}

export class BearCLI {
  private binPath: string;

  constructor() {
    this.binPath = this.detectBearCLI();
  }

  private detectBearCLI(): string {
    const defaultPath = '/Applications/Bear.app/Contents/MacOS/bearcli';
    try {
      if (statSync(defaultPath).isFile()) {
        return defaultPath;
      }
    } catch {
      // Not at default path
    }
    
    // Fallback: Check if it's in PATH
    try {
      const { stdout } = require('node:child_process').execSync('which bearcli', { encoding: 'utf8' });
      if (stdout.trim()) {
        return stdout.trim();
      }
    } catch {
      // not in path
    }

    throw new Error('Bear 2.8+ with BearCLI is required on macOS. Could not find /Applications/Bear.app/Contents/MacOS/bearcli or bearcli in PATH.');
  }

  private async execCmd(args: string[], stdin?: string | Buffer): Promise<{ stdout: string, stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = execFile(this.binPath, args, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          let errMsg = stderr || error.message;
          if (stdout.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(stdout);
              if (parsed.error) errMsg = parsed.error.message;
            } catch {
               // Ignore
            }
          }
          reject(new BearCLIError(`BearCLI command failed: ${errMsg}`, (error as any).code || 1, stdout, stderr));
          return;
        }
        resolve({ stdout, stderr });
      });

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });
  }

  private parseJson(output: string): any {
    if (!output.trim()) return null;
    try {
      return JSON.parse(output);
    } catch (e) {
      throw new Error(`Failed to parse BearCLI JSON output: ${output}`);
    }
  }

  async search(query: string, limit: number = 20): Promise<any[]> {
    const { stdout } = await this.execCmd(['search', query, '--format', 'json', '--limit', limit.toString(), '--fields', 'id,title,tags,modified']);
    return this.parseJson(stdout) || [];
  }

  async list(limit: number = 20): Promise<any[]> {
    const { stdout } = await this.execCmd(['list', '--format', 'json', '--limit', limit.toString(), '--fields', 'id,title,tags,modified']);
    return this.parseJson(stdout) || [];
  }

  async read(id: string): Promise<any> {
    const { stdout } = await this.execCmd(['show', id, '--format', 'json', '--fields', 'all,content']);
    return this.parseJson(stdout);
  }

  async create(title: string | undefined, content: string, tags?: string): Promise<any> {
    const args = ['create'];
    if (title) {
      args.push(title);
    }
    args.push('--format', 'json');
    if (tags) {
      args.push('--tags', tags);
    }
    const { stdout } = await this.execCmd(args, content);
    return this.parseJson(stdout);
  }

  async update(id: string, content: string): Promise<void> {
    await this.execCmd(['overwrite', id], content);
  }

  async append(params: { id?: string; title?: string; content: string; position?: 'beginning' | 'end'; noUpdateModified?: boolean }): Promise<void> {
    const args = ['append'];
    if (params.id) args.push(params.id);
    if (params.title) args.push('--title', params.title);
    if (params.position) args.push('--position', params.position);
    if (params.noUpdateModified) args.push('--no-update-modified');
    await this.execCmd(args, params.content);
  }

  async edit(params: { id?: string; title?: string; find: string; replace?: string; insertAfter?: string; insertBefore?: string; all?: boolean; ignoreCase?: boolean; word?: boolean; noUpdateModified?: boolean; force?: boolean }): Promise<void> {
    const args = ['edit'];
    if (params.id) args.push(params.id);
    if (params.title) args.push('--title', params.title);
    args.push('--find', params.find);
    if (params.replace) args.push('--replace', params.replace);
    if (params.insertAfter) args.push('--insert-after', params.insertAfter);
    if (params.insertBefore) args.push('--insert-before', params.insertBefore);
    if (params.all) args.push('--all');
    if (params.ignoreCase) args.push('--ignore-case');
    if (params.word) args.push('--word');
    if (params.noUpdateModified) args.push('--no-update-modified');
    if (params.force) args.push('--force');
    await this.execCmd(args);
  }

  async tagsList(params?: { noteId?: string; title?: string; count?: boolean }): Promise<any[]> {
    const args = ['tags', 'list', '--format', 'json'];
    if (params?.noteId) args.push(params.noteId);
    if (params?.title) args.push('--title', params.title);
    if (params?.count) args.push('--count');
    const { stdout } = await this.execCmd(args);
    return this.parseJson(stdout) || [];
  }

  async tagsAdd(noteId: string | undefined, title: string | undefined, tags: string[]): Promise<void> {
    const args = ['tags', 'add'];
    if (noteId) args.push(noteId);
    if (title) args.push('--title', title);
    args.push(...tags);
    await this.execCmd(args);
  }

  async tagsRemove(noteId: string | undefined, title: string | undefined, tags: string[]): Promise<void> {
    const args = ['tags', 'remove'];
    if (noteId) args.push(noteId);
    if (title) args.push('--title', title);
    args.push(...tags);
    await this.execCmd(args);
  }

  async tagsRename(oldTag: string, newTag: string, force?: boolean): Promise<void> {
    const args = ['tags', 'rename', oldTag, newTag];
    if (force) args.push('--force');
    await this.execCmd(args);
  }

  async tagsDelete(tag: string): Promise<void> {
    await this.execCmd(['tags', 'delete', tag]);
  }

  async trash(id: string | undefined, title: string | undefined): Promise<void> {
    const args = ['trash'];
    if (id) args.push(id);
    if (title) args.push('--title', title);
    await this.execCmd(args);
  }

  async archive(id: string | undefined, title: string | undefined): Promise<void> {
    const args = ['archive'];
    if (id) args.push(id);
    if (title) args.push('--title', title);
    await this.execCmd(args);
  }

  async restore(id: string | undefined, title: string | undefined): Promise<void> {
    const args = ['restore'];
    if (id) args.push(id);
    if (title) args.push('--title', title);
    await this.execCmd(args);
  }

  async searchIn(params: { id?: string; title?: string; string: string; context?: number; limit?: number; count?: boolean }): Promise<any> {
    const args = ['search-in', '--format', 'json'];
    if (params.id) args.push(params.id);
    if (params.title) args.push('--title', params.title);
    args.push('--string', params.string);
    if (params.context) args.push('--context', params.context.toString());
    if (params.limit) args.push('--limit', params.limit.toString());
    if (params.count) args.push('--count');
    const { stdout } = await this.execCmd(args);
    return this.parseJson(stdout) || [];
  }

  async attachmentsList(params?: { noteId?: string; title?: string }): Promise<any[]> {
    const args = ['attachments', 'list', '--format', 'json'];
    if (params?.noteId) args.push(params.noteId);
    if (params?.title) args.push('--title', params.title);
    const { stdout } = await this.execCmd(args);
    return this.parseJson(stdout) || [];
  }

  async attachmentsAdd(noteId: string | undefined, title: string | undefined, filename: string, filePath: string, noUpdateModified?: boolean): Promise<void> {
    const args = ['attachments', 'add'];
    if (noteId) args.push(noteId);
    if (title) args.push('--title', title);
    args.push('--filename', filename);
    if (noUpdateModified) args.push('--no-update-modified');
    const data = readFileSync(filePath);
    await this.execCmd(args, data);
  }

  async attachmentsDelete(noteId: string | undefined, title: string | undefined, filename: string, noUpdateModified?: boolean): Promise<void> {
    const args = ['attachments', 'delete'];
    if (noteId) args.push(noteId);
    if (title) args.push('--title', title);
    args.push('--filename', filename);
    if (noUpdateModified) args.push('--no-update-modified');
    await this.execCmd(args);
  }

  async attachmentsSave(params: { noteId?: string; title?: string; filename: string }): Promise<{ filename: string; size: number; base64: string }> {
    const args = ['attachments', 'save', '--format', 'json', '--filename', params.filename];
    if (params.noteId) args.push(params.noteId);
    if (params.title) args.push('--title', params.title);
    const { stdout } = await this.execCmd(args);
    return this.parseJson(stdout);
  }

  async open(id: string): Promise<void> {
    await this.execCmd(['open', id]);
  }
}

// Singleton instance
export const bearcli = new BearCLI();