import { CopyButton } from "@/components/copy-button";
import { codeLanguage, normalizeCodeText } from "@/lib/mdx-text";
import type { ComponentPropsWithoutRef } from "react";

/**
 * MDX `pre` renderer: the language chip and the copy button ride in the code
 * box's top-right corner, pinned there rather than laid out in flow so the code
 * starts at the very top of the box. `.prose pre` carries a right gutter wide
 * enough that the pair never covers a line, at rest or at full scroll — see the
 * note there before changing either. The bare ``` fences in the archive have no
 * language, so the chip is dropped there and the button keeps the corner.
 *
 * The chips fill with --background, not --secondary: --secondary *is* the box
 * they sit on, and --border matches it in dark, so a chip styled like the shell
 * would be invisible against it. They do restate the shell's 6px radius. Keep
 * this in step with the copy button, which carries the same classes.
 */
export function CodeBlock(props: ComponentPropsWithoutRef<"pre">) {
  const language = codeLanguage(props.children);
  const code = normalizeCodeText(props.children);
  // A one-liner — an install command, usually — is short enough that the chips'
  // fixed top inset reads as misalignment rather than as a corner. The modifier
  // centres them on the single line instead; see globals.css.
  const isSingleLine = !code.includes("\n");

  return (
    <div
      className={
        isSingleLine ? "code-block code-block--one-line" : "code-block"
      }
    >
      <div className="code-block__controls">
        {language && (
          <span className="border-border bg-background/90 text-muted-foreground text-2xs flex h-6 items-center rounded-[6px] border px-2 font-medium">
            {language}
          </span>
        )}
        <CopyButton text={code} />
      </div>
      <pre {...props} />
    </div>
  );
}
