import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import CtaBand from '@/components/CtaBand';
import { site } from '@/data/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'عن الدكتور',
  description:
    'الدكتور عادل يسري، أخصائي تجميل الأسنان وعلاج الجذور وجراحة الفم والأسنان في مصر الجديدة. تعرّف على الخبرة وطريقة العمل.',
};

function accentClass(accent: 'cyan' | 'red' | 'white') {
  if (accent === 'cyan') return styles.cyan;
  if (accent === 'red') return styles.red;
  return styles.white;
}

export default function AboutPage() {
  return (
    <>
      <section className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>The doctor</p>

          <div className={styles.grid}>
            <div className={styles.media}>
              <div className={styles.imageWrap}>
                <Image
                  src="/assets/dr-adel-yousry.jpg"
                  alt="الدكتور عادل يسري، أخصائي تجميل الأسنان"
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 520px"
                  className={styles.image}
                />
              </div>
              <div className={styles.imageBadge}>
                <b className="fontAnton">5.0</b>
                <span>Google &amp; Vezeeta</span>
              </div>
            </div>

            <div className={styles.content}>
              <p className={`${styles.script} fontScript`}>Dr. Adel Yousry</p>
              <h1 className={styles.name}>{site.nameAr}</h1>
              <p className={styles.specialty}>{site.specialty}</p>

              <p className={styles.bio}>{site.bio}</p>

              <div className={styles.credentials}>
                {site.credentials.map((credential) => (
                  <div
                    key={credential.text}
                    className={`${styles.credential} ${accentClass(
                      credential.accent
                    )}`}
                  >
                    {credential.text}
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <a
                  href={site.vezeeta}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primary}
                >
                  احجز على Vezeeta
                </a>
                <Link href="/results" className={styles.secondary}>
                  شاهد الحالات <span aria-hidden="true">←</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.approach}>
        <div className={styles.inner}>
          <div className={styles.approachGrid}>
            <div>
              <p className={styles.eyebrow}>The approach</p>
              <h2 className={styles.approachTitle}>بنشتغل إزاي؟</h2>
              <blockquote className={styles.philosophy}>
                {site.philosophy}
              </blockquote>
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
            </div>
          </div>
        </div>
      </section>

      <section className={styles.editorial}>
        <div className={styles.editorialInner}>
          <figure className={styles.editorialFigure}>
            <div className={styles.editorialImage}>
              <Image
                src="/assets/new/ig-smile-close.jpg"
                alt="تحليل ابتسامة على ملامح الوجه من حساب الدكتور عادل يسري"
                fill
                sizes="(max-width: 900px) 100vw, 540px"
                className={styles.image}
              />
            </div>
          </figure>

          <div className={styles.editorialCopy}>
            <p className={styles.eyebrow}>Every smile is unique</p>
            <h2>كل ابتسامة ليها خطها</h2>
            <p>
              شكل الوجه، وخط الشفايف، ونسبة الأسنان الظاهرة — كلها بتدخل في
              التصميم. الهدف مش ابتسامة متكررة، لكن ابتسامة متناسقة مع ملامحك.
            </p>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              تابع الحالات على إنستغرام <span aria-hidden="true">←</span>
            </a>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
