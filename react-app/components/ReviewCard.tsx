import type { Review } from '@/data/site';
import styles from './ReviewCard.module.css';

type Props = Review & {
  featured?: boolean;
};

export default function ReviewCard({
  quote,
  author,
  meta,
  source,
  sourceUrl,
  featured = false,
}: Props) {
  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.top}>
        <span
          className={`${styles.source} ${
            source === 'Google' ? styles.google : styles.vezeeta
          }`}
        >
          {source}
        </span>
        <span className={styles.stars} aria-label="5 من 5">
          ★★★★★
        </span>
      </div>

      <blockquote dir="auto" className={styles.quote}>
        {quote}
      </blockquote>

      <footer className={styles.footer}>
        <div>
          <b>{author}</b>
          <span>{meta}</span>
        </div>
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
          اقرأ التقييم
        </a>
      </footer>
    </article>
  );
}
