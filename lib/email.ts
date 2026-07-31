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
 * Domains a typo is measured against. Only entries of 9+ characters belong
 * here: a one-edit neighbourhood around a short domain is crowded with other
 * real domains (`me.com` is one edit from `my.com`, both real), so short
 * providers are recognised but never used as a correction target.
 */
const CORRECTION_TARGETS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "icloud.com",
  "protonmail.com",
  "proton.me",
  "fastmail.com",
  "yandex.com",
  "comcast.net",
  "verizon.net",
  "sbcglobal.net",
  "btinternet.com",
  "rediffmail.com",
];

/**
 * Domains that are real and must never be "corrected". Anything one edit from
 * a correction target that actually accepts mail has to be listed, or genuine
 * users get told to fix an address that was already right — `mail.com`,
 * `ymail.com` and `email.com` are each one edit from `gmail.com`.
 */
const KNOWN_GOOD = new Set([
  ...CORRECTION_TARGETS,
  "mail.com",
  "email.com",
  "ymail.com",
  "rocketmail.com",
  "aol.com",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "me.com",
  "my.com",
  "mac.com",
  "msn.com",
  "live.com",
  "live.co.uk",
  "zoho.com",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "yandex.ru",
  "mail.ru",
  "tutanota.com",
  "hey.com",
  "pm.me",
]);

/**
 * True when one insertion, deletion, substitution or transposition of adjacent
 * characters turns `a` into `b` — Damerau-Levenshtein distance of exactly 1,
 * decided by scanning off the common prefix and suffix rather than filling a
 * matrix, since the only question is whether the distance is 1.
 *
 * Transposition is what earns the "Damerau": `gmial`, `gamil`, `hotmial` and
 * `yhaoo` are all a single swap of neighbours, and plain Levenshtein scores
 * those 2, lumping them in with genuinely different domains.
 */
function isOneEditApart(a: string, b: string): boolean {
  if (a === b) return false;
  if (Math.abs(a.length - b.length) > 1) return false;

  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;

  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  ) {
    tail++;
  }

  const restA = a.length - head - tail;
  const restB = b.length - head - tail;

  // One leftover character on each side is a substitution; one on a single
  // side is an insertion or a deletion.
  if (restA <= 1 && restB <= 1) return true;

  // Two leftover on both sides, crossing over: an adjacent transposition.
  return (
    restA === 2 &&
    restB === 2 &&
    a[head] === b[head + 1] &&
    a[head + 1] === b[head]
  );
}

/** The domain this one was probably meant to be, if any. */
function findTypo(domain: string): string | undefined {
  if (KNOWN_GOOD.has(domain)) return undefined;
  return CORRECTION_TARGETS.find((target) => isOneEditApart(domain, target));
}

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
  // Ask for a correction before ruling on the structure. A domain can fail the
  // structural test *and* sit one edit from a real one — `proton.m` has a
  // one-character TLD, and naming `proton.me` answers that far better than a
  // generic "check that email" does.
  const suggestion = findTypo(domain.toLowerCase());
  if (suggestion) return { kind: "typo", suggestion };

  if (!DOMAIN.test(domain)) return { kind: "malformed" };
  if (domain.split(".").some((label) => label.length > MAX_LABEL)) {
    return { kind: "malformed" };
  }

  return null;
}
