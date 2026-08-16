/**
 * Turning failures into sentences a user can act on.
 *
 * Three very different kinds of failure reach the interface and they need
 * different handling:
 *
 *  - a circuit assertion, which means a mandate rule was violated and the user
 *    should be told *which* rule;
 *  - a wallet or network failure, which means nothing was wrong with the request
 *    and they should retry or fix their setup;
 *  - a programming error, which should not be dressed up as either.
 *
 * Everything here is written to be displayed verbatim.
 */

import { FEE_TOKEN, NETWORK_LABEL, SPEND_TOKEN } from './network';

export interface FriendlyError {
  message: string;
  /** True when the chain refused the action because a mandate rule was broken. */
  ruleViolation: boolean;
  /** The raw text, kept for the activity log and for debugging. */
  raw: string;
}

/** Patterns matched against the raw failure text, most specific first. */
const PATTERNS: { match: RegExp; message: string; ruleViolation?: boolean }[] = [
  // --- circuit assertions from mandate.compact -----------------------------
  {
    match: /caller is not the authorized agent/i,
    message:
      'This agent is not the one bound to that mandate. Only the authorized agent key can act under it.',
    ruleViolation: true,
  },
  {
    match: /rules do not open the on-chain commitment/i,
    message:
      'The rules held locally do not match the commitment published on chain. They have been edited, or this is the wrong mandate.',
    ruleViolation: true,
  },
  {
    match: /not the creator of this mandate/i,
    message:
      'Only the wallet that created this mandate can do that. Connect the wallet that funded it.',
    ruleViolation: true,
  },
  {
    match: /only the creator can add funds/i,
    message: 'Only the mandate’s creator can add funds to its escrow.',
    ruleViolation: true,
  },
  {
    match: /mandate has been revoked|mandate is already revoked/i,
    message: 'This mandate has been revoked. No further agent action can be authorized under it.',
    ruleViolation: true,
  },
  {
    match: /revoke the mandate before withdrawing/i,
    message: 'Revoke the mandate first. That is what releases the balance for reclaim.',
    ruleViolation: true,
  },
  {
    match: /nothing left to withdraw/i,
    message: 'This mandate’s escrow is already empty.',
    ruleViolation: true,
  },
  {
    match: /exceeds the per-transaction limit/i,
    message: 'That amount is above the mandate’s per-transaction limit.',
    ruleViolation: true,
  },
  {
    match: /exceeds the total spend limit/i,
    message: 'That payment would take cumulative spending past the mandate’s total limit.',
    ruleViolation: true,
  },
  {
    match: /exceeds the rolling-period limit/i,
    message: 'That payment would break the mandate’s daily or weekly limit for the current window.',
    ruleViolation: true,
  },
  {
    match: /recipient is not on the allow-list/i,
    message: 'That recipient is not on the mandate’s allow-list.',
    ruleViolation: true,
  },
  {
    match: /insufficient escrow balance/i,
    message: 'The mandate’s escrow does not hold enough for that payment.',
    ruleViolation: true,
  },
  {
    match: /mandate is not yet valid/i,
    message: 'This mandate has not started yet.',
    ruleViolation: true,
  },
  {
    match: /mandate has expired/i,
    message: 'This mandate’s validity window has passed.',
    ruleViolation: true,
  },
  {
    match: /claimed timestamp is (stale|in the future)/i,
    message:
      'The timestamp did not line up with the chain’s clock. Retry — this usually resolves on the next block.',
    ruleViolation: true,
  },
  {
    match: /id already in use/i,
    message: 'A mandate with that identifier already exists. Try creating it again.',
  },
  { match: /unknown mandate/i, message: 'That mandate does not exist in this registry.' },

  // --- wallet and connector ------------------------------------------------
  {
    match: /user (rejected|denied|declined)|rejected the request|cancell?ed/i,
    message: 'You dismissed the request in your wallet. Nothing was submitted.',
  },
  {
    match: /not authorized|unauthorized|permission/i,
    message: 'The wallet has not authorized this site. Approve the connection in Lace and retry.',
  },
  {
    match: /no midnight wallet|window\.midnight|wallet not found/i,
    message:
      'No Midnight wallet detected. Install the Lace Midnight Preview extension, then reload this page.',
  },
  {
    match: /insufficient|not enough|balance too low/i,
    message:
      `The wallet does not hold enough ${SPEND_TOKEN} or ${FEE_TOKEN} to complete this. ` +
      `Top up from the faucet, and make sure ${FEE_TOKEN} generation is enabled in Lace.`,
  },
  {
    match: /network|wrong chain|chain id/i,
    message: `Wrong network. Switch the wallet to ${NETWORK_LABEL} and retry.`,
  },

  // --- infrastructure ------------------------------------------------------
  {
    match: /fetch failed|network error|ECONNREFUSED|ENOTFOUND|Failed to fetch/i,
    message:
      'Could not reach the network. Check your connection, then retry — nothing was submitted.',
  },
  {
    match: /timeout|timed out/i,
    message: 'The request timed out before completing. It may still settle; refresh before retrying.',
  },
  {
    match: /indexer/i,
    message:
      'The indexer did not respond. The transaction may still have been accepted — refresh in a moment.',
  },
  {
    match: /proof|prover|proving/i,
    message:
      'Proof generation failed in the wallet. Make sure Lace is unlocked and up to date, then retry.',
  },
  {
    match: /password/i,
    message:
      'The private-state password was rejected. It protects your mandate rules and cannot be recovered if lost.',
  },
];

/**
 * Convert any thrown value into something worth showing a user.
 *
 * Circuit assertions come through the runtime as `failed assert: <message>`;
 * those messages are already written for humans in `mandate.compact`, so the
 * mapping above mostly adds the context the contract cannot know.
 */
export function explainError(error: unknown): FriendlyError {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);

  // Circuit assertions carry their own human-readable text.
  const assertion = /failed assert:\s*(.*)/i.exec(raw);
  const subject = assertion ? assertion[1].trim() : raw;

  for (const pattern of PATTERNS) {
    if (pattern.match.test(subject)) {
      return {
        message: pattern.message,
        ruleViolation: pattern.ruleViolation ?? false,
        raw,
      };
    }
  }

  // An unmatched assertion is still a rule violation, and its own text is the
  // most accurate thing available.
  if (assertion) {
    return { message: stripPrefix(subject), ruleViolation: true, raw };
  }

  return { message: stripPrefix(subject), ruleViolation: false, raw };
}

function stripPrefix(text: string): string {
  return text.replace(/^Mandate:\s*/i, '').trim() || 'Something went wrong.';
}
