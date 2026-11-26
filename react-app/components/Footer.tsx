import Link from 'next/link';
import { site } from '@/data/site';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.kicker}>{site.tagline}</p>
          <p className={styles.wordmark}>{site.nameAr}</p>
          <p className={`${styles.script} fontScript`}>Dr. Adel Yousry</p>
          <p className={styles.blurb}>
            {site.clinicNameAr} · تجميل الأسنان وتصميم الابتسامة في مصر
            الجديدة.
          </p>
        </div>

        <div className={styles.visit}>
          <p className={styles.label}>زيارة</p>
          <p>{site.address}</p>
          <a href={site.phoneHref} dir="ltr" className={styles.phone}>
            {site.phoneDisplay}
          </a>
          <p className={styles.note}>{site.hours}</p>
        </div>

        <div className={styles.links}>
          <p className={styles.label}>روابط</p>
          {site.nav.slice(1).map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/appointments">حجز موعد</Link>
          <Link href="/my-appointments">مواعيدي</Link>
        </div>

        <div className={styles.socials}>
          <p className={styles.label}>تابع</p>
          {site.socials.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© 2026 د. عادل يسري. جميع الحقوق محفوظة.</p>
        <p dir="ltr">Google 5.0 · Vezeeta 5.0 · Heliopolis, Cairo</p>
      </div>
    </footer>
  );
}
