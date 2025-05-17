# Next.js 回忆录应用

这是一个使用 Next.js 和 Tailwind CSS 开发的回忆录应用。本文档将帮助初学者理解项目结构和关键技术概念。

## 项目技术栈

- **Next.js**: React框架，提供服务端渲染、路由等功能
- **Tailwind CSS**: 实用优先的CSS框架，用于快速构建自定义UI
- **CSS变量**: 用于主题设置和样式一致性

## 项目结构说明

```
src/
  ├── app/            # Next.js 13+ App Router结构
  │   ├── globals.css # 全局样式文件，包含Tailwind和自定义样式
  │   ├── layout.js   # 根布局组件
  │   └── page.js     # 首页组件
  ├── components/     # 可复用UI组件
  └── ...
```

## Tailwind CSS 集成说明

### 1. 基础配置

Tailwind CSS 通过三个主要指令集成到项目中:

```css
@tailwind base;    /* 基础样式重置和规范化 */
@tailwind components; /* 组件类 */
@tailwind utilities;  /* 功能类 */
```

### 2. 自定义组件

在 `globals.css` 中，使用 `@layer components` 定义自定义组件样式：

```css
@layer components {
  .btn-primary {
    /* 样式定义 */
  }
}
```

### 3. 颜色主题

项目使用CSS变量定义颜色主题，支持深色模式自动切换：

```css
:root {
  --primary: #6a7bd9;
  /* 其他颜色变量 */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* 深色模式下的颜色变量覆盖 */
  }
}
```

## 常见问题解决

### "Unknown at rule @tailwind" 警告

这是编辑器提示，不影响功能，可通过以下方式解决：

1. 安装 Tailwind CSS IntelliSense 插件（VSCode）
2. 在设置中添加：`"css.lint.unknownAtRules": "ignore"`

## 学习资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [Tailwind CSS 官方文档](https://tailwindcss.com/docs)
- [Next.js App Router 学习](https://nextjs.org/docs/app)

## 环境配置

### API配置

项目使用环境变量配置后端API地址。请按照以下步骤进行设置：

1. 创建环境变量文件：
   - 本地开发：创建 `.env.local` 文件
   - 生产环境：创建 `.env.production` 文件

2. 配置API地址：
   ```
   # 后端API基础URL
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080  # 开发环境示例
   # 或
   NEXT_PUBLIC_API_BASE_URL=https://api.memoir-app.com  # 生产环境示例
   
   # API前缀
   NEXT_PUBLIC_API_PREFIX=/api/v1
   ```

3. 开发环境：
   - 在开发模式下，Next.js 会自动代理 `/api/v1/*` 路径的请求到 `NEXT_PUBLIC_API_BASE_URL`
   - 这样可以避免跨域问题

4. 生产环境：
   - 在生产环境中，可以通过环境变量指定实际的API地址
   - 或者使用反向代理（如Nginx）来处理API请求转发

参考示例配置可在 `.env-example` 目录中找到。
