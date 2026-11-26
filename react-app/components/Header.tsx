'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { site } from '@/data/site';
import styles from './Header.module.css';

type HeaderProps = {
  booking?: boolean;
};

const bookingNav = [
  { href: '/appointments', label: 'حجز موعد' },
  { href: '/my-appointments', label: 'مواعيدي' },
  { href: '/dashboard', label: 'لوحة التحكم' },
];

export default function Header({ booking = false }: HeaderProps) {
  const pathname = usePathname();
  const navItems = booking ? bookingNav : site.nav;

  return (
    <header className={styles.header}>
      <div className={styles.utility}>
        <div className={styles.utilityInner}>
          <p className={styles.clinic}>
            <span className={styles.dot} aria-hidden="true" />
            {booking ? site.clinicNameAr : site.clinicName} · مصر الجديدة
          </p>

          <div className={styles.utilityLinks}>
            <a
              href={site.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
            >
              <b>5.0</b> {booking ? 'جوجل' : 'Google'} <span>· 100</span>
            </a>
            <a
              href={site.vezeeta}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
            >
              <b>5.0</b> {booking ? 'فيزيتا' : 'Vezeeta'} <span>· 226</span>
            </a>
            <a href={site.phoneHref} dir="ltr" className={styles.phone}>
              {site.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="الرئيسية">
          <img
            src="/assets/86ac98c12abe9f1235d3092397a3df19.png"
            alt={booking ? 'د. عادل يسري' : 'د. عادل يسري – dr.adel yousry'}
            className={styles.logo}
          />
        </Link>

        <nav
          className={styles.nav}
          aria-label={booking ? 'تنقل الحجوزات' : 'التنقل الرئيسي'}
        >
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${
                  active ? styles.active : ''
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <a href={site.phoneHref} className={styles.call}>
            اتصل
          </a>
          <Link href="/appointments" className={styles.cta}>
            احجز موعد
          </Link>
        </div>
      </div>
    </header>
  );
}
