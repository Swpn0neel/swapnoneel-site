"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Post {
  slug: string;
  title: string;
  publishedAt: string;
}

interface BlogListProps {
  posts: Post[];
}

export function BlogList({ posts }: BlogListProps) {
  // Group by year
  const grouped = posts.reduce<Record<string, Post[]>>((acc, post) => {
    const year = new Date(post.publishedAt).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  // Initialize all years as expanded (false means not collapsed)
  const [collapsedYears, setCollapsedYears] = useState<Record<string, boolean>>({});

  const toggleYear = (year: string) => {
    setCollapsedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  return (
    <div className="pb-12">
      {years.map((year) => {
        const isCollapsed = collapsedYears[year] || false;
        return (
          <section key={year} className="mb-6">
            {/* Year Accordion Trigger */}
            <button
              onClick={() => toggleYear(year)}
              className="w-full flex items-center justify-between py-2 group select-none focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold text-foreground group-hover:text-muted-foreground transition-colors">
                  {year}
                </h2>
                <span className="text-[10px] text-muted-foreground/60 bg-secondary/65 px-2 py-0.5 rounded-full font-mono font-medium leading-none">
                  {grouped[year].length}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-all duration-300",
                  isCollapsed ? "-rotate-90" : "rotate-0"
                )}
              />
            </button>

            {/* Collapsible Content Wrapper */}
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0 pt-2 pb-4">
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
                            <span className="text-muted-foreground ml-4 shrink-0 text-xs font-mono">
                              {dateStr}
                            </span>
                          </Link>
                          {i < grouped[year].length - 1 && (
                            <hr className="border-border/40" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <hr className="border-border/40 mt-1" />
          </section>
        );
      })}
    </div>
  );
}

