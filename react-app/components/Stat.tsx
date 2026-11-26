import styles from './Stat.module.css';

type Props = {
  value: string;
  label: string;
  meta: string;
  href: string;
};

export default function Stat({ value, label, meta, href }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.stat}
    >
      <span className={`${styles.value} fontAnton`}>{value}</span>
      <span className={styles.text}>
        <b>{label}</b>
        <span>{meta}</span>
      </span>
    </a>
  );
}
