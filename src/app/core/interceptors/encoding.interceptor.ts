import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const UTF8_DOUBLE_ENCODED_REGEX = /[\u00C0-\u00DF][\u0080-\u00BF]|[\u00E0-\u00EF][\u0080-\u00BF]{2}|[\u00F0-\u00F7][\u0080-\u00BF]{3}/g;

function decodeMatch(match: string): string {
  try {
    const bytes = new Uint8Array(match.split('').map((c) => c.charCodeAt(0)));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return match;
  }
}

function decodeIfNeeded(str: string): string {
  if (UTF8_DOUBLE_ENCODED_REGEX.test(str)) {
    // Reset regex lastIndex because of /g
    UTF8_DOUBLE_ENCODED_REGEX.lastIndex = 0;
    return str.replace(UTF8_DOUBLE_ENCODED_REGEX, decodeMatch);
  }
  return str;
}

function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'string') {
    return decodeIfNeeded(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item: unknown) => sanitizeObject(item));
  }
  if (typeof obj === 'object') {
    // Avoid processing binary blobs, files or other non-plain objects
    const proto = Object.getPrototypeOf(obj);
    if (proto !== null && proto !== Object.prototype && proto !== Array.prototype) {
      return obj;
    }
    const newObj: Record<string, unknown> = {};
    const recordObj = obj as Record<string, unknown>;
    for (const key of Object.keys(recordObj)) {
      newObj[key] = sanitizeObject(recordObj[key]);
    }
    return newObj;
  }
  return obj;
}

function esUrlDeApiPropia(url: string): boolean {
  try {
    const requestUrl = new URL(url, window.location.origin);
    const apiUrl = new URL(environment.apiUrl, window.location.origin);

    const esDominioApi = requestUrl.origin === apiUrl.origin;
    const esDominioInventario = requestUrl.origin === 'https://18-119-187-167.sslip.io';

    return esDominioApi || esDominioInventario;
  } catch {
    return url.startsWith(environment.apiUrl) || url.startsWith('https://18-119-187-167.sslip.io');
  }
}

export const encodingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!esUrlDeApiPropia(req.url)) {
    return next(req);
  }

  return next(req).pipe(
    map((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse && event.body) {
        const sanitizedBody = sanitizeObject(event.body);
        return event.clone({ body: sanitizedBody });
      }
      return event;
    })
  );
};
