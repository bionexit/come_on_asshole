#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
IMAGE_NAME="come-on-asshole"
CONTAINER_NAME="come-on-asshole"
PORT="5173"
REMOTE_HOST="101.32.241.70"
REMOTE_USER="ubuntu"
DEPLOY_DIR="~/come-on-asshole"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Come On Asshole - 远程构建部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 步骤1：准备部署包
echo -e "${YELLOW}[1/4] 正在准备部署包...${NC}"

# 创建临时目录
TMP_DIR=$(mktemp -d)
ARCHIVE="deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

# 复制项目文件（排除不需要的文件）
rsync -av --exclude='node_modules' \
          --exclude='.git' \
          --exclude='dist' \
          --exclude='*.tar.gz' \
          --exclude='local.db' \
          --exclude='screen_shot' \
          --exclude='.env' \
          . ${TMP_DIR}/

# 打包
cd ${TMP_DIR} && tar czf ${ARCHIVE} .
cd -

echo -e "${GREEN}✓ 部署包已创建: ${ARCHIVE}${NC}"

# 步骤2：上传到远程服务器
echo -e "${YELLOW}[2/4] 正在上传到远程服务器...${NC}"

ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${DEPLOY_DIR}"
scp ${TMP_DIR}/${ARCHIVE} ${REMOTE_USER}@${REMOTE_HOST}:${DEPLOY_DIR}/

# 清理临时目录
rm -rf ${TMP_DIR}

echo -e "${GREEN}✓ 上传完成${NC}"

# 步骤3：在远程服务器上构建和运行
echo -e "${YELLOW}[3/4] 正在远程服务器上构建镜像...${NC}"

ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
    cd ${DEPLOY_DIR}
    
    # 解压部署包
    echo "解压文件..."
    tar xzf ${ARCHIVE}
    rm -f ${ARCHIVE}
    
    # 停止并删除旧容器
    echo "停止旧容器..."
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    
    # 构建新镜像
    echo "构建 Docker 镜像..."
    sudo docker build -t ${IMAGE_NAME}:latest .
    
    # 运行新容器
    echo "启动容器..."
    sudo docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${PORT}:80 \
        --restart unless-stopped \
        ${IMAGE_NAME}:latest
    
    # 清理旧镜像
    echo "清理旧镜像..."
    sudo docker system prune -f 2>/dev/null || true
    
    echo ""
    echo "部署状态:"
    sudo docker ps -f name=${CONTAINER_NAME}
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ 部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${BLUE}  访问地址: http://${REMOTE_HOST}:${PORT}${NC}"
    echo ""
else
    echo -e "${RED}✗ 部署失败${NC}"
    exit 1
fi
