/**
 * Structural checks for the contact form's email field.
 *
 * Deliberately stricter than `<input type="email">`, whose spec pattern accepts
 * `a@b` — no dot, no TLD — along with `x@-.-` and `a..b@c.d`. Nothing here
 * proves an address is deliverable; only a reply does that. The job is to catch
 * the addresses that are *certainly* wrong before they cost a round trip and a
 * bounce nobody sees.
 */

/** RFC 5321 §4.5.3.1. The 320 usually quoted is local+domain in isolation; the
 *  path limit that actually applies to a whole address is 254. */
const MAX_TOTAL = 254;
const MAX_LOCAL = 64;
const MAX_LABEL = 63;

/** Dot-separated atoms from the RFC 5322 `atext` set. Written as
 *  atom(.atom)* rather than a character class with dots so that a leading dot,
 *  a trailing dot and consecutive dots are all excluded by construction. */
const LOCAL_PART =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;

/** Two labels minimum. Each begins and ends alphanumeric and may carry hyphens
 *  inside, which rules out `-example.com` and `example-.com`. The last label is
 *  the TLD: letters only and at least two, which is what rejects a bare
 *  hostname and `user@example.1`. */
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * Domains near-identical to one people meant to type. Curated rather than
 * derived from an edit-distance threshold on purpose: `mail.com` is one edit
 * from `gmail.com` and is a real provider, so a distance rule would tell
 * genuine users to correct a correct address. Every key here is a domain that
 * does not accept mail.
 */
const LOOKALIKES: Record<string, string> = {
  // gmail
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmall.com": "gmail.com",
  "googlemail.co": "gmail.com",
  // outlook / hotmail / live
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlool.com": "outlook.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmall.com": "hotmail.com",
  "live.co": "live.com",
  // yahoo
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yahoo.cm": "yahoo.com",
  // apple
  "icloud.co": "icloud.com",
  "icloud.con": "icloud.com",
  "iclould.com": "icloud.com",
  "icloude.com": "icloud.com",
  "iclod.com": "icloud.com",
  // proton
  "proton.m": "proton.me",
  "protonmai.com": "protonmail.com",
  "protonmail.co": "protonmail.com",
};

export type EmailProblem =
  | { kind: "malformed" }
  | { kind: "typo"; suggestion: string };

/**
 * Returns the problem with `address`, or `null` if it is structurally sound.
 * Expects an already-trimmed value.
 */
export function checkEmail(address: string): EmailProblem | null {
  if (address.length > MAX_TOTAL) return { kind: "malformed" };

  // Split on the last `@`: it is the delimiter, and a quoted local part may
  // legally contain earlier ones.
  const at = address.lastIndexOf("@");
  if (at < 1 || at === address.length - 1) return { kind: "malformed" };

  const local = address.slice(0, at);
  const domain = address.slice(at + 1);

  if (local.length > MAX_LOCAL || !LOCAL_PART.test(local)) {
    return { kind: "malformed" };
  }
  if (!DOMAIN.test(domain)) return { kind: "malformed" };
  if (domain.split(".").some((label) => label.length > MAX_LABEL)) {
    return { kind: "malformed" };
  }

  const suggestion = LOOKALIKES[domain.toLowerCase()];
  return suggestion ? { kind: "typo", suggestion } : null;
}
