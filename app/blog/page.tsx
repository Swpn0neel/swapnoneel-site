import { BlogList } from "@/components/blog-list";
import { i18n } from "@/lib/i18n";
import { getAllBlogPosts } from "@/lib/md";

export const metadata = {
  title: i18n.blog.title,
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return <BlogList posts={posts} />;
}
