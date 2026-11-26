import Image from 'next/image';
import type { ResultItem } from '@/data/site';
import styles from './ResultCard.module.css';

type Props = ResultItem & {
  wide?: boolean;
  priority?: boolean;
};

export default function ResultCard({
  image,
  alt,
  title,
  titleAr,
  tag,
  wide = false,
  priority = false,
}: Props) {
  return (
    <article className={`${styles.card} ${wide ? styles.wide : ''}`}>
      <div className={styles.imageWrap}>
        <Image
          src={image}
          alt={alt}
          fill
          sizes={
            wide
              ? '(max-width: 768px) 100vw, 760px'
              : '(max-width: 768px) 100vw, 420px'
          }
          className={styles.image}
          priority={priority}
        />
        <span className={styles.tag}>{tag}</span>
      </div>
      <div className={styles.caption}>
        <h3>{titleAr}</h3>
        <p dir="ltr">{title}</p>
      </div>
    </article>
  );
}
