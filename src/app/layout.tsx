// src/app/layout.tsx
import './global.scss';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka">
      <body>
        {children}
      </body>
    </html>
  );
}