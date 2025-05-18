/**
 * Tailwind CSS 配置文件
 * 此文件控制Tailwind CSS的所有自定义配置，包括:
 * - 内容扫描路径
 * - 主题扩展
 * - 插件配置
 */

/** @type {import('tailwindcss').Config} */
export default {
  // content 配置项定义Tailwind应该在哪些文件中查找类名
  // 这确保了Tailwind只生成你实际使用的样式，减小CSS文件体积
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',  // pages目录下的所有文件
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',  // components目录下的所有文件
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',  // app目录下的所有文件（App Router）
  ],
  
  // theme 配置项用于自定义Tailwind的默认设计系统
  theme: {
    // extend 允许扩展Tailwind默认主题而不是完全替换它
    extend: {
      // 自定义颜色 - 使用CSS变量实现主题切换
      // 这样可以通过改变:root中的CSS变量实现深色模式等切换
      colors: {
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'primary-dark': 'var(--primary-dark)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        dark: 'var(--dark)',
        light: 'var(--light)',
        gray: 'var(--gray)',
        'gray-dark': 'var(--gray-dark)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--info)',
      },
      
      // 自定义阴影效果
      boxShadow: {
        default: 'var(--shadow)',
        dark: 'var(--shadow-dark)',
      },
      
      // 自定义圆角半径
      borderRadius: {
        default: 'var(--border-radius)',
      },
    },
  },
  
  // plugins 配置项允许你注册Tailwind插件
  // 目前未使用任何插件
  plugins: [],
}; 