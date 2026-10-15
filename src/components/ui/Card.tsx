import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.scss';

// ბარათი ჩვეულებრივ HTML ატრიბუტებსაც იღებს (className, onClick და ა.შ.)
type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

// საერთო ბარათი: თეთრი ფონი, ჩარჩო და ჩრდილი. დამატებითი className
// საერთო სტილს ემატება
export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <article className={`${styles.card} ${className}`.trim()} {...props}>
      {children}
    </article>
  );
}
