#!/bin/bash

# 服务器部署脚本（放在服务器上执行）

APP_DIR="$HOME/come-on-asshole"
DATA_DIR="$APP_DIR/data"

echo "========================================"
echo "  Come On Asshole - Server Deploy"
echo "========================================"
echo ""

cd $APP_DIR

echo "[1/5] 拉取最新代码..."
git pull origin main

echo ""
echo "[2/5] 创建数据目录..."
mkdir -p $DATA_DIR

# 备份旧数据库（如果存在）
if [ -f "$DATA_DIR/local.db" ]; then
    echo "备份现有数据库..."
    cp "$DATA_DIR/local.db" "$DATA_DIR/local.db.backup.$(date +%Y%m%d-%H%M%S)"
fi

echo ""
echo "[3/5] 停止旧容器..."
sudo docker stop come-on-asshole 2>/dev/null || true
sudo docker rm come-on-asshole 2>/dev/null || true

echo ""
echo "[4/5] 构建新镜像..."
sudo docker build -t come-on-asshole:latest .

echo ""
echo "[5/5] 启动新容器..."

# 加载环境变量（如果 .env.local 存在）
if [ -f "$APP_DIR/.env.local" ]; then
    echo "加载环境变量..."
    export $(grep -v '^#' $APP_DIR/.env.local | xargs)
fi

sudo docker run -d \
    --name come-on-asshole \
    -p 5173:5173 \
    -v $DATA_DIR:/app/data \
    -e NODE_ENV=production \
    -e PORT=5173 \
    -e WECHAT_APP_ID="${WECHAT_APP_ID:-}" \
    -e WECHAT_APP_SECRET="${WECHAT_APP_SECRET:-}" \
    -e SERVER_URL="${SERVER_URL:-}" \
    --restart unless-stopped \
    come-on-asshole:latest

echo ""
echo "等待容器启动..."
sleep 3

echo ""
echo "容器状态:"
sudo docker ps -f name=come-on-asshole

echo ""
echo "========================================"
echo "  ✓ 部署完成！"
echo "========================================"
echo "  访问地址: http://$(curl -s ifconfig.me):5173"
echo "  数据目录: $DATA_DIR"
echo ""
