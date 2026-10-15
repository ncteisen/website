import originalWords from './words.json';

export const packs = {
	classic: { name: 'Classic', detail: 'The original word list.', words: originalWords.classic },
	signals: { name: 'Technology', detail: 'Computing, science, and technology words.', words: 'AGENT ALIAS ALGORITHM ANALOG ANCHOR ARCHIVE ARRAY ATLAS ATOM BACKUP BANDWIDTH BEACON BIAS BINARY BIT BOT BRANCH BRIDGE BUFFER BUG BYTE CACHE CAMERA CANVAS CAPSULE CHAIN CHANNEL CHIP CIRCUIT CLOUD CLONE CODE COMPASS COMPILE CONSOLE CONTEXT CONTROL CORE CRASH CRAWLER CRYPTO CRYSTAL CURSOR DATA DEBUG DECODE DELTA DEVICE DIAL DIGITAL DISK DOCK DOMAIN DRIFT DRONE ECHO EDGE ELECTRIC EMBEDDING ENGINE ERROR ESCAPE ETHER FABRIC FEEDBACK FIELD FILTER FIREWALL FLASH FLOW FOLDER FORK FRAME FREQUENCY GATE GHOST GLASS GLITCH GRAPH GRID GUARD HALO HASH HIVE HORIZON HUB IMAGE INDEX INFERENCE INPUT INSTANCE INTELLIGENCE INTERFACE KEY KERNEL LAB LASER LATENCY LAYER LENS LIGHT LINK LOGIC LOOP MACHINE MATRIX MEMORY MESH MIRROR MODEL MODULE NETWORK NEURAL NODE NOISE ORBIT OUTPUT PACKET PARALLEL PATCH PATTERN PHANTOM PHASE PIXEL PLASMA PLATFORM PLUG PORT PORTAL POWER PRIME PRISM PROBE PROCESS PROMPT PROTOCOL PROXY PULSE QUANTUM QUERY QUEUE RADAR RADIO RAY REACTOR REBOOT RELAY RENDER REPLICA RESET ROBOT ROOT ROUTER SATELLITE SCALE SCAN SCREEN SCRIPT SEARCH SEED SENSOR SERVER SHADOW SHELL SHIFT SIGNAL SILICON SOCKET SOURCE SPARK SPECTRUM SPHERE SPIDER STACK STATE STATIC STREAM STRING SWITCH SYMBOL SYNC SYNTHETIC SYSTEM TARGET TASK TENSOR TERMINAL THREAD TOKEN TOOL TRACE TRANSMIT TRIGGER TUNNEL VECTOR VIRTUAL VISION VOICE WAVE WEB WINDOW WIRE ZERO'.split(' ') },
	nouns: { name: 'Nouns', detail: 'A larger list of common nouns.', words: originalWords.nouns },
	movies: { name: 'Movies', detail: 'Film titles.', words: originalWords.movies },
	adult: { name: 'Adult · 18+', detail: 'Explicit words.', words: originalWords.adult },
	all: { name: 'Nouns + adult · 18+', detail: 'Common nouns and explicit words.', words: originalWords.all },
};

export type Pack = keyof typeof packs;
export type Team = 'red' | 'blue';
export type Identity = Team | 'neutral' | 'assassin';
export interface Game {
	seed: string;
	pack: Pack;
	cards: { word: string; identity: Identity; selected: boolean }[];
}
export interface SavedGame { seed: string; pack: Pack; selected: number[] }

export const otherTeam = (team: Team): Team => team === 'red' ? 'blue' : 'red';
export const normalizeSeed = (seed: string) => seed.trim().toLowerCase().slice(0, 48);
export const isPack = (value: unknown): value is Pack => typeof value === 'string' && Object.hasOwn(packs, value);
export const remaining = (game: Game, team: Team) => game.cards.filter(card => card.identity === team && !card.selected).length;

// A local PRNG keeps board codes stable without replacing Math.random globally.
function randomFor(seed: string) {
	let hash = 2166136261;
	for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
	return () => {
		hash += 0x6D2B79F5;
		let value = Math.imul(hash ^ hash >>> 15, 1 | hash);
		value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
		return ((value ^ value >>> 14) >>> 0) / 4294967296;
	};
}

function shuffle<T>(values: T[], random: () => number): T[] {
	const result = [...values];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function createGame(seed: string, pack: Pack = 'classic'): Game {
	seed = normalizeSeed(seed) || 'first-contact';
	const random = randomFor(`codewords-v1:${pack}:${seed}`);
	const words = shuffle(packs[pack].words, random).slice(0, 25);
	const starter: Team = random() < 0.5 ? 'red' : 'blue';
	const identities = shuffle<Identity>([
		...Array<Identity>(9).fill(starter), ...Array<Identity>(8).fill(otherTeam(starter)),
		...Array<Identity>(7).fill('neutral'), 'assassin',
	], random);
	return { seed, pack, cards: words.map((word, i) => ({ word, identity: identities[i], selected: false })) };
}

export function toggleCard(game: Game, index: number): Game {
	if (!Number.isInteger(index) || !game.cards[index]) return game;
	return { ...game, cards: game.cards.map((card, i) => i === index ? { ...card, selected: !card.selected } : card) };
}

export function restoreGame(saved: SavedGame): Game {
	return saved.selected.reduce(toggleCard, createGame(saved.seed, saved.pack));
}

export function parseSave(raw: string | null): SavedGame | null {
	try {
		const value = JSON.parse(raw || 'null');
		if (!value || typeof value.seed !== 'string' || !value.seed || value.seed !== normalizeSeed(value.seed) || !isPack(value.pack)) return null;
		let selected: unknown;
		if (value.version === 2) selected = value.selected;
		else if (value.version === 1 && Array.isArray(value.actions) && value.actions.length <= 500) {
			// Preserve selections from the earlier turn-based UI; clues and passes are no longer needed.
			if (value.actions.some((action: any) => !action || !['reveal', 'pass', 'clue'].includes(action.kind))) return null;
			selected = value.actions.filter((action: any) => action.kind === 'reveal').map((action: any) => action.index);
		} else return null;
		if (!Array.isArray(selected) || selected.length > 25 || selected.some(index => !Number.isInteger(index) || index < 0 || index >= 25) || new Set(selected).size !== selected.length) return null;
		return { seed: value.seed, pack: value.pack, selected };
	} catch { return null; }
}
