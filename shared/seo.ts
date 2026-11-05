export const siteUrl = "https://olegnovoselskyy.com/";
export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}#oleg`,
      name: "Oleg Novoselskyy",
      alternateName: "Tatted Dev",
      url: siteUrl,
      image: `${siteUrl}assets/oleg-portrait.webp`,
      jobTitle: "Independent Technology Consultant",
      description:
        "Software engineer and technical leader helping businesses and teams with architecture, engineering delivery and practical AI workflows.",
      sameAs: ["https://tatteddev.com/", "https://github.com/tatteddev"],
      knowsAbout: [
        "Software architecture",
        "Software modernization",
        "Engineering leadership",
        "AI workflows",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      url: siteUrl,
      name: "Oleg Novoselskyy — Technology Consulting",
      publisher: { "@id": `${siteUrl}#oleg` },
      inLanguage: "en",
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}#webpage`,
      url: siteUrl,
      name: "Oleg Novoselskyy — Technology Consulting",
      isPartOf: { "@id": `${siteUrl}#website` },
      about: { "@id": `${siteUrl}#oleg` },
      inLanguage: "en",
    },
    ...[
      "Architecture & modernization",
      "Engineering leadership & delivery",
      "Practical AI workflows",
    ].map((name) => ({
      "@type": "Service",
      name,
      provider: { "@id": `${siteUrl}#oleg` },
      url: `${siteUrl}#services`,
    })),
  ],
};

// Use identical bytes in the HTML and CSP hash; escape HTML delimiters in JSON.
export const structuredDataJson = JSON.stringify(structuredData).replace(
  /</g,
  "\\u003c",
);
