import Link from "next/link";

export const metadata = {
  title: "Other Experience — Swapnoneel Saha",
};

export default function OthersPage() {
  return (
    <article className="pb-16">
      <div className="mb-8">
        <Link
          href="/work"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← work
        </Link>
        <h1 className="text-xl font-semibold mt-4 mb-1">Freelancing</h1>
        <p className="text-xs text-muted-foreground">Dec, 2022 - Present</p>
        <p className="text-sm font-medium mt-2">
          Web Developer, UI/UX Designer & Python Developer
        </p>
      </div>

      <div className="prose prose-sm max-w-none">
        <p>
          Collaborated with diverse business clients to deliver innovative
          digital solutions across web development, design, and automation.
        </p>
        <ul>
          <li>
            <strong>UI/UX Design:</strong> Created frame designs and UI/UX
            solutions for multiple business clients associated with hotels,
            restaurants, and medical hospitals, helping them stand out through
            innovative and user-centric designs.
          </li>
          <li>
            <strong>Python Development:</strong> Developed bespoke Python
            software for image analysis, data processing, and task automation,
            significantly enhancing operational efficiency for clients.
          </li>
          <li>
            <strong>Web Development:</strong> Crafted custom websites tailored to
            the unique needs of small to medium-sized businesses, including
            jewellery and textile shops, to drive online presence and customer
            engagement.
          </li>
          <li>
            <strong>Content & Promotion:</strong> Wrote persuasive promotional
            content for startups and created eye-catching promotional posters to
            captivate audiences and drive brand recognition.
          </li>
        </ul>
      </div>
    </article>
  );
}
