import fs from 'fs';
import path from 'path';
import http from 'http';
import { createServer } from '../../src/api/server';
import { initDatabase, closeDb, getDb } from '../../src/db/database';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_linkstash.db');

let serverInstance: http.Server | null = null;
let currentPort = 3999;

export function getBaseUrl(): string {
  return `http://localhost:${currentPort}`;
}

export async function startTestServer(): Promise<void> {
  // Set test database environment path
  process.env.DB_PATH = TEST_DB_PATH;

  // Clean prior test database if present
  await closeDb();
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch {
      // Ignore if file locked
    }
  }

  // Initialize DB schema and seed default categories
  await initDatabase();

  const app = createServer();
  await new Promise<void>((resolve, reject) => {
    // Listen on dynamic free port (port 0)
    serverInstance = app.listen(0, () => {
      const addr = serverInstance!.address();
      if (addr && typeof addr === 'object') {
        currentPort = addr.port;
      }
      resolve();
    });
    serverInstance.on('error', reject);
  });
}

export async function stopTestServer(): Promise<void> {
  if (serverInstance) {
    await new Promise<void>((resolve) => {
      serverInstance!.close(() => resolve());
    });
    serverInstance = null;
  }
  await closeDb();

  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch {
      // Ignore cleanup error
    }
  }
}

export async function resetTestDatabase(): Promise<void> {
  const db = await getDb();
  await db.exec('DELETE FROM links;');
  await db.exec('DELETE FROM categories;');
  
  // Re-seed default categories
  await closeDb();
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch {}
  }
  await initDatabase();
}

export async function apiRequest(
  path: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; data: any; headers: Headers }> {
  const url = `${getBaseUrl()}${path}`;
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const fetchOpts: RequestInit = {
    method,
    headers
  };

  if (options.body !== undefined) {
    fetchOpts.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOpts);
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    data,
    headers: res.headers
  };
}
