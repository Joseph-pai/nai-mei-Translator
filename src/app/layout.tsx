import type { Metadata } from "next";
import { Inter, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "奈美聊天 - Nami Chat",
  description: "中英文口語練習APP，讓您輕鬆提升英語對話能力",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "奈美聊天",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "奈美聊天",
    title: "奈美聊天 - 中英文口語練習",
    description: "友善的AI助手，幫助您練習中英文口語對話",
  },
  twitter: {
    card: "summary",
    title: "奈美聊天",
    description: "中英文口語練習APP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#2C3E50" />
        <link rel="apple-touch-icon" href="/icon/nami_icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon/nami_icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon/nami_icon.png" />
      </head>
      <body
        className={`${inter.variable} ${notoSansTC.variable} font-sans antialiased bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen`}
      >
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {children}
        </div>
      </body>
    </html>
  );
}
