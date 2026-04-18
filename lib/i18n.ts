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
    viewMore: "View More",
    readMore: "Read more",
    learnMore: "Learn more",
    mainNavigation: "Main navigation",
    navigationMenu: "Navigation menu",
    toggleMenu: "Toggle menu",
    socialLinksRegion: "Social links",
    projectsCarousel: "Projects carousel",
    projectDetails: "Project details",
    closeOverlay: "Close overlay",
  },
  footer: {
    rss: "rss",
    sitemap: "sitemap",
    github: "github",
    resume: "resume",
    rightsReserved: "All rights reserved.",
  },
  home: {
    hero: {
      avatarAlt: "Swapnoneel Saha",
      avatarHoverAlt: "Swapnoneel Saha Hover",
      title: "swapnoneel saha",
      paragraphs: [
        "I am a software engineer and full-stack developer specializing in the architecture of developer-centric tools, high-performance web applications, and automation systems. My work is defined by a focus on reducing technical complexity through better engineering, cleaner interfaces, and intuitive user experiences.",
        "I've spent the past few years building products that can scale and perform well, ranging from developer-facing infrastructure to educational platforms that help thousands of engineers worldwide. This has allowed me to bridge the gap between back-end technical rigor and front-end usability, with deep expertise in python, typescript, and ui/ux design.",
        "Currently, I am deep in the development of agentic AI systems, crafting intelligent agents that automate complex, multi-step engineering workflows. I thrive on solving the unsolved problems, whether that involves architecting a scalable backend or designing a seamless interaction layer for a new tool.",
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
      "Solved over 1100+ questions on LeetCode, and have an overall contest rating of 1650+.",
    ],
    otherExperience: {
      title: "Other Experience",
      backLink: "work",
      role: "Freelancing",
      date: "Dec, 2022 - Present",
      subtitle: "Web Developer, UI/UX Designer & Python Developer",
      intro:
        "Collaborated with diverse business clients to deliver innovative digital solutions across web development, design, and automation.",
      bulletTitles: {
        design: "UI/UX Design:",
        python: "Python Development:",
        web: "Web Development:",
        content: "Content & Promotion:",
      },
      bullets: {
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
  blog: {
    title: "Blog",
    backLink: "blog",
    readOnHashnode: "Read on Hashnode ↗",
  },
  contactPage: {
    title: "Contact",
    intro:
      "Have a question or want to work together? I'm currently available for freelance work and I'm also open to full-time opportunities. You can reach out to me at",
    outro: "or by using the form below.",
    labels: {
      name: "Name",
      email: "Email",
      message: "Message",
    },
    placeholders: {
      name: "Your Name",
      email: "your@email.com",
      message: "How can I help you?",
    },
    sendMessage: "Send Message",
    sendingMessage: "Sending...",
    successMessage: "Message sent successfully! I'll get back to you soon.",
    errors: {
      credentialsMissing:
        "EmailJS credentials are not configured in environment variables.",
      sendFailedPrefix: "Failed to send:",
      invalidEmail: "Please enter a valid email address.",
      nameTooLong: "Name must be less than 100 characters.",
      messageTooLong: "Message must be less than 5000 characters.",
      allFieldsRequired: "All fields are required.",
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
    jobTitle: "Software Engineer & Full-stack Developer",
    downloadPdf: "Download PDF",
    hireMe: "Hire Me",
    summaryHeading: "Summary",
    summaryContent: "Software Engineer specializing in Agentic AI, high-performance full-stack systems, and developer-centric tools. Proven track record in building scalable applications and contributing to open-source infrastructure.",
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
