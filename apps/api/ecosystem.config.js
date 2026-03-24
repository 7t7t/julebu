require("dotenv").config({ path: ".env.prod" });

module.exports = {
  apps: [
    {
      name: "alrahim_api",
      script: "pnpm",
      args: "start:prod",
      cwd: ".",
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "prod",
      },
    },
  ],
};
