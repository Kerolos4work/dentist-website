import type { Metadata, Viewport } from 'next';
import { Anton, Cairo, Pinyon_Script } from 'next/font/google';
import { site } from '@/data/site';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});

const pinyon = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pinyon',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: 'د. عادل يسري | تجميل الأسنان وتصميم الابتسامة',
    template: '%s | د. عادل يسري',
  },
  description:
    'د. عادل يسري، أخصائي تجميل الأسنان وعلاج الجذور وجراحة الفم والأسنان في ميدان تريومف، مصر الجديدة. فينير، زراعة، وتصميم ابتسامة. 5.0 على Google وVezeeta.',
  keywords: [
    'دكتور أسنان مصر الجديدة',
    'تجميل الأسنان',
    'فينير',
    'زراعة أسنان',
    'تصميم ابتسامة',
    'د. عادل يسري',
  ],
  openGraph: {
    title: 'د. عادل يسري | تجميل الأسنان وتصميم الابتسامة',
    description:
      'فينير، زراعة، وتصميم ابتسامة في عيادة تريومف رويال دنتال كلينك — مصر الجديدة.',
    images: [
      {
        url: '/assets/dr-adel-yousry.jpg',
        width: 1000,
        height: 1000,
        alt: 'الدكتور عادل يسري',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'د. عادل يسري | تجميل الأسنان وتصميم الابتسامة',
    description:
      'فينير، زراعة، وتصميم ابتسامة في ميدان تريومف، مصر الجديدة.',
    images: ['/assets/dr-adel-yousry.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#060809',
  colorScheme: 'dark',
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Dentist',
  name: 'Dr. Adel Yousry',
  alternateName: 'د. عادل يسري',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  image: '/assets/dr-adel-yousry.jpg',
  telephone: '+201285827427',
  priceRange: '300 EGP',
  medicalSpecialty: 'Dentistry',
  address: {
    '@type': 'PostalAddress',
    streetAddress:
      '60 Nakhla El Motaey St., Flat 1, Floor 1, Triumph Square',
    addressLocality: 'Heliopolis, Cairo',
    addressRegion: 'Cairo',
    postalCode: '11736',
    addressCountry: 'EG',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 30.1007519,
    longitude: 31.3424207,
  },
  sameAs: [site.instagram, site.facebook, site.vezeeta, site.googleMaps],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${cairo.variable} ${anton.variable} ${pinyon.variable}`}
    >
      <body>
        <a href="#main" className="skipLink">
          تخطي إلى المحتوى
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </body>
    </html>
  );
}
