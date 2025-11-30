export const metadata = {
  title: "Contact Us - Get in Touch with Nectar Restaurant",
  description: "Contact Nectar Restaurant in Jos, Plateau State, Nigeria. Reach us via email, phone, WhatsApp, or visit our location. We're here to help with your dining needs.",
  keywords: ["contact Nectar", "restaurant contact", "Jos restaurant", "Plateau State restaurant", "Nectar phone", "restaurant email", "restaurant location"],
  openGraph: {
    title: "Contact Nectar Restaurant - Get in Touch",
    description: "Contact Nectar Restaurant in Jos, Plateau State, Nigeria. Reach us via email, phone, WhatsApp, or visit our location.",
    url: "/contact",
    type: "website",
    images: [
      {
        url: "/logo_black.svg",
        width: 1200,
        height: 630,
        alt: "Contact Nectar Restaurant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Nectar Restaurant",
    description: "Contact Nectar Restaurant in Jos, Plateau State, Nigeria. Reach us via email, phone, WhatsApp, or visit our location.",
    images: ["/logo_black.svg"],
  },
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact Nectar Restaurant",
            "description": "Contact Nectar Restaurant in Jos, Plateau State, Nigeria. Reach us via email, phone, WhatsApp, or visit our location.",
            "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nectarv.com'}/contact`,
            "mainEntity": {
              "@type": "Restaurant",
              "name": "Nectar Restaurant",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Restaurant Street",
                "addressLocality": "Jos",
                "addressRegion": "Plateau State",
                "addressCountry": "NG"
              },
              "telephone": "+2348108613890",
              "email": "nectarjoscity@gmail.com",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://nectarv.com"
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": process.env.NEXT_PUBLIC_SITE_URL || "https://nectarv.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Contact",
                  "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nectarv.com'}/contact`
                }
              ]
            }
          })
        }}
      />
      {children}
    </>
  );
}

