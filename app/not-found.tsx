import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-muted-foreground">404 — page not found</p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm underline hover:opacity-70 transition-opacity"
      >
        go home
      </Link>
    </div>
  );
}
