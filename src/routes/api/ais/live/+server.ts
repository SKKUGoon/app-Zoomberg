import type { RequestHandler } from '@sveltejs/kit';
import { aisStreamManager } from '$lib/server/ais/aisStreamManager';
import type { AisLivePayload } from '$lib/types/news';

// TODO(ais): keep SSE endpoint in place for future re-enable once coverage improves: https://aisstream.io/coverage

const formatSse = (payload: AisLivePayload) => `data: ${JSON.stringify(payload)}\n\n`;

const filterPayload = (payload: AisLivePayload, vesselClass: string | null): AisLivePayload => {
	if (!vesselClass || vesselClass === 'all') {
		return payload;
	}

	if (vesselClass !== 'beam_40_plus' && vesselClass !== 'military') {
		return payload;
	}

	return {
		...payload,
		vessels: payload.vessels.filter((vessel) => vessel.classTags.includes(vesselClass))
	};
};

export const GET: RequestHandler = async ({ request, url }) => {
	const vesselClass = url.searchParams.get('class');

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();
			let closed = false;

			const safeEnqueue = (chunk: string) => {
				if (closed) {
					return;
				}
				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					closed = true;
				}
			};

			const send = (payload: AisLivePayload) => {
				const filtered = filterPayload(payload, vesselClass);
				safeEnqueue(formatSse(filtered));
			};

			const unsubscribe = aisStreamManager.subscribe(send);
			const keepaliveTimer = setInterval(() => {
				safeEnqueue(': keepalive\n\n');
			}, 20_000);

			const cleanup = () => {
				if (closed) {
					return;
				}
				closed = true;
				clearInterval(keepaliveTimer);
				unsubscribe();
				request.signal.removeEventListener('abort', abortHandler);
				try {
					controller.close();
				} catch {
					// stream may already be closed
				}
			};

			const abortHandler = () => {
				cleanup();
			};

			request.signal.addEventListener('abort', abortHandler);
		},
		cancel() {
			// no-op: abort handler performs cleanup
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive'
		}
	});
};
