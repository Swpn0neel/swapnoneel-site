import type { Element, ElementContent, Properties, Root } from "hast";

/**
 * @types/hast models Properties as a per-attribute interface — `target` and
 * `rel` are Array<string>, `strokeWidth` is a string, and so on. That is right
 * for consumers reading a tree, but these helpers are building one from
 * literals, so they take a loose record and cast once here rather than at every
 * call site.
 */
type Attrs = Record<string, unknown>;

/** Minimal hast helpers shared by the markdown plugins. */

export function h(
  tagName: string,
  properties: Attrs = {},
  children: ElementContent[] = []
): Element {
  return {
    type: "element",
    tagName,
    properties: properties as Properties,
    children,
  };
}

/**
 * A lucide icon as hast, matching src/components/Icon.astro so a copy button
 * built here looks identical to one rendered in a component.
 */
export function icon(
  paths: string[],
  className: string,
  extra: ElementContent[] = []
): Element {
  return h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: 24,
      height: 24,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: ["lucide", ...className.split(" ")].filter(Boolean),
    },
    [...extra, ...paths.map((d) => h("path", { d }))]
  );
}

/** Depth-first walk over element nodes, parent-aware so children can be replaced. */
export function visitElements(
  tree: Root | Element,
  visit: (node: Element, index: number, parent: Root | Element) => void
): void {
  const walk = (parent: Root | Element) => {
    const children = parent.children as ElementContent[];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.type !== "element") continue;
      walk(child);
      visit(child, i, parent);
    }
  };
  walk(tree);
}

/** All text under a node, concatenated. */
export function textOf(node: ElementContent | Root): string {
  if (node.type === "text") return node.value;
  if ("children" in node) {
    return (node.children as ElementContent[]).map(textOf).join("");
  }
  return "";
}

export function classList(node: Element): string[] {
  const value: unknown = node.properties?.className;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/\s+/);
  return [];
}
