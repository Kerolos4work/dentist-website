import type { Metadata } from 'next';
import CtaBand from '@/components/CtaBand';
import ResultCard from '@/components/ResultCard';
import ReviewCard from '@/components/ReviewCard';
import { site } from '@/data/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'النتائج',
  description:
    'حالات قبل وبعد من عيادة د. عادل يسري: إعادة بناء الابتسامة، الفينير، تصميم الابتسامة، وزراعة الأسنان — بموافقة المرضى.',
};

export default function ResultsPage() {
  return (
    <>
      <section className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Results</p>

          <div className={styles.head}>
            <h1 className={styles.title}>
              النتيجة تبان
              <span>في التفاصيل</span>
            </h1>
            <div className={styles.headSide}>
              <p className={styles.lead}>
                حالات حقيقية من العيادة، قبل وبعد. الصور منشورة بموافقة
                المرضى، والنتائج تختلف من حالة لأخرى.
              </p>
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                المزيد على إنستغرام <span aria-hidden="true">←</span>
              </a>
            </div>
          </div>

          <div className={styles.grid}>
            {site.results.map((result, index) => (
              <ResultCard
                key={result.title}
                {...result}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.feedback}>
        <div className={styles.feedbackInner}>
          <div className={styles.feedbackHead}>
            <div>
              <p className={styles.eyebrow}>Patient words</p>
              <h2 className={styles.feedbackTitle}>آراء موثّقة من المرضى</h2>
            </div>
            <div className={styles.ratingLinks}>
              <a
                href={site.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
              >
                Google <b>{site.googleRating}</b> ·{' '}
                <span>{site.googleReviewCount}</span>
              </a>
              <a
                href={site.vezeeta}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
              >
                Vezeeta <b>{site.vezeetaRating}</b> ·{' '}
                <span>{site.vezeetaReviewCount}</span>
              </a>
            </div>
          </div>

          <div className={styles.reviewsGrid}>
            {site.reviews.slice(0, 3).map((review) => (
              <ReviewCard key={review.author} {...review} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
