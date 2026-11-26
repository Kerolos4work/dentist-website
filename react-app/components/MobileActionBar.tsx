import Link from 'next/link';
import { site } from '@/data/site';
import styles from './MobileActionBar.module.css';

export default function MobileActionBar() {
  return (
    <div className={styles.bar} aria-label="إجراءات سريعة">
      <a href={site.phoneHref} className={styles.item}>
        اتصال
      </a>
      <a
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.item}
      >
        واتساب
      </a>
      <Link href="/appointments" className={`${styles.item} ${styles.accent}`}>
        احجز
      </Link>
    </div>
  );
}
