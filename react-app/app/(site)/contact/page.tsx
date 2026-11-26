import type { Metadata } from 'next';
import { site } from '@/data/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'تواصل',
  description:
    'عنوان عيادة د. عادل يسري: 60 شارع نخلة المطيعي، ميدان تريومف، مصر الجديدة. احجز عبر Vezeeta أو اتصل بالعيادة.',
};

export default function ContactPage() {
  return (
    <section className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Visit</p>

        <div className={styles.head}>
          <h1 className={styles.title}>
            العيادة في قلب
            <span>مصر الجديدة</span>
          </h1>
          <p className={styles.lead}>
            {site.clinicName} — فوق محل فلورينا، ميدان تريومف. الحجز متاح على
            Vezeeta أو بالاتصال المباشر.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.details}>
            <div className={styles.block}>
              <span className={styles.label}>العنوان</span>
              <p className={styles.address}>{site.address}</p>
            </div>

            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt>الهاتف</dt>
                <dd>
                  <a href={site.phoneHref} dir="ltr">
                    {site.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div className={styles.fact}>
                <dt>المواعيد</dt>
                <dd>
                  {site.hours}
                  <a
                    href={site.googleMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.inlineLink}
                  >
                    راجع مواعيد اليوم ↗
                  </a>
                </dd>
              </div>
              <div className={styles.fact}>
                <dt>سعر الكشف</dt>
                <dd>{site.fee} — {site.feeNote}</dd>
              </div>
              <div className={styles.fact}>
                <dt>العيادة</dt>
                <dd>{site.clinicName}</dd>
              </div>
            </dl>

            <div className={styles.booking}>
              <a
                href={site.vezeeta}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.bookingCard}
              >
                <b>احجز على Vezeeta</b>
                <small>اختيار موعد متاح أونلاين</small>
              </a>
              <a href={site.phoneHref} className={styles.bookingCard}>
                <b>اتصل بالعيادة</b>
                <small dir="ltr">{site.phoneDisplay}</small>
              </a>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.bookingCard}
              >
                <b>واتساب</b>
                <small>رسالة سريعة لتأكيد الموعد</small>
              </a>
            </div>

            <div className={styles.beforeVisit}>
              <b>قبل الزيارة</b>
              <ul>
                <li>احجز الموعد مسبقًا لتقليل الانتظار.</li>
                <li>أحضر أي أشعة أو تحاليل سابقة إن وجدت.</li>
                <li>أبلغنا بأي أدوية أو حساسية قبل بدء العلاج.</li>
              </ul>
            </div>
          </div>

          <div className={styles.mapColumn}>
            <div className={styles.mapWrap}>
              <iframe
                title="موقع عيادة الدكتور عادل يسري على خرائط جوجل"
                src={site.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className={styles.mapActions}>
              <a
                href={site.mapsDirections}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primary}
              >
                افتح الاتجاهات
              </a>
              <a
                href={site.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondary}
              >
                صفحة العيادة على Google
              </a>
            </div>

            <div className={styles.socials}>
              <span className={styles.label}>تابع</span>
              {site.socials.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
