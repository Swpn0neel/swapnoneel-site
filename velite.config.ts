import { defineCollection, defineConfig, s } from "velite";

const blog = defineCollection({
  name: "Blog",
  pattern: "blog/**/*.md",
  schema: s
    .object({
      title: s.string(),
      date: s.string(),
      updated: s.string().optional(),
      description: s.string().optional(),
      cover: s.string().optional(),
      link: s.union([s.string(), s.array(s.string())]).optional(),
      tags: s.array(s.string()).optional(),
      brand: s.string().optional(),
      featured: s.boolean().optional(),
      hidden: s.boolean().optional(),
      path: s.path(),
      body: s.raw(),
    })
    .transform((data) => {
      const slug = data.path.split("/").pop() ?? data.path;
      return { ...data, slug };
    }),
});

const work = defineCollection({
  name: "Work",
  pattern: "work/**/*.md",
  schema: s
    .object({
      title: s.string(),
      date: s.string(),
      description: s.string().optional(),
      cover: s.string().optional(),
      link: s.union([s.string(), s.array(s.string())]).optional(),
      path: s.path(),
      body: s.raw(),
    })
    .transform((data) => {
      const slug = data.path.split("/").pop() ?? data.path;
      return { ...data, slug };
    }),
});

const projects = defineCollection({
  name: "Project",
  pattern: "projects/**/*.md",
  schema: s
    .object({
      title: s.string(),
      date: s.string(),
      description: s.string().optional(),
      cover: s.string().optional(),
      link: s.union([s.string(), s.array(s.string())]).optional(),
      featured: s.boolean().optional(),
      hidden: s.boolean().optional(),
      path: s.path(),
      body: s.raw(),
    })
    .transform((data) => {
      const slug = data.path.split("/").pop() ?? data.path;
      return { ...data, slug };
    }),
});

export default defineConfig({
  root: "md",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    blog,
    work,
    projects,
  },
});
