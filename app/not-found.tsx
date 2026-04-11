import { navItems } from "@/lib/config";
import { getAllBlogPosts } from "@/lib/hashnode";
import Link from "next/link";

async function getRandomPost() {
  const posts = await getAllBlogPosts();
  if (posts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * posts.length);
  return posts[randomIndex];
}

export default async function NotFound() {
  const randomPost = await getRandomPost();

  return (
    <div className="py-20">
      <div className="text-center">
        <p className="text-muted-foreground text-6xl font-bold">404</p>
        <p className="text-foreground mt-4 text-lg">
          Looks like this page took a vacation.
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div className="mt-12">
        <p className="text-muted-foreground mb-4 text-center text-xs tracking-widest uppercase">
          Quick Links
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground text-sm capitalize transition-colors"
            >
              {item.key}
            </Link>
          ))}
        </nav>
      </div>

      {randomPost && (
        <div className="border-border bg-card mt-12 rounded-lg border p-6">
          <p className="text-muted-foreground mb-3 text-center text-xs tracking-widest uppercase">
            Maybe you&apos;ll find this interesting
          </p>
          <Link
            href={`/blog/${randomPost.slug}`}
            className="hover:text-foreground block text-center transition-colors"
          >
            <span className="text-foreground font-medium">
              {randomPost.title}
            </span>
            <span className="text-muted-foreground ml-2 text-sm">
              ↗ read now
            </span>
          </Link>
        </div>
      )}

      <div className="border-border bg-card mt-12 rounded-lg border p-6">
        <p className="text-muted-foreground mb-3 text-center text-xs tracking-widest uppercase">
          Looking for something specific?
        </p>
        <p className="text-muted-foreground text-center text-sm">
          Try browsing the{" "}
          <Link href="/blog" className="text-foreground hover:underline">
            blog
          </Link>{" "}
          or{" "}
          <Link href="/work" className="text-foreground hover:underline">
            projects
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
