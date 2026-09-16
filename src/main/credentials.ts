import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const execFileAsync = promisify(execFile);

interface ClaudeOAuth {
  accessToken?: string;
  expiresAt?: number; // ms epoch
  subscriptionType?: string;
  rateLimitTier?: string;
}

export type CredentialError = 'not_found' | 'expired' | 'unreadable';

export interface CredentialResult {
  token: string | null;
  error: CredentialError | null;
}

/**
 * Claude Code stores its OAuth token differently per OS: the macOS app keeps
 * it in the Keychain (no plaintext file on disk), while Linux/Windows write
 * ~/.claude/.credentials.json directly.
 */
export async function getAccessToken(): Promise<CredentialResult> {
  const oauth = process.platform === 'darwin' ? await readFromKeychain() : await readFromFile();
  if (!oauth) {
    return { token: null, error: 'not_found' };
  }
  if (oauth.expiresAt && oauth.expiresAt < Date.now()) {
    return { token: null, error: 'expired' };
  }
  if (!oauth.accessToken) {
    return { token: null, error: 'unreadable' };
  }
  return { token: oauth.accessToken, error: null };
}

async function readFromKeychain(): Promise<ClaudeOAuth | null> {
  try {
    const { stdout } = await execFileAsync('security', [
      'find-generic-password',
      '-s',
      'Claude Code-credentials',
      '-w',
    ]);
    const parsed = JSON.parse(stdout);
    return parsed?.claudeAiOauth ?? null;
  } catch {
    return null;
  }
}

async function readFromFile(): Promise<ClaudeOAuth | null> {
  try {
    const path = join(homedir(), '.claude', '.credentials.json');
    const raw = await readFile(path, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed?.claudeAiOauth ?? null;
  } catch {
    return null;
  }
}

const FALLBACK_USER_AGENT = 'claude-code/2.1.204';
const VERSION_PATTERN = /^(\d+\.\d+\.\d+)/;

/**
 * The usage endpoint 429s clients whose User-Agent doesn't look like an
 * official Claude Code build, so we mirror whatever CLI is on PATH (if any).
 */
export async function getUserAgent(): Promise<string> {
  try {
    // On Windows, npm-installed CLIs like `claude` resolve to a .cmd shim,
    // which execFile can only run via the shell.
    const { stdout } = await execFileAsync('claude', ['--version'], {
      timeout: 5000,
      shell: process.platform === 'win32',
    });
    const match = VERSION_PATTERN.exec(stdout.trim());
    return match ? `claude-code/${match[1]}` : FALLBACK_USER_AGENT;
  } catch {
    return FALLBACK_USER_AGENT;
  }
}
