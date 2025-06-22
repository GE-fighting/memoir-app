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
      instances: 1, // 使用单个实例，降低资源消耗
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