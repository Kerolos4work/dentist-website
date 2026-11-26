import type { Metadata } from 'next';
import Image from 'next/image';
import { site } from '@/data/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'النسخة الثالثة | مخطط الابتسامة',
  description:
    'مخطط ابتسامة واضح لد. عادل يسري: ثمانية تخصصات، حالات قبل وبعد، آراء المرضى، وموقع العيادة في ميدان تريومف، مصر الجديدة.',
};

export default function V3Page() {
  return (
    <>
      <section id="hero" className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>
              <span>ابتسامة</span>
              <span>بخطة تراها</span>
            </h1>

            <p className={styles.heroLead}>
              من التشخيص إلى اختيار الشكل واللون، كل خطوة تُشرح قبل التنفيذ.
              مخطط واضح لتجميل الأسنان عند د. عادل يسري في{' '}
              {site.clinicNameAr} — مصر الجديدة.
            </p>

            <div className={styles.heroActions}>
              <a
                href={site.vezeeta}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primary}
              >
                احجز الكشف
              </a>
              <a href="#protocol" className={styles.quietLink}>
                استعرض الخطة <span aria-hidden="true">↓</span>
              </a>
            </div>

            <p className={styles.heroLocation}>{site.addressShort}</p>
          </div>

          <figure className={styles.heroFigure}>
            <div className={styles.scanFrame}>
              <Image
                src="/assets/dr-adel-yousry.jpg"
                alt="الدكتور عادل يسري في عيادة تريومف رويال دنتال كلينك"
                fill
                priority
                sizes="(max-width: 920px) 100vw, 480px"
                className={styles.cover}
              />
              <span className={styles.frameId} dir="ltr">
                DR / AY · 001
              </span>
              <span className={styles.frameTick} aria-hidden="true" />
              <span className={styles.frameTickAlt} aria-hidden="true" />
            </div>
            <figcaption>
              <span className={`${styles.script} fontScript`}>
                Dr. Adel Yousry
              </span>
              <span>{site.specialty}</span>
            </figcaption>
          </figure>
        </div>

        <div className={styles.readoutBar} aria-label="بيانات موثقة">
          <a
            href={site.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className={styles.readout}
          >
            <b>{site.googleRating}</b>
            <span>GOOGLE</span>
            <small>{site.googleReviewCount} reviews</small>
          </a>
          <a
            href={site.vezeeta}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className={styles.readout}
          >
            <b>{site.vezeetaRating}</b>
            <span>VEZEETA</span>
            <small>{site.vezeetaReviewCount} visitors</small>
          </a>
          <a
            href={site.vezeeta}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.readout}
          >
            <b dir="ltr">{site.fee}</b>
            <span> الكشف</span>
            <small>{site.feeNote}</small>
          </a>
          <a
            href={site.vezeeta}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.readout}
          >
            <b dir="ltr">31</b>
            <span> دقيقة انتظار</span>
            <small>حسب Vezeeta</small>
          </a>
        </div>
      </section>

      <section id="map" className={styles.section}>
        <div className={styles.shell}>
          <header className={styles.sectionHead}>
            <h2>خريطة العلاج</h2>
            <p dir="ltr">MAP / 08</p>
          </header>

          <p className={styles.sectionLead}>{site.philosophy}</p>

          <div className={styles.mapGrid}>
            {site.services.map((service, index) => (
              <article key={service.title} className={styles.mapTile}>
                <span className={styles.mapNo} dir="ltr">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{service.titleAr}</h3>
                <p>{service.description}</p>
                <span className={styles.mapCode} dir="ltr">
                  {service.title}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cases" className={`${styles.section} ${styles.platesSection}`}>
        <div className={styles.shell}>
          <header className={styles.sectionHead}>
            <h2>لوحات الحالات</h2>
            <p dir="ltr">PLATES / 04</p>
          </header>

          <div className={styles.plateGrid}>
            {site.results.map((result, index) => (
              <figure
                key={result.title}
                className={`${styles.plate} ${
                  index === 0 ? styles.plateWide : ''
                }`}
              >
                <div className={styles.plateMedia}>
                  <Image
                    src={result.image}
                    alt={result.alt}
                    fill
                    sizes={
                      index === 0
                        ? '(max-width: 920px) 100vw, 640px'
                        : '(max-width: 920px) 100vw, 420px'
                    }
                    className={styles.cover}
                  />
                  <span className={styles.reticle} aria-hidden="true" />
                  <span className={styles.plateTag} dir="ltr">
                    {result.tag}
                  </span>
                </div>
                <figcaption>
                  <b>{result.titleAr}</b>
                  <span dir="ltr">{result.title}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className={styles.disclaimer}>
            النتائج تختلف من حالة لأخرى، والصور المنشورة بموافقة المرضى.
          </p>
        </div>
      </section>

      <section id="protocol" className={styles.section}>
        <div className={styles.shell}>
          <header className={styles.sectionHead}>
            <h2>خطة العمل</h2>
            <p dir="ltr">PROTOCOL / 03</p>
          </header>

          <div className={styles.protocolLine}>
            {site.approach.map((step) => (
              <article key={step.number} className={styles.protocolStep}>
                <span className={styles.protocolNo} dir="ltr">
                  {step.number}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="doctor" className={`${styles.section} ${styles.recordSection}`}>
        <div className={styles.shell}>
          <header className={styles.sectionHead}>
            <h2>سجل الطبيب</h2>
            <p dir="ltr">RECORD / 01</p>
          </header>

          <div className={styles.recordLayout}>
            <div className={styles.recordCopy}>
              <p className={styles.recordBio}>{site.bio}</p>

              <ul className={styles.credentialList}>
                {site.credentials.map((credential) => (
                  <li
                    key={credential.text}
                    className={styles[credential.accent]}
                  >
                    <span aria-hidden="true" />
                    {credential.text}
                  </li>
                ))}
              </ul>

              <p className={`${styles.script} ${styles.recordScript}`}>
                Dr. Adel Yousry
              </p>
            </div>

            <figure className={styles.recordFigure}>
              <div className={styles.recordMedia}>
                <Image
                  src="/assets/new/ig-smile-shape.jpg"
                  alt="اختيار شكل الفينير بما يناسب ملامح الوجه"
                  fill
                  sizes="(max-width: 920px) 100vw, 460px"
                  className={styles.cover}
                />
                <span className={styles.recordIndex} dir="ltr">
                  SPECIMEN / 03
                </span>
              </div>
              <figcaption>
                الشكل واللون والشفافية تُختار مع ملامح الوجه، لا كقالب جاهز.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="notes" className={styles.section}>
        <div className={styles.shell}>
          <header className={styles.sectionHead}>
            <h2>ملاحظات المرضى</h2>
            <p dir="ltr">NOTES / 04</p>
          </header>

          <div className={styles.noteGrid}>
            {site.reviews.map((review) => (
              <article key={review.author} className={styles.note}>
                <div className={styles.noteTop}>
                  <span>{review.source}</span>
                  <span dir="ltr">5 / 5</span>
                </div>
                <blockquote dir="auto">{review.quote}</blockquote>
                <footer>
                  <b>{review.author}</b>
                  <span>{review.meta}</span>
                  <a
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    المصدر ↗
                  </a>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="clinic" className={`${styles.section} ${styles.siteSection}`}>
        <div className={styles.shell}>
          <header className={styles.sectionHead}>
            <h2>موقع العيادة</h2>
            <p dir="ltr">SITE / HELIOPOLIS</p>
          </header>

          <div className={styles.siteLayout}>
            <div className={styles.siteCopy}>
              <p className={styles.siteAddress}>{site.address}</p>

              <dl className={styles.siteDetails}>
                <div>
                  <dt>الهاتف</dt>
                  <dd>
                    <a href={site.phoneHref} dir="ltr">
                      {site.phoneDisplay}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>الكشف</dt>
                  <dd dir="ltr">{site.fee}</dd>
                </div>
                <div>
                  <dt>الانتظار</dt>
                  <dd>{site.waitingTime}</dd>
                </div>
                <div>
                  <dt>المواعيد</dt>
                  <dd>
                    {site.hours}
                    <a
                      href={site.googleMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.inlineLink}
                    >
                      {site.hoursNote} ↗
                    </a>
                  </dd>
                </div>
              </dl>

              <div className={styles.siteActions}>
                <a
                  href={site.mapsDirections}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primary}
                >
                  الاتجاهات
                </a>
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.quietLink}
                >
                  واتساب <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <div className={styles.mapPanel}>
              <iframe
                title="موقع عيادة الدكتور عادل يسري على خرائط جوجل"
                src={site.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <span className={styles.mapCoord} dir="ltr">
                30.1007519° N / 31.3424207° E
              </span>
              <span className={styles.mapCross} aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section id="book" className={styles.approval}>
        <div className={styles.shell}>
          <div className={styles.approvalInner}>
            <div>
              <h2>اعتمد خطوتك التالية</h2>
              <p>
                احجز الكشف على Vezeeta، أو اتصل بالعيادة مباشرة في ميدان
                تريومف.
              </p>
            </div>

            <div className={styles.approvalActions}>
              <a
                href={site.vezeeta}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.approvalPrimary}
              >
                احجز الآن
              </a>
              <a href={site.phoneHref} className={styles.approvalGhost} dir="ltr">
                {site.phoneDisplay}
              </a>
            </div>
          </div>

          <span className={styles.approvalStamp} dir="ltr" aria-hidden="true">
            APPROVED
            <br />
            DR / AY
          </span>
        </div>
      </section>
    </>
  );
}
