import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "三阶盲拧编码训练器",
  description: "黄顶红前、CE 棱缓冲与 EDM 角缓冲的本地三阶盲拧训练工具。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
