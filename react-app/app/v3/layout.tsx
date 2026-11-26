import Link from 'next/link';
import { site } from '@/data/site';
import styles from './page.module.css';

const anchors = [
  { href: '#hero', label: 'البداية' },
  { href: '#map', label: 'الخريطة' },
  { href: '#cases', label: 'الحالات' },
  { href: '#protocol', label: 'الخطة' },
  { href: '#doctor', label: 'الطبيب' },
  { href: '#notes', label: 'الآراء' },
  { href: '#clinic', label: 'الموقع' },
  { href: '#book', label: 'الحجز' },
] as const;

export default function V3Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.v3}>
      <nav className={styles.nav} aria-label="تنقل صفحة النسخة الثالثة">
        <div className={styles.navInner}>
          <span className={styles.v3Mark} dir="ltr">
            V3
          </span>

          <div className={styles.navLinks}>
            {anchors.map((anchor) => (
              <a key={anchor.href} href={anchor.href}>
                {anchor.label}
              </a>
            ))}
          </div>

          <Link href="/appointments" className={styles.bookingLink}>
            حجز موعد
          </Link>
        </div>
      </nav>

      <main id="main">{children}</main>

      <footer className={styles.v3Footer}>
        <div className={styles.footerInner}>
          <div>
            <p className={styles.footerMark} dir="ltr">
              DR / AY
            </p>
            <p className={styles.footerName}>{site.nameAr}</p>
            <p className={styles.footerMeta}>{site.addressShort}</p>
          </div>

          <div className={styles.footerLinks}>
            <Link href="/appointments">حجز موعد</Link>
            <a href={site.phoneHref} dir="ltr">
              {site.phoneDisplay}
            </a>
            <Link href="/my-appointments">مواعيدي</Link>
            <a
              href={site.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Maps
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
