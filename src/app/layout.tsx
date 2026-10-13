// src/app/layout.tsx
import "@/styles/global.scss";
import { Inter } from "next/font/google";
import Header from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });
export const metadata = {
  title: "medical.ge",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" className={inter.className}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
