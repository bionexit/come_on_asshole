#!/bin/bash

# ==========================================
# 🚀 Come On Asshole - 部署脚本
# ==========================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  🚀 Come On Asshole - 部署脚本"
echo "=========================================="
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo "🔍 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js 已安装: $NODE_VERSION${NC}"
echo

# 检查 npm
echo "🔍 检查 npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 npm${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm 已安装: $NPM_VERSION${NC}"
echo

# 安装依赖
echo "📦 安装依赖..."
npm install || {
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 依赖安装完成${NC}"
echo

# 检查并初始化数据库
echo "🗄️  检查数据库..."
if [ ! -f "local.db" ]; then
    echo -e "${YELLOW}📝 数据库不存在，正在初始化...${NC}"
    npm run db:generate
    npm run db:migrate || {
        echo -e "${RED}❌ 数据库初始化失败${NC}"
        exit 1
    }
else
    echo -e "${GREEN}✅ 数据库已存在${NC}"
fi
echo

# 构建项目
echo "🔨 构建项目..."
npm run build || {
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 构建完成${NC}"
echo

# 检查 dist 目录
echo "📁 检查构建输出..."
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 错误: dist 目录不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✅ dist 目录已生成${NC}"
echo

echo "=========================================="
echo -e "${GREEN}  🎉 部署准备完成！${NC}"
echo "=========================================="
echo
echo "你可以选择以下方式运行："
echo
echo "  1. 本地预览: npm run preview"
echo "  2. 开发模式: npm run dev"
echo "  3. 部署 dist 目录到服务器"
echo
