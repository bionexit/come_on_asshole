# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 生产阶段
FROM node:20-alpine

# 安装必要的工具
RUN apk add --no-cache curl

WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --omit=dev

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 复制服务器必要文件
COPY --from=builder /app/server.js ./
COPY --from=builder /app/src ./src

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chmod 777 /app/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5173

# 暴露端口
EXPOSE 5173

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5173/health || exit 1

# 启动命令
CMD ["node", "server.js"]
