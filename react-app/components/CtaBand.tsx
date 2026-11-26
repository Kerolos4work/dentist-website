import { site } from '@/data/site';
import SmileArc from './SmileArc';
import styles from './CtaBand.module.css';

export default function CtaBand() {
  return (
    <section className={styles.band} aria-labelledby="booking-title">
      <SmileArc className={styles.arc} />
      <div className={styles.inner}>
        <p className={styles.kicker}>{site.clinicName}</p>
        <h2 id="booking-title" className={styles.title}>
          احجز موعدك مع د. عادل يسري
        </h2>
        <p className={styles.sub}>
          سعر الكشف {site.fee} على Vezeeta، أو اتصل بالعيادة مباشرة.
        </p>

        <div className={styles.actions}>
          <a
            href={site.vezeeta}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primary}
          >
            احجز عبر Vezeeta
          </a>
          <a
            href={site.phoneHref}
            dir="ltr"
            className={styles.secondary}
          >
            {site.phoneDisplay}
          </a>
        </div>

        <p className={styles.note}>{site.addressShort}</p>
      </div>
    </section>
  );
}
