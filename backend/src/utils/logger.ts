/* Minimal structured logger. Never pass tokens, passwords or keys to it. */
type Level = 'debug' | 'info' | 'warn' | 'error';

const quiet = process.env.NODE_ENV === 'test';

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  if (quiet && level !== 'error') return;
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...meta });
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') write('debug', message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};

/** Turns an unknown error into loggable fields without leaking request data. */
export function errorFields(err: unknown) {
  if (err instanceof Error) return { error: err.message, stack: err.stack };
  return { error: String(err) };
}
