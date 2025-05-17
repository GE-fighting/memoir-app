/**
 * Next.js 根布局文件 - 应用的骨架结构
 * 这个文件定义了整个应用的基础HTML结构，所有页面共享此布局
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { Providers } from "@/components/providers";

/**
 * Next.js 字体优化
 * 使用next/font加载并优化字体，自动进行字体子集化、自托管等优化
 * variable属性将字体设置为CSS变量，可在全局使用
 */
const geistSans = Geist({
  variable: "--font-geist-sans", // 定义为CSS变量供全局使用
  subsets: ["latin"],  // 加载字体的子集，减小文件大小
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 页面元数据定义
 * 这些元数据会被用于生成HTML的<head>标签内容
 * 可影响SEO、社交媒体分享等
 */
export const metadata: Metadata = {
  title: "Memoir | 我们的故事",
  description: "纪录你们的爱情故事，珍藏美好回忆",
};

/**
 * 根布局组件
 * 所有页面都将被包裹在这个布局中
 * @param children - 子组件，即各个页面的内容
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 加载外部字体图标库Font Awesome */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 
          使用Providers包装整个应用，提供认证上下文
          然后是LanguageProvider提供语言设置和翻译功能
        */}
        <Providers>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
