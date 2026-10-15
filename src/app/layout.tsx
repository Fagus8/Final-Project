// src/app/layout.tsx
import "@/styles/global.scss";
import { Inter, Noto_Sans_Georgian } from "next/font/google";
import Header from "@/components/layout/Header";

// Inter-ს ქართული ასოები არ აქვს, ამიტომ ქართულისთვის Noto Sans Georgian-ს ვიყენებთ
const georgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-georgian",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-latin" });

export const metadata = {
  // ქვეგვერდის სათაურს ბოლოში საიტის სახელი ემატება: „ექიმები | medical.ge“
  title: { default: "medical.ge", template: "%s | medical.ge" },
  description: "medical.ge — იპოვე ექიმი, აირჩიე კლინიკა და დაჯავშნე ვიზიტი ონლაინ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ka"
      className={`${georgian.variable} ${inter.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
