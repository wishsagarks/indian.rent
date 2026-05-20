interface ListingJsonLdProps {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  rentAmount?: number;
  depositMonths?: number;
  furnishingType?: string;
}

export default function ListingJsonLd({
  id,
  title,
  description,
  imageUrl,
  location,
  rentAmount,
  depositMonths,
  furnishingType,
}: ListingJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": title,
    "description": description || title,
    "url": `https://indian.rent/flatmates/${id}`,
    "image": imageUrl || "https://indian.rent/og-image",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": location || "India",
      "addressCountry": "IN"
    },
    "priceSpecification": rentAmount ? {
      "@type": "PriceSpecification",
      "price": rentAmount,
      "priceCurrency": "INR",
      "billingIncrement": "P1M"
    } : undefined,
    "datePublished": new Date().toISOString(),
    "availability": "https://schema.org/InStock",
  };

  // Remove undefined fields
  Object.keys(schema).forEach(key => {
    if (schema[key as keyof typeof schema] === undefined) {
      delete schema[key as keyof typeof schema];
    }
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
      suppressHydrationWarning
    />
  );
}
