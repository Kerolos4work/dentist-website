import Image from 'next/image';
import Link from 'next/link';
import CtaBand from '@/components/CtaBand';
import InstagramRail from '@/components/InstagramRail';
import ResultCard from '@/components/ResultCard';
import ReviewCard from '@/components/ReviewCard';
import SmileArc from '@/components/SmileArc';
import Stat from '@/components/Stat';
import { site } from '@/data/site';
import styles from './page.module.css';

export default function HomePage() {
  const listedReview = site.reviews[0];
  const sideReviews = [site.reviews[1], site.reviews[2], site.reviews[3]];

  return (
    <>
      <section className={styles.hero}>
        <SmileArc className={styles.heroArc} />

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowRule} aria-hidden="true" />
              {site.clinicName} · مصر الجديدة
            </p>

            <h1 className={styles.heroTitle}>
              <span className={styles.heroFirst}>ابتسامة</span>
              <span className={styles.heroAccent}>تُصمَّم</span>
              <span className={styles.heroFine}>على مقاس وجهك</span>
            </h1>

            <p className={styles.heroLead}>
              فينير، زراعة، وتصميم ابتسامة داخل {site.clinicNameAr}. كل خطة
              تبدأ بتشخيص واضح، وشرح لكل خطوة قبل تنفيذها.
            </p>

            <div className={styles.heroActions}>
              <Link href="/appointments" className={styles.primary}>
                احجز موعد
              </Link>
              <Link href="/results" className={styles.secondary}>
                شاهد الحالات
                <span aria-hidden="true">←</span>
              </Link>
            </div>

            <ul className={styles.heroFacts}>
              <li>
                <b>{site.fee}</b>
                <span>{site.feeNote}</span>
              </li>
              <li>
                <b>{site.googleRating}</b>
                <span>Google · {site.googleReviewCount} تقييم</span>
              </li>
              <li>
                <b>8</b>
                <span>تخصصات تحت سقف واحد</span>
              </li>
            </ul>
          </div>

          <div className={styles.heroMedia}>
            <div className={styles.heroImage}>
              <Image
                src="/assets/dr-adel-yousry.jpg"
                alt="الدكتور عادل يسري في عيادة تريمف رويال دنتال كلينك"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 560px"
                className={styles.cover}
              />
              <span className={styles.heroImageLabel} dir="ltr">
                Dr. Adel Yousry
              </span>
            </div>

            <div className={styles.heroBadge}>
              <span className={`${styles.badgeValue} fontAnton`}>5.0</span>
              <span>
                <b>Google + Vezeeta</b>
                <small>{site.googleReviewCount} + {site.vezeetaReviewCount} تقييم</small>
              </span>
            </div>

            <p className={styles.heroCaption}>
              <span>{site.addressShort}</span>
              <a
                href={site.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
              >
                الاتجاهات ↗
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className={styles.proof} aria-label="أرقام موثّقة">
        <div className={styles.proofInner}>
          {site.proof.map((item) => (
            <Stat key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className={styles.casesSection}>
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>
                <span className={styles.eyebrowRule} aria-hidden="true" />
                Selected cases
              </p>
              <h2 className={styles.sectionTitle}>
                حالات قبل وبعد، <em>بموافقة المرضى</em>
              </h2>
            </div>
            <Link href="/results" className={styles.textLink}>
              كل الحالات <span aria-hidden="true">←</span>
            </Link>
          </div>

          <div className={styles.casesGrid}>
            {site.results.slice(0, 3).map((result, index) => (
              <ResultCard
                key={result.title}
                {...result}
                wide={index === 0}
              />
            ))}
          </div>

          <p className={styles.disclaimer}>
            النتائج تختلف من حالة لأخرى، والصور المنشورة بموافقة المرضى.
          </p>
        </div>
      </section>

      <section className={styles.approachSection}>
        <div className={styles.section}>
          <div className={styles.approachGrid}>
            <div className={styles.approachCopy}>
              <p className={styles.eyebrow}>
                <span className={styles.eyebrowRule} aria-hidden="true" />
                The approach
              </p>
              <h2 className={styles.sectionTitle}>
                الابتسامة تبدأ بخطة، <em>مش بإجراء</em>
              </h2>
              <blockquote className={styles.philosophy}>
                {site.philosophy}
              </blockquote>
              <p className={styles.approachNote}>
                التشخيص أولًا، ثم تصميم يناسب ملامحك، ثم تنفيذ بخطوات واضحة
                وشرح قبل كل مرحلة.
              </p>
              <Link href="/about" className={styles.textLink}>
                تعرّف على الدكتور <span aria-hidden="true">←</span>
              </Link>
            </div>

            <div className={styles.steps}>
              {site.approach.map((step) => (
                <article key={step.number} className={styles.step}>
                  <span className={`${styles.stepNumber} fontAnton`}>
                    {step.number}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}

              <figure className={styles.detailFigure}>
                <div className={styles.detailImage}>
                  <Image
                    src="/assets/new/ig-veneers-detail.jpg"
                    alt="تفاصيل سطح الفينير: الشفافية والانعكاسات وحدود السن"
                    fill
                    sizes="(max-width: 900px) 100vw, 560px"
                    className={styles.cover}
                  />
                </div>
                <figcaption>
                  الفينير الجيد يُقرأ في تفاصيله: الشفافية، والانعكاسات،
                  وحدود السن.
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.servicesSection}>
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>
                <span className={styles.eyebrowRule} aria-hidden="true" />
                Services
              </p>
              <h2 className={styles.sectionTitle}>
                كل ما تحتاجه <em>تحت سقف واحد</em>
              </h2>
            </div>
            <Link href="/services" className={styles.textLink}>
              كل الخدمات <span aria-hidden="true">←</span>
            </Link>
          </div>

          <div className={styles.servicesGrid}>
            <div className={styles.serviceList}>
              {site.services.slice(0, 5).map((service, index) => (
                <Link
                  key={service.title}
                  href="/services"
                  className={styles.serviceRow}
                >
                  <span className={`${styles.serviceIndex} fontAnton`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.serviceName}>
                    <b>{service.titleAr}</b>
                    <small dir="ltr">{service.title}</small>
                  </span>
                  <span className={styles.serviceArrow} aria-hidden="true">
                    ←
                  </span>
                </Link>
              ))}
              <Link href="/services" className={styles.allServices}>
                الخدمات الثمانية كاملة <span aria-hidden="true">←</span>
              </Link>
            </div>

            <figure className={styles.serviceFigure}>
              <div className={styles.serviceImage}>
                <Image
                  src="/assets/new/ig-smile-shape.jpg"
                  alt="أشكال مختلفة من الفينير لاختيار ما يناسب ملامح الوجه"
                  fill
                  sizes="(max-width: 900px) 100vw, 460px"
                  className={styles.cover}
                />
              </div>
              <figcaption>
                نختار شكل وحجم الفينير بما يناسب ملامح الوجه، مش بمقاس واحد
                للجميع.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={styles.reviewsSection}>
        <div className={styles.section}>
          <div className={styles.reviewHead}>
            <div>
              <p className={styles.eyebrow}>
                <span className={styles.eyebrowRule} aria-hidden="true" />
                Patient words
              </p>
              <h2 className={styles.sectionTitle}>
                الكلام من المرضى، <em>مش مننا</em>
              </h2>
            </div>

            <div className={styles.ratingLinks}>
              <a
                href={site.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
              >
                Google <b>{site.googleRating}</b> ·{' '}
                <span>{site.googleReviewCount}</span>
              </a>
              <a
                href={site.vezeeta}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
              >
                Vezeeta <b>{site.vezeetaRating}</b> ·{' '}
                <span>{site.vezeetaReviewCount}</span>
              </a>
            </div>
          </div>

          <div className={styles.reviewsGrid}>
            <ReviewCard {...listedReview} featured />

            <div className={styles.reviewList}>
              {sideReviews.map((review) => (
                <ReviewCard key={review.author} {...review} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.instagramSection}>
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>
                <span className={styles.eyebrowRule} aria-hidden="true" />
                @dr.adelyousry
              </p>
              <h2 className={styles.sectionTitle}>
                من داخل العيادة <em>وغرفة العلاج</em>
              </h2>
            </div>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.textLink}
            >
              تابع على إنستغرام <span aria-hidden="true">←</span>
            </a>
          </div>

          <InstagramRail />

          <p className={styles.disclaimer}>
            صور من حساب الدكتور عادل يسري على إنستغرام — {site.instagramPostsCount}{' '}
            منشورًا.
          </p>
        </div>
      </section>

      <section className={styles.locationSection}>
        <div className={styles.section}>
          <div className={styles.locationGrid}>
            <div className={styles.locationCopy}>
              <p className={styles.eyebrow}>
                <span className={styles.eyebrowRule} aria-hidden="true" />
                Visit us
              </p>
              <h2 className={styles.sectionTitle}>
                ميدان تريومف، <em>مصر الجديدة</em>
              </h2>
              <p className={styles.address}>{site.address}</p>

              <dl className={styles.details}>
                <div className={styles.detail}>
                  <dt>الهاتف</dt>
                  <dd>
                    <a href={site.phoneHref} dir="ltr">
                      {site.phoneDisplay}
                    </a>
                  </dd>
                </div>
                <div className={styles.detail}>
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
                <div className={styles.detail}>
                  <dt>الكشف</dt>
                  <dd>{site.fee} — {site.feeNote}</dd>
                </div>
                <div className={styles.detail}>
                  <dt>العيادة</dt>
                  <dd>{site.clinicName}</dd>
                </div>
              </dl>

              <div className={styles.locationActions}>
                <a
                  href={site.mapsDirections}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primary}
                >
                  الاتجاهات
                </a>
                <Link href="/appointments" className={styles.ghost}>
                  احجز موعد
                </Link>
              </div>
            </div>

            <div className={styles.mapFrame}>
              <iframe
                title="موقع عيادة الدكتور عادل يسري على خرائط جوجل"
                src={site.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
