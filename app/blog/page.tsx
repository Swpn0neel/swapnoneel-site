import { getAllBlogPosts } from "@/lib/hashnode";
import { i18n } from "@/lib/i18n";
import Link from "next/link";

export const metadata = {
  title: i18n.blog.title,
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
          <h2 className="mb-4 text-sm font-semibold">{year}</h2>
          <div className="space-y-0">
            {grouped[year].map((post, i) => {
              const d = new Date(post.publishedAt);
              const dateStr = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
              return (
                <div key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex items-center justify-between py-3"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground text-sm transition-colors">
                      {post.title}
                    </span>
                    <span className="text-muted-foreground ml-4 flex-shrink-0 text-xs">
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
