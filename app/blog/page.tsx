import Link from "next/link";
import { getAllBlogPosts } from "@/lib/hashnode";

export const metadata = {
  title: "Blog — Swapnoneel Saha",
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  // Group by year
  const grouped = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const year = new Date(post.publishedAt).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="pb-12">
      {years.map((year) => (
        <section key={year} className="mb-8">
          <h2 className="text-sm font-semibold mb-4">{year}</h2>
          <div className="space-y-0">
            {grouped[year].map((post, i) => {
              const d = new Date(post.publishedAt);
              const dateStr = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
              return (
                <div key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex items-center justify-between py-3 group"
                  >
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {post.title}
                    </span>
                    <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                      {dateStr}
                    </span>
                  </Link>
                  {i < grouped[year].length - 1 && (
                    <hr className="border-border" />
                  )}
                </div>
              );
            })}
          </div>
          <hr className="border-border mt-2" />
        </section>
      ))}
    </div>
  );
}
