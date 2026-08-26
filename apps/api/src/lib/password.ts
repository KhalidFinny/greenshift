// OWASP Password Storage Cheat Sheet: >= 600k for PBKDF2-HMAC-SHA256.
const ITERATIONS = 600_000;
// Upper bound read from stored hashes; anything above is rejected to avoid
// a poisoned hash string forcing excessive CPU on verify.
const MAX_ITERATIONS = 1_000_000;
const STORED_HASH_RE = /^pbkdf2\$(\d+)\$([0-9a-f]{32})\$([0-9a-f]{64})$/;

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}

function parseStoredHash(stored: string) {
	const match = STORED_HASH_RE.exec(stored);
	if (!match) return null;
	const iterations = Number(match[1]);
	if (!Number.isInteger(iterations) || iterations <= 0) return null;
	return {
		iterations,
		saltHex: match[2],
		hashHex: match[3],
	};
}

export function passwordNeedsRehash(stored: string): boolean {
	const parsed = parseStoredHash(stored);
	return !!parsed && parsed.iterations < ITERATIONS;
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
		key,
		256,
	);
	return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(
	password: string,
	stored: string,
): Promise<boolean> {
	const parsed = parseStoredHash(stored);
	if (!parsed) return false;

	const effectiveIterations = Math.min(parsed.iterations, MAX_ITERATIONS);
	const salt = fromHex(parsed.saltHex);
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt,
			iterations: effectiveIterations,
		},
		key,
		256,
	);
	return constantTimeEqual(new Uint8Array(bits), fromHex(parsed.hashHex));
}
