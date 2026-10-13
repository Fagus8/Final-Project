import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.scss';

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <article className={`${styles.card} ${className}`.trim()} {...props}>
      {children}
    </article>
  );
}
