import { env } from '$env/dynamic/private';
import type {
	AisConnectionStatus,
	AisFreshness,
	AisLivePayload,
	AisLiveVessel,
	AisVesselClass
} from '$lib/types/news';

type AisEnvelope = {
	MessageType?: string;
	Message?: Record<string, unknown>;
	Metadata?: Record<string, unknown>;
	MetaData?: Record<string, unknown>;
	error?: string;
};

type VesselState = {
	mmsi: string;
	shipName: string | null;
	shipType: number | null;
	beamM: number | null;
	latitude: number | null;
	longitude: number | null;
	sog: number | null;
	cog: number | null;
	trueHeading: number | null;
	messageType: string;
	lastSeenAt: string;
	classTags: AisVesselClass[];
};

type SnapshotListener = (snapshot: AisLivePayload) => void;

const STREAM_URL = 'wss://stream.aisstream.io/v0/stream';
const BROADCAST_INTERVAL_MS = 1000;
const LIVE_TTL_MS = 5 * 60 * 1000;
const STALE_TTL_MS = 30 * 60 * 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;
const DEFAULT_BOUNDING_BOXES = [[[-90, -180], [90, 180]]];

const POSITION_MESSAGE_TYPES = new Set([
	'PositionReport',
	'StandardClassBPositionReport',
	'ExtendedClassBPositionReport',
	'LongRangeAisBroadcastMessage'
]);

const STATIC_MESSAGE_TYPES = new Set(['ShipStaticData', 'StaticDataReport']);

const FILTER_MESSAGE_TYPES = [
	'PositionReport',
	'StandardClassBPositionReport',
	'ExtendedClassBPositionReport',
	'LongRangeAisBroadcastMessage',
	'ShipStaticData',
	'StaticDataReport'
];


const toNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === 'string') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return null;
};

const toString = (value: unknown): string | null => {
	if (typeof value === 'string' && value.trim().length > 0) {
		return value.trim();
	}
	return null;
};

const parseBoundingBoxes = (raw: string | undefined): number[][][] => {
	if (!raw) {
		return DEFAULT_BOUNDING_BOXES;
	}

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length === 0) {
			return DEFAULT_BOUNDING_BOXES;
		}
		return parsed;
	} catch {
		return DEFAULT_BOUNDING_BOXES;
	}
};

const jitter = (base: number) => Math.round(base * (0.85 + Math.random() * 0.3));

const describeSocketError = (event: Event): string => {
	const details = event as Event & {
		statusCode?: number;
		response?: string;
		message?: string;
		error?: { message?: string };
	};

	if (typeof details.statusCode === 'number') {
		const response = typeof details.response === 'string' ? details.response : '';
		return response
			? `AIS socket error ${details.statusCode}: ${response}`
			: `AIS socket error ${details.statusCode}`;
	}

	if (typeof details.message === 'string' && details.message.length > 0) {
		return `AIS socket error: ${details.message}`;
	}

	if (details.error?.message) {
		return `AIS socket error: ${details.error.message}`;
	}

	return 'AIS stream socket error';
};

class AisStreamManager {
	private started = false;
	private socket: WebSocket | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private cleanupTimer: ReturnType<typeof setInterval> | null = null;
	private reconnectAttempts = 0;
	private status: AisConnectionStatus = 'disconnected';
	private lastError: string | undefined;
	private listeners = new Set<SnapshotListener>();
	private vessels = new Map<string, VesselState>();
	private broadcastTimer: ReturnType<typeof setTimeout> | null = null;

	start() {
		if (this.started) {
			return;
		}
		this.started = true;
		this.connect();
		this.cleanupTimer = setInterval(() => this.pruneStaleVessels(), 60_000);
	}

	subscribe(listener: SnapshotListener) {
		this.start();
		this.listeners.add(listener);
		listener(this.snapshot());
		return () => {
			this.listeners.delete(listener);
		};
	}

	private connect() {
		const apiKey = env.AIS_STREAM_API_KEY;
		if (!apiKey) {
			this.setStatus('disconnected', 'Missing AIS_STREAM_API_KEY');
			return;
		}

		if (typeof WebSocket === 'undefined') {
			this.setStatus('disconnected', 'WebSocket is unavailable in server runtime');
			return;
		}

		this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
		const socket = new WebSocket(STREAM_URL);
		this.socket = socket;

		socket.onopen = () => {
			if (this.socket !== socket) {
				return;
			}
			this.reconnectAttempts = 0;
			this.sendSubscription(socket, apiKey);
			this.setStatus('connected');
		};

		socket.onmessage = (event) => {
			if (this.socket !== socket) {
				return;
			}
			void this.handleMessage(event.data);
		};

		socket.onerror = (event) => {
			if (this.socket !== socket) {
				return;
			}
			this.setStatus('reconnecting', describeSocketError(event));
		};

		socket.onclose = () => {
			if (this.socket !== socket) {
				return;
			}
			this.socket = null;
			this.scheduleReconnect();
		};
	}

	private sendSubscription(socket: WebSocket, apiKey: string) {
		const message = {
			APIKey: apiKey,
			Apikey: apiKey,
			BoundingBoxes: parseBoundingBoxes(env.AIS_STREAM_BOUNDING_BOXES),
			FilterMessageTypes: FILTER_MESSAGE_TYPES
		};
		socket.send(JSON.stringify(message));
	}

	private scheduleReconnect() {
		if (this.reconnectTimer) {
			return;
		}

		this.reconnectAttempts += 1;
		const base = Math.min(
			MAX_RECONNECT_DELAY_MS,
			BASE_RECONNECT_DELAY_MS * 2 ** Math.max(0, this.reconnectAttempts - 1)
		);
		const delay = jitter(base);
		this.setStatus('reconnecting', this.lastError);
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect();
		}, delay);
	}

	private async handleMessage(rawData: unknown) {
		const payload = await this.parseEnvelope(rawData);
		if (!payload) {
			return;
		}

		if (payload.error) {
			this.lastError = payload.error;
			this.queueBroadcast();
			return;
		}

		const messageType = toString(payload.MessageType);
		if (!messageType) {
			return;
		}

		const messageContainer = payload.Message ?? {};
		const message = (messageContainer[messageType] ?? messageContainer) as Record<string, unknown>;
		const metadata = (payload.Metadata ?? payload.MetaData ?? {}) as Record<string, unknown>;

		const mmsi = this.extractMmsi(message, metadata);
		if (!mmsi) {
			return;
		}

		const existing = this.vessels.get(mmsi) ?? {
			mmsi,
			shipName: null,
			shipType: null,
			beamM: null,
			latitude: null,
			longitude: null,
			sog: null,
			cog: null,
			trueHeading: null,
			messageType,
			lastSeenAt: new Date().toISOString(),
			classTags: []
		};

		if (STATIC_MESSAGE_TYPES.has(messageType)) {
			this.applyStaticUpdate(existing, message, metadata);
		}

		if (POSITION_MESSAGE_TYPES.has(messageType)) {
			this.applyDynamicUpdate(existing, message, metadata);
		}

		existing.messageType = messageType;
		existing.lastSeenAt = this.extractTimestamp(metadata) ?? new Date().toISOString();
		existing.classTags = this.classify(existing);
		this.vessels.set(mmsi, existing);
		this.queueBroadcast();
	}

	private async parseEnvelope(rawData: unknown): Promise<AisEnvelope | null> {
		if (
			rawData &&
			typeof rawData === 'object' &&
			!ArrayBuffer.isView(rawData) &&
			!(rawData instanceof ArrayBuffer) &&
			!(typeof Blob !== 'undefined' && rawData instanceof Blob)
		) {
			return rawData as AisEnvelope;
		}

		const text = await this.rawDataToText(rawData);
		if (!text) {
			return null;
		}

		try {
			return JSON.parse(text) as AisEnvelope;
		} catch {
			return null;
		}
	}

	private async rawDataToText(rawData: unknown): Promise<string | null> {
		if (typeof rawData === 'string') {
			return rawData;
		}

		if (rawData instanceof ArrayBuffer) {
			return new TextDecoder().decode(new Uint8Array(rawData));
		}

		if (ArrayBuffer.isView(rawData)) {
			return new TextDecoder().decode(
				new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength)
			);
		}

		if (typeof Blob !== 'undefined' && rawData instanceof Blob) {
			try {
				return await rawData.text();
			} catch {
				return null;
			}
		}

		return null;
	}

	private extractMmsi(
		message: Record<string, unknown>,
		metadata: Record<string, unknown>
	): string | null {
		const value =
			toNumber(message.UserID) ??
			toNumber(message.userId) ??
			toNumber(metadata.MMSI) ??
			toNumber(metadata.mmsi) ??
			toNumber(metadata.UserID);

		if (value === null) {
			return null;
		}

		return String(Math.trunc(value));
	}

	private applyStaticUpdate(
		state: VesselState,
		message: Record<string, unknown>,
		metadata: Record<string, unknown>
	) {
		const reportA = message.ReportA as Record<string, unknown> | undefined;
		const reportB = message.ReportB as Record<string, unknown> | undefined;

		const name =
			toString(message.Name) ??
			toString(message.name) ??
			toString(metadata.ShipName) ??
			(reportA ? toString(reportA.Name) : null);
		if (name !== null) {
			state.shipName = name;
		}

		const shipType = toNumber(message.Type) ?? toNumber(message.ShipType) ?? (reportB ? toNumber(reportB.ShipType) : null);
		if (shipType !== null) {
			state.shipType = shipType;
		}

		const dimensionRaw = (message.Dimension ?? reportB?.Dimension) as
			| Record<string, unknown>
			| undefined;

		if (dimensionRaw) {
			const c = toNumber(dimensionRaw.C);
			const d = toNumber(dimensionRaw.D);
			if (c !== null && d !== null) {
				state.beamM = c + d;
			}
		}
	}

	private applyDynamicUpdate(
		state: VesselState,
		message: Record<string, unknown>,
		metadata: Record<string, unknown>
	) {
		const dynamicName = toString(message.Name) ?? toString(metadata.ShipName);
		if (dynamicName !== null) {
			state.shipName = dynamicName;
		}

		const dynamicShipType = toNumber(message.Type) ?? toNumber(message.ShipType);
		if (dynamicShipType !== null) {
			state.shipType = dynamicShipType;
		}

		const dynamicDimension = message.Dimension as Record<string, unknown> | undefined;
		if (dynamicDimension) {
			const c = toNumber(dynamicDimension.C);
			const d = toNumber(dynamicDimension.D);
			if (c !== null && d !== null) {
				state.beamM = c + d;
			}
		}

		const latitude =
			toNumber(message.Latitude) ??
			toNumber(message.latitude) ??
			toNumber(metadata.Latitude) ??
			toNumber(metadata.latitude);
		const longitude =
			toNumber(message.Longitude) ??
			toNumber(message.longitude) ??
			toNumber(metadata.Longitude) ??
			toNumber(metadata.longitude);

		if (latitude !== null && longitude !== null) {
			state.latitude = latitude;
			state.longitude = longitude;
		}

		const sog = toNumber(message.Sog) ?? toNumber(message.SOG);
		if (sog !== null) {
			state.sog = sog;
		}

		const cog = toNumber(message.Cog) ?? toNumber(message.COG);
		if (cog !== null) {
			state.cog = cog;
		}

		const heading = toNumber(message.TrueHeading) ?? toNumber(message.trueHeading);
		if (heading !== null) {
			state.trueHeading = heading;
		}
	}

	private extractTimestamp(metadata: Record<string, unknown>): string | null {
		const timeValue = toString(metadata.time_utc) ?? toString(metadata.TimeUTC) ?? toString(metadata.Timestamp);
		if (!timeValue) {
			return null;
		}

		const date = new Date(timeValue);
		if (Number.isNaN(date.getTime())) {
			return null;
		}
		return date.toISOString();
	}

	private classify(state: VesselState): AisVesselClass[] {
		const tags: AisVesselClass[] = [];
		const shipName = (state.shipName ?? '').toUpperCase();
		const militaryNameHint = /\b(NAVY|NAVAL|WARSHIP|COAST\s*GUARD|CGC|FRIGATE|DESTROYER)\b/.test(shipName);

		if (state.beamM !== null && state.beamM >= 40) {
			tags.push('beam_40_plus');
		}

		if (state.shipType === 35 || militaryNameHint) {
			tags.push('military');
		}

		return tags;
	}

	private queueBroadcast() {
		if (this.broadcastTimer) {
			return;
		}
		this.broadcastTimer = setTimeout(() => {
			this.broadcastTimer = null;
			this.broadcast();
		}, BROADCAST_INTERVAL_MS);
	}

	private broadcast() {
		const snapshot = this.snapshot();
		for (const listener of this.listeners) {
			listener(snapshot);
		}
	}

	private snapshot(): AisLivePayload {
		const vessels: AisLiveVessel[] = [];
		const now = Date.now();
		for (const vessel of this.vessels.values()) {
			if (vessel.latitude === null || vessel.longitude === null) {
				continue;
			}

			const seenAtMs = new Date(vessel.lastSeenAt).getTime();
			if (Number.isNaN(seenAtMs)) {
				continue;
			}
			const ageMs = now - seenAtMs;
			if (ageMs > STALE_TTL_MS) {
				continue;
			}

			const freshness: AisFreshness = ageMs <= LIVE_TTL_MS ? 'live' : 'stale';

			vessels.push({
				mmsi: vessel.mmsi,
				shipName: vessel.shipName,
				shipType: vessel.shipType,
				beamM: vessel.beamM,
				latitude: vessel.latitude,
				longitude: vessel.longitude,
				sog: vessel.sog,
				cog: vessel.cog,
				trueHeading: vessel.trueHeading,
				messageType: vessel.messageType,
				lastSeenAt: vessel.lastSeenAt,
				freshness,
				classTags: [...vessel.classTags]
			});
		}

		vessels.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));

		return {
			status: this.status,
			updatedAt: new Date().toISOString(),
			vessels,
			error: this.lastError
		};
	}

	private setStatus(status: AisConnectionStatus, error?: string) {
		this.status = status;
		this.lastError = error;
		this.queueBroadcast();
	}

	private pruneStaleVessels() {
		const now = Date.now();
		let removed = false;
		for (const [mmsi, vessel] of this.vessels.entries()) {
			const seenAt = new Date(vessel.lastSeenAt).getTime();
			if (Number.isNaN(seenAt) || now - seenAt <= STALE_TTL_MS) {
				continue;
			}
			this.vessels.delete(mmsi);
			removed = true;
		}
		if (removed) {
			this.queueBroadcast();
		}
	}
}

export const aisStreamManager = new AisStreamManager();
