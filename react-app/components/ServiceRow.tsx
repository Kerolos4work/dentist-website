import styles from './ServiceRow.module.css';

type Props = {
  title: string;
  titleAr: string;
  description: string;
};

export default function ServiceRow({
  title,
  titleAr,
  description,
}: Props) {
  return (
    <article className={styles.row}>
      <div className={styles.heading}>
        <span dir="ltr" className={`${styles.title} fontAnton`}>
          {title}
        </span>
        <h3>{titleAr}</h3>
      </div>
      <p>{description}</p>
    </article>
  );
}
