export type NavItem = {
  href: string;
  label: string;
};

export type Service = {
  title: string;
  titleAr: string;
  description: string;
  image?: string;
  imageAlt?: string;
};

export type ResultItem = {
  image: string;
  alt: string;
  title: string;
  titleAr: string;
  tag: string;
};

export type Review = {
  quote: string;
  author: string;
  meta: string;
  source: 'Google' | 'Vezeeta';
  sourceUrl: string;
};

export type Credential = {
  text: string;
  accent: 'cyan' | 'red' | 'white';
};

export type SocialPost = {
  href: string;
  image: string;
  alt: string;
  label: string;
};

export const site = {
  nameAr: 'د. عادل يسري',
  nameEn: 'Dr. Adel Yousry',
  clinicName: 'Triumph Royal Dental Clinic',
  clinicNameAr: 'تريومف رويال دنتال كلينك',
  specialty: 'أخصائي تجميل الأسنان وعلاج الجذور وجراحة الفم والأسنان',
  tagline: 'Dental Cosmetic Specialist',
  taglineAr: 'تجميل الأسنان وتصميم الابتسامة',
  phoneDisplay: '+20 12 85827427',
  phoneHref: 'tel:+201285827427',
  whatsapp: 'https://wa.me/201285827427',
  instagram: 'https://www.instagram.com/dr.adelyousry/',
  facebook: 'https://www.facebook.com/p/Dr-Adel-Yousry-61563860608616/',
  vezeeta:
    'https://www.vezeeta.com/en/dr/Doctor-Adel-yosery-abd-elaziz-Dentistry',
  googleMaps:
    'https://www.google.com/maps/place/Dr+Adel+Yousry+%7C+%D8%AF.%D8%B9%D8%A7%D8%AF%D9%84+%D9%8A%D8%B3%D8%B1%D9%8A%E2%80%AD/@30.1007519,31.3424207,17z/data=!3m1!4b1!4m6!3m5!1s0x1458150e2e98c113:0x88b184d1300b38d4!8m2!3d30.1007519!4d31.3424207!16s%2Fg%2F11h1m5c3w2?entry=ttu',
  mapsEmbed:
    'https://www.google.com/maps?q=30.1007519,31.3424207&z=17&output=embed',
  mapsDirections:
    'https://www.google.com/maps/search/?api=1&query=30.1007519,31.3424207',
  yellowPages:
    'https://yellowpages.com.eg/en/map-category/dentist-clinics/11/p14/l%D8%AF',
  address:
    '60 شارع نخلة المطيعي، شقة 1، الدور 1، ميدان تريومف، مصر الجديدة، القاهرة (فوق محل فلورينا)',
  addressShort: '60 شارع نخلة المطيعي، ميدان تريومف، مصر الجديدة',
  hours: 'المواعيد تُؤكَّد عند الحجز',
  hoursNote: 'راجع مواعيد اليوم على Google Maps',
  fee: '300 ج.م',
  feeNote: 'سعر الكشف داخل العيادة',
  waitingTime: '31 دقيقة',
  googleRating: '5.0',
  googleReviewCount: '100',
  vezeetaRating: '5.0',
  vezeetaReviewCount: '226',
  instagramPostsCount: '49',
  nav: [
    { href: '/', label: 'الرئيسية' },
    { href: '/services', label: 'الخدمات' },
    { href: '/results', label: 'النتائج' },
    { href: '/about', label: 'عن الدكتور' },
    { href: '/contact', label: 'تواصل' },
  ] satisfies NavItem[],
  proof: [
    {
      value: '5.0',
      label: 'تقييم Google',
      meta: '100 تقييم',
      href: 'https://www.google.com/maps/place/Dr+Adel+Yousry+%7C+%D8%AF.%D8%B9%D8%A7%D8%AF%D9%84+%D9%8A%D8%B3%D8%B1%D9%8A%E2%80%AD/@30.1007519,31.3424207,17z/data=!3m1!4b1!4m6!3m5!1s0x1458150e2e98c113:0x88b184d1300b38d4!8m2!3d30.1007519!4d31.3424207!16s%2Fg%2F11h1m5c3w2?entry=ttu',
    },
    {
      value: '5.0',
      label: 'تقييم Vezeeta',
      meta: '226 تقييم',
      href: 'https://www.vezeeta.com/en/dr/Doctor-Adel-yosery-abd-elaziz-Dentistry',
    },
    {
      value: '300',
      label: 'سعر الكشف',
      meta: 'جنيه مصري',
      href: '/appointments',
    },
    {
      value: '8',
      label: 'تخصصات',
      meta: 'تحت سقف واحد',
      href: '/services',
    },
  ] as const,
  services: [
    {
      title: 'Full Arch',
      titleAr: 'تركيبات الفك الكامل',
      description: 'إعادة بناء الفك الكامل لاستعادة الوظيفة والشكل والتناسق.',
      image: '/assets/new/ig-full-arch.jpg',
      imageAlt: 'ابتسامة كاملة بعد إعادة تأهيل الفك',
    },
    {
      title: 'Veneers & Smile Design',
      titleAr: 'فينير وتصميم ابتسامة',
      description: 'تنسيق الشكل واللون والشفافية بما يناسب ملامح الوجه.',
      image: '/assets/new/ig-veneers-detail.jpg',
      imageAlt: 'تفاصيل طبقات الفينير والشفافية الطبيعية',
    },
    {
      title: 'Implants',
      titleAr: 'زراعة الأسنان',
      description: 'تعويض الأسنان المفقودة بدعامات ثابتة ونتيجة وظيفية.',
    },
    {
      title: 'Root Canal',
      titleAr: 'علاج الجذور',
      description: 'علاج العصب بدقة مع الحفاظ على السن وتقليل الانزعاج.',
    },
    {
      title: 'Orthodontics',
      titleAr: 'تقويم الأسنان',
      description: 'ترتيب الأسنان وتحسين الإطباق والمسافات بين الأسنان.',
    },
    {
      title: 'Periodontics',
      titleAr: 'علاج اللثة',
      description: 'رعاية اللثة والتحكم في النزيف والالتهاب.',
    },
    {
      title: 'Pediatric',
      titleAr: 'أسنان الأطفال',
      description: 'رعاية وعلاج أسنان الأطفال بتجربة أهدأ.',
    },
    {
      title: 'Prosthodontics',
      titleAr: 'التركيبات',
      description: 'تعويضات ثابتة ومتحركة لاستعادة وظيفة الفم وشكله.',
    },
  ] satisfies Service[],
  results: [
    {
      image: '/assets/new/ig-transformation.jpg',
      alt: 'قبل وبعد إعادة بناء ابتسامة كاملة',
      title: 'Full smile reconstruction',
      titleAr: 'إعادة بناء ابتسامة كاملة',
      tag: 'Full Arch',
    },
    {
      image: '/assets/new/ig-smile-architecture.jpg',
      alt: 'قبل وبعد علاج وتجميل الأسنان الأمامية',
      title: 'Anterior smile makeover',
      titleAr: 'تجميل الأسنان الأمامية',
      tag: 'Veneers',
    },
    {
      image: '/assets/new/ig-smile-line.jpg',
      alt: 'قبل وبعد تصميم ابتسامة متناسقة مع الوجه',
      title: 'Smile design',
      titleAr: 'تصميم ابتسامة',
      tag: 'Smile Design',
    },
    {
      image: '/assets/result-missing-teeth.jpg',
      alt: 'تعويض أسنان مفقودة بدعامات زراعة',
      title: 'Implant restoration',
      titleAr: 'تعويض الأسنان المفقودة',
      tag: 'Implants',
    },
  ] satisfies ResultItem[],
  reviews: [
    {
      quote:
        'بصراحه ممتاز وزوق جدا وبيهتم بالمريض وبيشرح حلو جدا ويبدي من وقته كتير ومفيش انتظار والعياده نضيفه',
      author: 'Btol A.',
      meta: 'تقييم 5/5 · Vezeeta',
      source: 'Vezeeta',
      sourceUrl:
        'https://www.vezeeta.com/en/dr/Doctor-Adel-yosery-abd-elaziz-Dentistry',
    },
    {
      quote:
        'Dr. Adel Yousry is an excellent dentist and a true professional. He is knowledgeable, caring, and patient-friendly. He explains the treatment clearly and makes you feel comfortable.',
      author: 'Johirul Islam Azhari',
      meta: 'تقييم 5/5 · Google',
      source: 'Google',
      sourceUrl:
        'https://www.google.com/maps/place/Dr+Adel+Yousry+%7C+%D8%AF.%D8%B9%D8%A7%D8%AF%D9%84+%D9%8A%D8%B3%D8%B1%D9%8A%E2%80%AD/@30.1007519,31.3424207,17z/data=!3m1!4b1!4m6!3m5!1s0x1458150e2e98c113:0x88b184d1300b38d4!8m2!3d30.1007519!4d31.3424207!16s%2Fg%2F11h1m5c3w2?entry=ttu',
    },
    {
      quote:
        'Highly recommended! Dr Adel is very skilled, honest, and professional. He takes the time to explain everything and takes away the anxiety usually associated with dentist visits.',
      author: 'Samar Farouk',
      meta: 'تقييم 5/5 · Google',
      source: 'Google',
      sourceUrl:
        'https://www.google.com/maps/place/Dr+Adel+Yousry+%7C+%D8%AF.%D8%B9%D8%A7%D8%AF%D9%84+%D9%8A%D8%B3%D8%B1%D9%8A%E2%80%AD/@30.1007519,31.3424207,17z/data=!3m1!4b1!4m6!3m5!1s0x1458150e2e98c113:0x88b184d1300b38d4!8m2!3d30.1007519!4d31.3424207!16s%2Fg%2F11h1m5c3w2?entry=ttu',
    },
    {
      quote:
        'من أفضل الأطباء اللي رحت لهم. محترف وشاطر، وكنت بخاف من dentists بس عمري ما حسيت بألم معاه.',
      author: 'Hanin Salim',
      meta: 'تقييم 5/5 · Google',
      source: 'Google',
      sourceUrl:
        'https://www.google.com/maps/place/Dr+Adel+Yousry+%7C+%D8%AF.%D8%B9%D8%A7%D8%AF%D9%84+%D9%8A%D8%B3%D8%B1%D9%8A%E2%80%AD/@30.1007519,31.3424207,17z/data=!3m1!4b1!4m6!3m5!1s0x1458150e2e98c113:0x88b184d1300b38d4!8m2!3d30.1007519!4d31.3424207!16s%2Fg%2F11h1m5c3w2?entry=ttu',
    },
  ] satisfies Review[],
  credentials: [
    {
      text: 'عضو الجمعية الأمريكية لطب الأسنان التجميلي — ويسكونسن، الولايات المتحدة',
      accent: 'cyan',
    },
    {
      text: 'عضو الجمعية المصرية لزراعة الأسنان والليزر',
      accent: 'red',
    },
    {
      text: 'أخصائي طب وجراحة الفم والأسنان',
      accent: 'white',
    },
  ] satisfies Credential[],
  bio: 'أخصائي طب وجراحة الفم والأسنان، متخصص في تجميل الأسنان وعلاج الجذور والزراعة. يقدم في العيادة خدمات تشمل الفينير وتصميم الابتسامة، الزراعة، التركيبات، علاج اللثة، التقويم، وأسنان الأطفال. عضو الجمعية الأمريكية لطب الأسنان التجميلي (ويسكونسن – الولايات المتحدة) والجمعية المصرية لزراعة الأسنان والليزر.',
  philosophy:
    'الابتسامة مش سن واحد. بنبدأ بالتشخيص، بنشرح الخطة، وبنصمم شكل ولون وترتيب الأسنان بما يناسب ملامحك.',
  approach: [
    {
      number: '01',
      title: 'نسمع ونشخّص',
      text: 'نفهم المشكلة والهدف قبل أي إجراء.',
    },
    {
      number: '02',
      title: 'نخطط الشكل',
      text: 'نحدد الشكل واللون والترتيب المناسب لملامحك.',
    },
    {
      number: '03',
      title: 'ننفّذ ونطمن',
      text: 'خطوات واضحة وشرح قبل كل مرحلة.',
    },
  ] as const,
  instagramPosts: [
    {
      href: 'https://www.instagram.com/dr.adelyousry/p/DaihyTlDvOa/',
      image: '/assets/new/ig-full-arch.jpg',
      alt: 'حالة Full Arch من حساب الدكتور عادل يسري',
      label: 'Full Arch',
    },
    {
      href: 'https://www.instagram.com/dr.adelyousry/p/DaIx2FljeN4/',
      image: '/assets/new/ig-smile-close.jpg',
      alt: 'تصميم ابتسامة متناسق مع ملامح الوجه',
      label: 'Smile design',
    },
    {
      href: 'https://www.instagram.com/dr.adelyousry/p/DZ2wS02jzer/',
      image: '/assets/new/ig-veneers-detail.jpg',
      alt: 'تفاصيل الفينير والشفافية الطبيعية',
      label: 'Veneers',
    },
    {
      href: 'https://www.instagram.com/dr.adelyousry/p/DZxmsYqjZW2/',
      image: '/assets/new/ig-smile-shape.jpg',
      alt: 'اختيار شكل الفينير المناسب',
      label: 'Smile shape',
    },
    {
      href: 'https://www.instagram.com/dr.adelyousry/p/DZsdLsSiZo_/',
      image: '/assets/new/ig-smile-line.jpg',
      alt: 'قبل وبعد تجميل الابتسامة',
      label: 'Before / after',
    },
    {
      href: 'https://www.instagram.com/dr.adelyousry/p/DZnTmTUmLw9/',
      image: '/assets/new/ig-smile-architecture.jpg',
      alt: 'قبل وبعد علاج وتجميل الأسنان',
      label: 'Case study',
    },
  ] satisfies SocialPost[],
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/dr.adelyousry/' },
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/p/Dr-Adel-Yousry-61563860608616/',
    },
    {
      label: 'Google Maps',
      href: 'https://www.google.com/maps/place/Dr+Adel+Yousry+%7C+%D8%AF.%D8%B9%D8%A7%D8%AF%D9%84+%D9%8A%D8%B3%D8%B1%D9%8A%E2%80%AD/@30.1007519,31.3424207,17z/data=!3m1!4b1!4m6!3m5!1s0x1458150e2e98c113:0x88b184d1300b38d4!8m2!3d30.1007519!4d31.3424207!16s%2Fg%2F11h1m5c3w2?entry=ttu',
    },

  ] as const,
} as const;
