export interface StructuredDataProps {
  type: 'Calculator' | 'WebApplication' | 'FAQ' | 'BreadcrumbList';
  name?: string;
  description?: string;
  url?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  faqItems?: Array<{
    question: string;
    answer: string;
  }>;
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

export const generateStructuredData = (props: StructuredDataProps) => {
  const baseUrl = 'https://opticalsatellitetools.space';
  
  switch (props.type) {
    case 'Calculator':
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": props.name,
        "description": props.description,
        "url": props.url || baseUrl,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": [
          "Ground Sample Distance (GSD) Calculation",
          "Sensor Field Coverage Visualization",
          "Orbital Parameter Analysis",
          "Real-time 3D Satellite Visualization",
          "Earth Footprint Mapping"
        ],
        "creator": {
          "@type": "Organization",
          "name": "Optical Satellite Tools",
          "url": baseUrl
        }
      };
      
    case 'WebApplication':
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": props.name,
        "description": props.description,
        "url": props.url || baseUrl,
        "applicationCategory": props.applicationCategory || "UtilityApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      };
      
    case 'FAQ':
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": props.faqItems?.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      };
      
    case 'BreadcrumbList':
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": props.breadcrumbs?.map((breadcrumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": breadcrumb.name,
          "item": breadcrumb.url.startsWith('http') ? breadcrumb.url : `${baseUrl}${breadcrumb.url}`
        }))
      };
      
    default:
      return {};
  }
};

export const toolKeywords = {
  calculator: [
    "satellite optical sensor calculator",
    "ground sample distance calculator", 
    "GSD calculator",
    "satellite imaging calculator",
    "earth observation tools",
    "remote sensing calculator",
    "satellite sensor parameters",
    "orbital mechanics calculator",
    "satellite footprint calculator",
    "sensor field coverage",
    "satellite engineering tools",
    "astrodynamics calculator"
  ],
  revisit: [
    "satellite revisit analysis",
    "ground track analysis", 
    "satellite coverage analysis",
    "orbital revisit time",
    "satellite constellation analysis",
    "earth observation coverage",
    "satellite pass prediction",
    "ground station visibility",
    "satellite orbit visualization",
    "constellation design tools"
  ],
  modeling: [
    "satellite sensor modeling",
    "MTF analysis", 
    "PSF analysis",
    "point spread function",
    "modulation transfer function",
    "optical sensor performance",
    "image quality analysis",
    "satellite optics modeling",
    "sensor resolution analysis",
    "optical system design"
  ]
};

export const metaDescriptions = {
  home: "Professional satellite optical sensor calculator for GSD, sensor parameters, and field coverage analysis. Free tools for satellite engineering, earth observation, and remote sensing applications.",
  revisit: "Analyze satellite revisit times, ground tracks, and coverage patterns. Comprehensive tool for satellite constellation design and earth observation mission planning.",
  modeling: "Advanced satellite sensor modeling tools including MTF and PSF analysis. Professional optical performance assessment for satellite imaging systems and sensor design.",
  about: "Learn about our satellite engineering tools and contact our team. Professional calculators and analysis tools for earth observation and remote sensing applications.",
  privacy: "Privacy policy for Optical Satellite Tools - protecting your data while using our satellite engineering calculators and analysis tools.",
  terms: "Terms of service for using our satellite optical sensor calculators, revisit analysis tools, and modeling applications."
};