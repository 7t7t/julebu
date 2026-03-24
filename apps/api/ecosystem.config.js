// 加载 .env.prod 确保 PM2 进程能读到环境变量
require("dotenv").config({ path: ".env.prod" });

module.exports = {
  apps: [
    {
      name: "alrahim_api",
      script: "node",
      args: "dist/src/main.js",
      cwd: ".",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "prod",
      },
    },
  ],
};
