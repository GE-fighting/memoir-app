/**
 * PostCSS配置文件
 * 
 * 本文件配置CSS处理工具链，为项目提供现代CSS功能支持：
 * - postcss-import: 允许在CSS文件中使用@import导入其他CSS
 * - tailwindcss: 处理Tailwind CSS指令和类
 * - autoprefixer: 自动添加CSS浏览器兼容前缀
 * 
 * 在Next.js构建过程中，所有CSS文件会经过这些插件处理，
 * 是Tailwind CSS正常工作的关键配置文件。
 */

export default {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
