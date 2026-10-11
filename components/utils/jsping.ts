import { parseServerAddress } from './urlUtils';

async function ping(url: string, multiplier = 1, signal?: AbortSignal): Promise<number> {
    const target = parseServerAddress(url);

    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 5000);
    const start = performance.now();

    try {
        await fetch(target.href, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
            credentials: 'omit',
            signal: controller.signal,
        });
        return (performance.now() - start) * multiplier;
    } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
    }
}

export default ping;
