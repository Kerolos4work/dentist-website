import Header from '@/components/Header';
import { site } from '@/data/site';
import styles from './booking.module.css';

export default function BookingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.shell}>
      <Header booking />

      <main id="main" className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>عيادة د. عادل يسري — ميدان تريومف، مصر الجديدة</p>
          <div className={styles.footerLinks}>
            <a href={site.phoneHref} dir="ltr">
              {site.phoneDisplay}
            </a>
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer">
              واتساب
            </a>
            <a href={site.vezeeta} target="_blank" rel="noopener noreferrer">
              فيزيتا
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
