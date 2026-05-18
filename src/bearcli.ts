import { execFile } from 'node:child_process';
import { statSync } from 'node:fs';

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

  private async execCmd(args: string[], stdin?: string): Promise<{ stdout: string, stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = execFile(this.binPath, args, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          // If bearcli returns JSON errors, it prints to stdout with --format json
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

  async open(id: string): Promise<void> {
    await this.execCmd(['open', id]);
  }
}

// Singleton instance
export const bearcli = new BearCLI();