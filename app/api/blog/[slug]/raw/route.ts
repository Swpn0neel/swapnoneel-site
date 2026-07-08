import fs from "fs";
import path from "path";

const mdDir = path.join(process.cwd(), "md", "blog");

function isPathSafe(base: string, filePath: string): boolean {
  const relative = path.relative(base, filePath);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Find file recursively
  const findFileRecursively = (currentDir: string): string | null => {
    if (!fs.existsSync(currentDir)) return null;
    const list = fs.readdirSync(currentDir);
    for (const file of list) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        const found = findFileRecursively(filePath);
        if (found) return found;
      } else if (
        (file === `${slug}.md` || file === `${slug}.mdx`) &&
        isPathSafe(mdDir, filePath)
      ) {
        return filePath;
      }
    }
    return null;
  };

  const filePath = findFileRecursively(mdDir);

  if (!filePath) {
    return new Response(
      `# 404 — Not Found\n\nNo blog post with slug: \`${slug}\``,
      {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }

  const raw = fs.readFileSync(filePath, "utf8");

  return new Response(raw, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
