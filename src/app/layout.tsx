// src/app/layout.tsx
import './global.scss';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
export const metadata = {
  title: 'medical.ge',
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" className={inter.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
