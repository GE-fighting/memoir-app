# PM2管理Next.js应用指南

本文档提供了如何使用PM2进程管理器来管理Next.js应用的详细说明。PM2可以帮助您在生产环境中有效地管理Node.js应用程序，提供集群模式、自动重启、日志管理等功能。

## 基础命令

项目中已经在`package.json`中配置了以下PM2相关命令：

```bash
# 以开发环境运行应用
npm run pm2:dev

# 以生产环境运行应用
npm run pm2:prod

# 零停机重载应用（热更新）
npm run pm2:reload

# 停止应用
npm run pm2:stop

# 彻底删除应用
npm run pm2:delete

# 查看应用日志
npm run pm2:logs

# 监控应用状态
npm run pm2:monit

# 生成PM2自启动脚本
npm run pm2:startup

# 保存当前PM2进程列表，用于重启后恢复
npm run pm2:save
```

## 主机绑定和端口配置说明

在项目中，主机绑定和端口配置存在于多个位置，了解它们的优先级和作用非常重要：

### 主机绑定配置

1. **PM2配置（ecosystem.config.js）中的HOST**：
   - 决定Next.js服务器绑定到哪个网络接口
   - 设置为`0.0.0.0`表示绑定到所有网络接口，允许从外部网络访问
   - 设置为`localhost`或`127.0.0.1`表示只允许本机访问
   - 在服务器环境中，必须设置为`0.0.0.0`才能从外部访问应用

2. **为什么需要`0.0.0.0`**：
   - 在服务器环境中，如果绑定到`localhost`，只有服务器本机能访问应用
   - 绑定到`0.0.0.0`允许来自任何IP地址的访问请求
   - 这对于生产环境是必要的，否则外部用户无法连接到您的应用

### 端口配置优先级

1. **PM2配置（ecosystem.config.js）中的PORT**：
   - 这是决定Next.js服务器实际监听端口的主要配置
   - 当使用PM2启动应用时，这里的PORT环境变量会被传递给Next.js进程
   - 优先级最高，会覆盖其他方式设置的端口

2. **.env文件中的NEXT_PUBLIC_APP_URL**：
   - 这个配置主要用于客户端代码构建完整URL
   - 不会直接影响服务器监听的端口
   - 如果与实际监听端口不一致，可能导致客户端请求失败

### 配置最佳实践

- 在服务器环境中，始终将HOST设置为`0.0.0.0`
- 确保ecosystem.config.js中的PORT与.env中的NEXT_PUBLIC_APP_URL端口一致
- 修改端口时，应同时更新两处配置
- 在不同环境（开发、测试、生产）之间切换时，注意检查端口配置

### 当前配置

目前项目使用的配置：
- 主机绑定：HOST = 0.0.0.0（绑定到所有网络接口）
- 端口配置：
  - 开发环境：PORT = 3000
  - 生产环境：PORT = 3005
- .env文件：NEXT_PUBLIC_APP_URL = http://localhost:3000 (建议更新为实际服务器地址)

## 实例数量最佳实践

PM2的一个重要特性是能够在集群模式下运行多个应用实例。以下是关于如何选择合适实例数量的指南：

### 实例数量选择

- **固定数量**（如4个实例）：
  - 适合大多数生产环境
  - 在性能和资源消耗之间取得平衡
  - 推荐用于有限资源的服务器

- **所有CPU核心**（`instances: 'max'`）：
  - 充分利用所有CPU核心
  - 适合I/O密集型应用
  - 在资源充足的服务器上可提供最大并发处理能力
  - 注意：可能导致较高的内存使用

- **预留部分核心**（`instances: 'max-1'`或`instances: 'max-2'`）：
  - 为操作系统和其他进程预留一两个核心
  - 适合同一服务器上运行多个应用的场景
  - 避免资源争用问题

### 当前配置

当前项目采用了单实例配置：
- 实例数：1个
- 优点：内存使用最少，适合资源受限的环境
- 缺点：无法充分利用多核CPU，并发处理能力有限

## 生产环境部署流程

以下是在生产服务器上部署和更新应用的标准流程：

1. 初始部署：

```bash
# 拉取最新代码
git pull

# 安装依赖
npm install

# 构建应用
npm run build

# 启动应用（生产环境）
npm run pm2:prod

# 保存进程列表（确保服务器重启后自动恢复）
pm2 save
```

2. 更新应用（零停机）：

```bash
# 拉取最新代码
git pull

# 安装依赖（如有新依赖）
npm install

# 重新构建应用
npm run build

# 零停机重载应用
npm run pm2:reload
```

## 设置PM2开机自启

在生产服务器上，您通常希望PM2在服务器重启后自动启动。设置步骤如下：

1. 生成自启动脚本：

```bash
pm2 startup
```

2. 按照命令输出的指示运行生成的命令（通常需要sudo权限）

3. 保存当前运行的进程列表：

```bash
pm2 save
```

## 监控和日志

PM2提供了强大的监控和日志功能：

1. 实时监控：

```bash
pm2 monit
```

2. 查看日志：

```bash
# 查看所有日志
pm2 logs

# 查看特定应用的日志
pm2 logs memoir-app

# 显示最近10行日志
pm2 logs --lines 10
```

3. 日志轮转：

PM2-logrotate插件已安装，它会自动管理日志文件，防止日志文件过大。默认配置：
- 日志大小超过10MB时进行轮转
- 保留最近30个日志文件
- 不压缩日志文件

## PM2配置文件说明

项目根目录下的`ecosystem.config.js`文件包含了PM2的配置：

```javascript
module.exports = {
  apps: [
    {
      name: 'memoir-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      // 调整实例数量选项:
      // instances: 'max' - 使用所有可用CPU核心 (会创建与CPU核心数相同的实例)
      // instances: 4 - 固定数量的实例 (适合大多数生产环境)
      // instances: 'max-1' - 使用CPU核心数减1 (为系统预留一个核心)
      instances: 2, // 使用单个实例，降低资源消耗
      exec_mode: 'cluster', // 集群模式，实现负载均衡
      watch: false, // 生产环境不启用监视
      max_memory_restart: '1G', // 内存使用超过1GB时自动重启
      // 端口配置说明:
      // 1. 这里设置的PORT环境变量将决定Next.js服务器实际监听的端口
      // 2. 此端口配置优先于.env文件中的配置
      // 3. 请确保此端口与.env中的NEXT_PUBLIC_APP_URL端口一致
      // 主机绑定配置:
      // HOST=0.0.0.0 表示绑定到所有网络接口，允许从外部网络访问
      // 如果不设置或设置为localhost，则只能从本机访问
      env_development: {
        NODE_ENV: 'development',
        HOST: '0.0.0.0', // 绑定到所有网络接口
        PORT: 3000 // 开发环境端口
      },
      env_production: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0', // 绑定到所有网络接口
        PORT: 3005 // 生产环境端口
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      combine_logs: true,
      // 优雅停机配置
      kill_timeout: 3000, // 给应用3秒的时间来处理现有连接
      wait_ready: true, // 等待应用发送ready信号
      listen_timeout: 10000, // 等待应用开始监听的时间
    }
  ]
};
```

您可以根据需要调整配置参数：

- `instances`: 可以设置为具体数字（如`4`）或`max`（使用所有可用CPU）
- `max_memory_restart`: 内存使用超过指定值时自动重启
- `watch`: 开发环境可以设置为`true`，自动监视文件变化并重启
- `HOST`: 服务器绑定地址，生产环境务必设置为`0.0.0.0`
- `PORT`: 服务器监听端口

## 常见问题排查

1. **应用无法启动**

   检查日志文件：
   ```bash
   pm2 logs
   ```

2. **内存使用过高**

   检查内存使用情况：
   ```bash
   pm2 monit
   ```
   
   考虑调整`max_memory_restart`设置

3. **CPU使用率高**

   使用PM2的监控功能检查哪些进程使用CPU较高：
   ```bash
   pm2 monit
   ```

4. **服务器重启后PM2进程未自动启动**

   确保正确设置了PM2自启动：
   ```bash
   pm2 startup
   pm2 save
   ```

5. **端口冲突**

   如果遇到端口已被占用的错误：
   ```bash
   # 检查端口使用情况
   netstat -ano | findstr :3000
   
   # 修改ecosystem.config.js中的端口配置
   # 同时更新.env中的NEXT_PUBLIC_APP_URL
   ```

6. **外部无法访问应用**

   检查主机绑定设置：
   - 确认ecosystem.config.js中设置了`HOST: '0.0.0.0'`
   - 检查服务器防火墙是否允许相应端口的访问
   - 检查云服务提供商的安全组/网络设置是否开放了相应端口
   
   测试服务器网络监听情况：
   ```bash
   # 查看服务器上所有监听的端口和地址
   netstat -an | grep LISTEN
   
   # 查看特定端口的监听情况
   netstat -an | grep 3005
   ```
   
   正确的监听输出应该包含类似`0.0.0.0:3005`的条目，而不是`127.0.0.1:3005`

## 参考资源

- [PM2官方文档](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Next.js部署文档](https://nextjs.org/docs/deployment)
- [PM2集群模式文档](https://pm2.keymetrics.io/docs/usage/cluster-mode/) 