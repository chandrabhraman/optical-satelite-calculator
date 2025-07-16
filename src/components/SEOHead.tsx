import { Helmet } from 'react-helmet-async';
import { generateStructuredData, StructuredDataProps } from '@/utils/seoUtils';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  structuredData?: StructuredDataProps[];
  noIndex?: boolean;
}

export const SEOHead = ({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = "https://opticalsatellitetools.space/opengraph-image-p98pqg.png",
  structuredData = [],
  noIndex = false
}: SEOHeadProps) => {
  const baseUrl = 'https://opticalsatellitetools.space';
  const fullTitle = title.includes('Optical Satellite Tools') ? title : `${title} | Optical Satellite Tools`;
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : baseUrl);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Optical Satellite Tools" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@satellite_tools" />
      
      {/* Additional Meta */}
      <meta name="author" content="Optical Satellite Tools Team" />
      <meta name="theme-color" content="#1a1a1a" />
      
      {/* Structured Data */}
      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(generateStructuredData(data))}
        </script>
      ))}
    </Helmet>
  );
};