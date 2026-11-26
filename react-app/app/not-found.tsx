import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileActionBar from '@/components/MobileActionBar';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <section className={styles.wrap}>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>الصفحة غير موجودة</h1>
          <p className={styles.text}>لم نعثر على الصفحة المطلوبة.</p>
          <Link href="/" className={styles.link}>
            العودة إلى الرئيسية
          </Link>
        </section>
      </main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
