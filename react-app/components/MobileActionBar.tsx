import Link from 'next/link';
import { site } from '@/data/site';
import styles from './MobileActionBar.module.css';

export default function MobileActionBar() {
  return (
    <div className={styles.bar} aria-label="إجراءات سريعة">
      <a href={site.phoneHref} className={styles.item}>
        اتصال
      </a>
      <Link href="/my-appointments" className={styles.item}>
        مواعيدي
      </Link>
      <Link href="/appointments" className={`${styles.item} ${styles.accent}`}>
        احجز
      </Link>
    </div>
  );
}
