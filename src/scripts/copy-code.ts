/**
 * One delegated listener for every code block on the page.
 *
 * components/copy-button.tsx was a React component per block, each holding a
 * three-state machine and a reset timer. The markup is stateless now — the
 * button carries no state, the wrapper carries the text — so this is the whole
 * of it.
 */

const RESET_MS = 2000;

const LABEL = {
  idle: "Copy code block",
  copied: "Copied",
  error: "Copy failed",
} as const;

type Status = keyof typeof LABEL;

/**
 * `navigator.clipboard` only exists on secure origins, so it is undefined when
 * the site is opened over plain http — previewing from a phone on the LAN, for
 * instance. Falling back to execCommand keeps the button working there instead
 * of failing silently.
 */
async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const staging = document.createElement("textarea");
  staging.value = text;
  staging.readOnly = true;
  staging.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(staging);
  staging.select();
  const copied = document.execCommand("copy");
  staging.remove();
  if (!copied) throw new Error("execCommand('copy') was rejected");
}

const timers = new WeakMap<HTMLElement, number>();

function settle(button: HTMLElement, status: Status) {
  button.dataset.copyState = status;
  button.setAttribute("aria-label", LABEL[status]);
  button.setAttribute("title", LABEL[status]);
  const announcer = button.querySelector("[aria-live]");
  if (announcer) announcer.textContent = status === "idle" ? "" : LABEL[status];

  const existing = timers.get(button);
  if (existing) window.clearTimeout(existing);
  if (status === "idle") return;
  timers.set(
    button,
    window.setTimeout(() => settle(button, "idle"), RESET_MS)
  );
}

export function initCopyCode(root: ParentNode = document): void {
  root.addEventListener("click", async (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-copy-code]"
    );
    if (!button) return;
    if (button.dataset.copyState === "copied") return;

    const code = button.closest<HTMLElement>(".code-block")?.dataset.code;
    if (code === undefined) return;

    try {
      await writeClipboard(code);
      settle(button, "copied");
    } catch (error) {
      console.error("Failed to copy code: ", error);
      settle(button, "error");
    }
  });
}
