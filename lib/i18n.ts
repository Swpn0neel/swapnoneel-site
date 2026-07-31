export const i18n = {
  nav: {
    home: "home.",
    blog: "blog.",
    work: "work.",
    contact: "contact.",
    resume: "resume.",
  },
  common: {
    skipToContent: "Skip to main content",
    seeAll: "See all",
    viewMore: "View more",
    readMore: "Read more",
    learnMore: "Learn more",
    mainNavigation: "Main navigation",
    navigationMenu: "Navigation menu",
    toggleMenu: "Toggle menu",
    socialLinksRegion: "Social links",
    projectsCarousel: "Projects carousel",
    closeOverlay: "Close overlay",
  },
  footer: {
    llms: "summary",
    source: "source",
    resume: "resume",
    site: "site",
    rightsReserved: "All rights reserved.",
  },
  home: {
    hero: {
      avatarAlt: "Swapnoneel Saha",
      avatarHoverAlt: "Swapnoneel Saha Hover",
      title: "swapnoneel saha",
      tagline:
        "i am an ai engineer and a developer advocate who specializes in accelerating the growth of startups, and in building agentic workflows, open-source ecosystems, high-performance web systems, and creating technical content.",
      paragraphs: [
        "i've spent years building products used by thousands, from developer-facing infrastructure at keploy and wizdom to building the user base for early-stage startups.",
        // "other than that, i am a polymath, i love watching films and enjoy winning hackathons.",
        // "right now i'm deep in agentic AI, crafting systems that automate multi-step engineering workflows. i thrive on unsolved problems, whether that's architecting a scalable backend or designing an interaction layer that feels invisible.",
      ],
      reachMeLabel: "Reach me at",
      reachMeSuffix: ":)",
    },
    sections: {
      experience: "Experience",
      projects: "Projects",
      contact: "Contact",
    },
    contact: {
      intro: "Shoot me a",
      messageLink: "message",
      middle: "or you can also directly",
      bookCall: "book a call",
      outro: "with me.",
    },
  },
  work: {
    sections: {
      experience: "Experience",
      projects: "Projects",
      achievements: "Achievements",
    },
    achievements: [
      "Winner of the Hack Around the World 2 Hackathon offered by MLH Hacks.",
      "Second Runner-Up of Hack 4 Bengal 3.0, Eastern India's Largest Offline Hackathon.",
      "Second Runner-Up of the Treasure Hacks 3.0 Hackathon among 600 participants.",
      "Winner of MAKATHON, an intra-university hackathon under Smart India Hackathon '23.",
      "Contributed to multiple large Open-Source projects like MindsDB, Keploy & was a contributor at GSSOC '23.",
      "Organized multiple educational sessions for students at our University involving DSA, Development & Open-Source.",
      "Solved over 1200+ questions on LeetCode, and have an overall contest rating of 1650+.",
    ],
    otherExperience: {
      title: "Other Experience",
      backLink: "work",
      role: "Freelance & Contractual Works",
      date: "Dec, 2022 - Present",
      subtitle:
        "Web Developer, UI/UX Designer, Growth Engineer & Python Developer",
      intro:
        "Collaborated with diverse business clients and startups to deliver digital solutions across web development, design, automation, agentic AI, and growth engineering.",
      bulletTitles: {
        growth: "Growth Engineering:",
        design: "UI/UX Design:",
        python: "Python Development:",
        web: "Web Development:",
        content: "Content & Promotion:",
      },
      bullets: {
        growth:
          "Worked with two UK-based stealth startups and helped them get to their MVP, finding their early customers and achieving the PMF by gathering the user feedback and iterating on the product.",
        design:
          "Created frame designs and UI/UX solutions for multiple business clients associated with hotels, restaurants, and medical hospitals, helping them stand out through innovative and user-centric designs.",
        python:
          "Developed bespoke Python software for image analysis, data processing, and task automation, significantly enhancing operational efficiency for clients.",
        web: "Crafted custom websites tailored to the unique needs of small to medium-sized businesses, including jewellery and textile shops, to drive online presence and customer engagement.",
        content:
          "Wrote persuasive promotional content for startups and created eye-catching promotional posters to captivate audiences and drive brand recognition.",
      },
    },
  },
  notFound: {
    lead: "Looks like this page took a vacation.",
    sub: "The page you're looking for doesn't exist or has been moved.",
    latestLabel: "Latest post",
    readNow: "read now",
    game: {
      canvasLabel: "Breakout: clear the 404",
      idle: "break it",
      hint: "drag to move",
      won: "all clear, but still nothing here",
      lost: "out of balls",
      again: "play again",
      left: "left",
      livesLabel: (n: number) => `${n} of 3 balls left`,
    },
  },
  blog: {
    title: "Blog",
    description:
      "Technical deep-dives, tutorials, and reflections on software engineering, Python, JavaScript, and web development.",
    backLink: "blog",
    alsoPublishedOn: "Also published on",
    lastUpdatedOn: "Last updated on",
    textSizeLabel: "Adjust article text size",
    textSizeTitles: {
      sm: "Smaller text",
      md: "Default text size",
      lg: "Larger text",
    },
  },
  contactPage: {
    title: "Contact",
    intro:
      "Have a question or want to work together? I'm currently available for freelance work and I'm also open to full-time opportunities. You can reach out to me using the form below.",
    labels: {
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
    },
    placeholders: {
      name: "your name",
      email: "your@email.com",
      subject: "what's this about?",
      message: "how can i help you?",
    },
    submit: {
      idle: "Send Message",
      pending: "Sending",
      success: {
        label: "Message sent",
        detail: "Message sent. I'll get back to you soon.",
      },
    },
    errors: {
      emptyFields: {
        label: "Fill in every field",
        detail: "Every field is required.",
      },
      invalidEmail: {
        label: "Check that email",
        detail: "That email address doesn't look right.",
      },
      nameTooLong: {
        label: "Name is too long",
        detail: "Name must be under 100 characters.",
      },
      subjectTooLong: {
        label: "Subject is too long",
        detail: "Subject must be under 150 characters.",
      },
      messageTooLong: {
        label: "Message is too long",
        detail: "Message must be under 5000 characters.",
      },
      notConfigured: {
        label: "Can't send right now",
        detail:
          "The mail service isn't configured. Try the email link instead.",
      },
      sendFailed: {
        label: "Didn't send",
        detail:
          "Something went wrong on the way out. Try again in a moment. The details are in the browser console.",
      },
    },
    bookCall: {
      title: "Book a Call",
      description:
        "Prefer to chat directly? Let's hop on a 30-minute discovery call to discuss your project or ideas.",
    },
  },
  calendar: {
    defaultButton: "Book 30 min meeting",
  },
  overlay: {
    techStack: "Tech Stack",
    features: "Features",
  },
  resume: {
    pageTitle: "Resume",
    jobTitle: "AI Engineer & Developer Advocate",
    downloadPdf: "Save as PDF",
    hireMe: "Let's Work Together",
    summaryHeading: "Summary",
    summaryContent:
      "Software Engineer specializing in Agentic AI, high-performance full-stack systems, and developer-centric tools. Proven track record in building scalable applications and contributing to open-source infrastructure.",
    skillsHeading: "Core Competencies",
    skillsCategories: {
      languages: "Languages",
      frameworks: "Frameworks",
      tools: "Tools & Tech",
    },
    experienceHeading: "Experience",
    projectsHeading: "Selected Projects",
    educationHeading: "Education",
    achievementsHeading: "Achievements",
    education: [
      {
        school: "MAKAUT",
        degree: "B.Tech in Computer Science & Engineering",
        date: "2022 \u2014 2026",
        result: "CGPA: 8.2",
      },
      {
        school: "Kalyani Public School",
        degree: "12th Boards (CBSE)",
        date: "2020 \u2014 2022",
        result: "93%",
      },
      {
        school: "The Central Modern School",
        degree: "10th Boards (ICSE)",
        date: "2018 \u2014 2020",
        result: "97%",
      },
    ],
  },
} as const;
