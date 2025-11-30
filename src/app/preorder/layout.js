export const metadata = {
  title: "Pre-Order - Order Ahead for Pickup or Delivery",
  description: "Pre-order your favorite meals from Nectar Restaurant. Order ahead of time for pickup or delivery. Fresh meals delivered on launch day.",
  keywords: ["pre-order", "order ahead", "food pre-order", "restaurant pre-order", "Nectar pre-order", "Jos pre-order", "Plateau State pre-order"],
  openGraph: {
    title: "Pre-Order from Nectar - Order Ahead for Pickup or Delivery",
    description: "Pre-order your favorite meals from Nectar Restaurant. Order ahead of time for pickup or delivery.",
    url: "/preorder",
    type: "website",
    images: [
      {
        url: "/logo_black.svg",
        width: 1200,
        height: 630,
        alt: "Nectar Pre-Order",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pre-Order from Nectar - Order Ahead",
    description: "Pre-order your favorite meals from Nectar Restaurant.",
    images: ["/logo_black.svg"],
  },
  alternates: {
    canonical: "/preorder",
  },
};

export default function PreOrderLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Pre-Order from Nectar",
            "description": "Pre-order your favorite meals from Nectar Restaurant. Order ahead of time for pickup or delivery.",
            "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nectarv.com'}/preorder`,
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
                  "name": "Pre-Order",
                  "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nectarv.com'}/preorder`
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

