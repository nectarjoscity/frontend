// Shared metadata configuration for Nectar Restaurant

export const siteConfig = {
  name: "Nectar",
  description: "Nectar Restaurant - Browse our menu, order your favorites, and enjoy fresh, delicious meals. Pre-order for pickup or delivery. Experience amazing dining in Jos, Plateau State, Nigeria.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://nectarv.com",
  ogImage: "/logo_black.svg",
  links: {
    email: "nectarjoscity@gmail.com",
    phone: "+2348108613890",
    whatsapp: "https://wa.me/2348108613890",
  },
};

export const generateRestaurantSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Nectar Restaurant",
    "image": "/logo_black.svg",
    "description": "Nectar Restaurant - Discover amazing dining experiences. Browse our menu, order your favorites, and enjoy fresh, delicious meals.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Restaurant Street",
      "addressLocality": "Jos",
      "addressRegion": "Plateau State",
      "addressCountry": "NG"
    },
    "telephone": "+2348108613890",
    "email": "nectarjoscity@gmail.com",
    "servesCuisine": "International",
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "09:00",
        "closes": "22:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Saturday",
          "Sunday"
        ],
        "opens": "10:00",
        "closes": "23:00"
      }
    ],
    "menu": "/",
    "acceptsReservations": "True",
    "url": siteConfig.url
  };
};

