/**
 * Byte / address / amount encoding helpers.
 *
 * Compact works in `Uint8Array`s and `bigint`s; the UI works in hex strings,
 * bech32m addresses and decimal amounts. Everything that crosses that boundary
 * goes through this module so the conversions live in exactly one place.
 */

import {
  MidnightBech32m,
  UnshieldedAddress,
} from '@midnight-ntwrk/wallet-sdk-address-format';

/**
 * Decimal places of the native token (NIGHT / tNIGHT).
 *
 * Amounts everywhere else in this codebase are integers in the smallest unit.
 * If a faucet payout does not line up with what the UI displays, this is the
 * single constant to correct.
 */
export const NIGHT_DECIMALS = 6;

export const HEX32 = /^[0-9a-f]{64}$/;

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error(`Hex string has an odd length: ${hex}`);
  }
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) throw new Error(`Not a hex string: ${hex}`);
    out[i] = byte;
  }
  return out;
}

/** A 32-byte value as hex, rejecting anything that is not exactly 32 bytes. */
export function assertHex32(value: string, what: string): string {
  const normalized = (value.startsWith('0x') ? value.slice(2) : value).toLowerCase();
  if (!HEX32.test(normalized)) {
    const detail =
      value.trim() === ''
        ? 'it is empty'
        : `it is ${normalized.length} characters and must be 64`;
    throw new Error(`${what} must be 64 hexadecimal characters — ${detail}.`);
  }
  return normalized;
}

/** 32 cryptographically random bytes, as hex. */
export function randomHex32(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

const ZERO_32 = new Uint8Array(32);

export function zeroBytes32(): Uint8Array {
  return ZERO_32.slice();
}

/**
 * Decode a bech32m unshielded address (`mn_addr_...`) to its 32 raw bytes.
 *
 * Also accepts a bare 32-byte hex string, which is what the local simulator and
 * the test fixtures use.
 */
export function decodeUnshieldedAddress(address: string, networkId: string): Uint8Array {
  const trimmed = address.trim();
  if (HEX32.test(trimmed.toLowerCase())) {
    return hexToBytes(trimmed.toLowerCase());
  }
  try {
    const parsed = MidnightBech32m.parse(trimmed);
    const decoded = parsed.decode(UnshieldedAddress, networkId);
    return new Uint8Array(decoded.data);
  } catch {
    throw new Error(
      `"${truncateAddress(trimmed, 14, 6)}" is not a valid Midnight unshielded address. ` +
        'Paste the address exactly as your wallet shows it.',
    );
  }
}

/** True when `address` is something `decodeUnshieldedAddress` can handle. */
export function isValidRecipient(address: string, networkId: string): boolean {
  try {
    decodeUnshieldedAddress(address, networkId);
    return true;
  } catch {
    return false;
  }
}

/** Shorten an address for display: `mn_addr_test1qab…7x9f`. */
export function truncateAddress(address: string, lead = 12, tail = 6): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

/**
 * Parse a human amount ("12.5") into smallest units.
 *
 * Error messages here surface directly in the UI, so they are written for the
 * person typing rather than for a log.
 */
export function parseAmount(input: string): bigint {
  const trimmed = input.trim();
  if (trimmed === '') throw new Error('Enter an amount.');
  if (trimmed === '.' || !/^\d*\.?\d*$/.test(trimmed)) {
    throw new Error(`"${input}" is not a valid amount. Use digits and at most one decimal point.`);
  }
  const [whole, fraction = ''] = trimmed.split('.');
  if (fraction.length > NIGHT_DECIMALS) {
    throw new Error(`tNIGHT supports at most ${NIGHT_DECIMALS} decimal places.`);
  }
  const padded = fraction.padEnd(NIGHT_DECIMALS, '0');
  return BigInt(whole === '' ? '0' : whole) * 10n ** BigInt(NIGHT_DECIMALS) + BigInt(padded === '' ? '0' : padded);
}

/** Render smallest units as a human amount, trimming trailing zeros. */
export function formatAmount(value: bigint): string {
  const scale = 10n ** BigInt(NIGHT_DECIMALS);
  const whole = value / scale;
  const fraction = value % scale;
  if (fraction === 0n) return whole.toString();
  const digits = fraction.toString().padStart(NIGHT_DECIMALS, '0').replace(/0+$/, '');
  return `${whole}.${digits}`;
}

/** `formatAmount` with the ticker appended. */
export function formatToken(value: bigint, ticker = 'tNIGHT'): string {
  return `${formatAmount(value)} ${ticker}`;
}
