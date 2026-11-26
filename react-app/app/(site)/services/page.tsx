import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import CtaBand from '@/components/CtaBand';
import ServiceRow from '@/components/ServiceRow';
import { site } from '@/data/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'الخدمات',
  description:
    'خدمات الأسنان في عيادة د. عادل يسري: تركيبات الفك الكامل، الفينير وتصميم الابتسامة، الزراعة، علاج الجذور، التقويم، اللثة، أسنان الأطفال، والتركيبات.',
};

export default function ServicesPage() {
  return (
    <>
      <section className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Services</p>

          <div className={styles.head}>
            <h1 className={styles.title}>
              كل ما تحتاجه
              <span>تحت سقف واحد</span>
            </h1>

            <div className={styles.headSide}>
              <p className={styles.lead}>
                ثماني تخصصات في مكان واحد، بشرح واضح لكل خطوة قبل البدء. سعر
                الكشف {site.fee}. احجز الوقت المناسب من الموقع.
              </p>

              <div className={styles.feeCard}>
                <span className={styles.feeLabel}>سعر الكشف</span>
                <b className={styles.feeValue}>{site.fee}</b>
                <Link href="/appointments" className={styles.feeLink}>
                  احجز موعد <span aria-hidden="true">←</span>
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.rows}>
            {site.services.map((service) => (
              <ServiceRow key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.spotlight}>
        <div className={styles.spotlightInner}>
          <div className={styles.spotlightCopy}>
            <p className={styles.eyebrow}>Veneers &amp; smile design</p>
            <h2>التفاصيل هي الفرق</h2>
            <p>
              اختيار شكل السن، ودرجة الشفافية، وطريقة انعكاس الضوء، كلها قرارات
              بتتحدد قبل التنفيذ. بنشرح الخيارات ونوضح الفرق قبل ما نبدأ.
            </p>
            <Link href="/results" className={styles.link}>
              شاهد الحالات <span aria-hidden="true">←</span>
            </Link>
          </div>

          <div className={styles.spotlightImages}>
            <figure className={styles.spotlightFigure}>
              <div className={styles.spotlightImage}>
                <Image
                  src="/assets/new/ig-veneers-detail.jpg"
                  alt="تفاصيل سطح الفينير: الشفافية والانعكاسات"
                  fill
                  sizes="(max-width: 900px) 100vw, 420px"
                  className={styles.cover}
                />
              </div>
              <figcaption>الشفافية والانعكاسات على سطح الفينير.</figcaption>
            </figure>

            <figure className={styles.spotlightFigure}>
              <div className={styles.spotlightImage}>
                <Image
                  src="/assets/new/ig-smile-shape.jpg"
                  alt="أشكال مختلفة من الفينير لاختيار ما يناسب الوجه"
                  fill
                  sizes="(max-width: 900px) 100vw, 420px"
                  className={styles.cover}
                />
              </div>
              <figcaption>أشكال مختلفة، والاختيار حسب ملامح الوجه.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
