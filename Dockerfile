# === 第一阶段：构建 (Node.js) ===
FROM node:22-alpine AS builder

WORKDIR /app

# 单独复制 package.json 是为了利用 Docker 缓存
COPY package*.json ./

# 使用淘宝源/阿里源加速安装依赖
RUN npm config set registry https://registry.npmmirror.com
RUN npm install

# 复制源码并打包
COPY . .
RUN npm run build

# === 第二阶段：运行 (Nginx) ===
FROM nginx:alpine

# 1. 复制构建好的 dist 文件夹到 Nginx 默认目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 2. 复制我们刚才写的 nginx.conf 覆盖默认配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]