import Image from 'next/image';
import { site } from '@/data/site';
import styles from './InstagramRail.module.css';

export default function InstagramRail() {
  return (
    <div className={styles.grid}>
      {site.instagramPosts.map((post) => (
        <a
          key={post.href}
          href={post.href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.item}
          aria-label={`${post.label} — فتح المنشور على إنستغرام`}
        >
          <Image
            src={post.image}
            alt={post.alt}
            fill
            sizes="(max-width: 760px) 50vw, 400px"
            className={styles.image}
          />
          <span className={styles.overlay}>
            <span className={styles.label}>{post.label}</span>
            <span className={styles.handle}>@dr.adelyousry</span>
          </span>
        </a>
      ))}
    </div>
  );
}
