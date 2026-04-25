import * as Sentry from '@sentry/nextjs'

type LogLevel = 'info' | 'warn' | 'error'

interface LogPayload {
  event: string
  [key: string]: unknown
}

function log(level: LogLevel, payload: LogPayload) {
  const entry = { ts: new Date().toISOString(), level, ...payload }

  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }

  const sentryLevel = level === 'warn' ? 'warning' : level
  Sentry.addBreadcrumb({
    category: payload.event,
    message: payload.event,
    level: sentryLevel as 'info' | 'warning' | 'error',
    data: payload,
  })
}

export const logger = {
  info:  (payload: LogPayload) => log('info',  payload),
  warn:  (payload: LogPayload) => log('warn',  payload),
  error: (payload: LogPayload & { err?: unknown }) => {
    const { err, ...rest } = payload
    log('error', rest)
    if (err instanceof Error) Sentry.captureException(err, { extra: rest })
  },
}
