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
DEPLOY_DIR="/opt/come-on-asshole"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Come On Asshole - Docker 部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 函数：显示帮助信息
show_help() {
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  build       - 本地构建 Docker 镜像"
    echo "  run         - 本地运行容器"
    echo "  stop        - 停止本地容器"
    echo "  push        - 推送镜像到远程服务器"
    echo "  deploy      - 完整部署到远程服务器（构建+推送+运行）"
    echo "  remote-stop - 停止远程容器"
    echo "  logs        - 查看远程容器日志"
    echo "  help        - 显示帮助信息"
    echo ""
}

# 函数：本地构建
build_image() {
    echo -e "${YELLOW}[1/3] 正在构建 Docker 镜像...${NC}"
    docker build -t ${IMAGE_NAME}:latest .
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 镜像构建成功${NC}"
        docker images ${IMAGE_NAME}:latest --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}"
    else
        echo -e "${RED}✗ 镜像构建失败${NC}"
        exit 1
    fi
}

# 函数：本地运行
run_local() {
    echo -e "${YELLOW}[2/3] 正在运行本地容器...${NC}"
    
    # 停止并删除旧容器
    docker stop ${CONTAINER_NAME} 2>/dev/null
    docker rm ${CONTAINER_NAME} 2>/dev/null
    
    # 运行新容器
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${PORT}:80 \
        --restart unless-stopped \
        ${IMAGE_NAME}:latest
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 容器运行成功${NC}"
        echo -e "${BLUE}  本地访问: http://localhost:${PORT}${NC}"
        docker ps -f name=${CONTAINER_NAME}
    else
        echo -e "${RED}✗ 容器运行失败${NC}"
        exit 1
    fi
}

# 函数：停止本地容器
stop_local() {
    echo -e "${YELLOW}正在停止本地容器...${NC}"
    docker stop ${CONTAINER_NAME} 2>/dev/null
    docker rm ${CONTAINER_NAME} 2>/dev/null
    echo -e "${GREEN}✓ 本地容器已停止${NC}"
}

# 函数：保存并推送镜像到远程服务器
push_image() {
    echo -e "${YELLOW}[3/3] 正在准备远程部署...${NC}"
    
    # 保存镜像为 tar 文件
    echo "正在导出镜像..."
    docker save ${IMAGE_NAME}:latest | gzip > ${IMAGE_NAME}.tar.gz
    
    # 创建远程部署目录
    echo "创建远程部署目录..."
    ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${DEPLOY_DIR}"
    
    # 复制文件到远程服务器
    echo "正在复制文件到远程服务器..."
    scp ${IMAGE_NAME}.tar.gz docker-compose.yml ${REMOTE_USER}@${REMOTE_HOST}:${DEPLOY_DIR}/
    
    # 清理本地临时文件
    rm -f ${IMAGE_NAME}.tar.gz
    
    echo -e "${GREEN}✓ 文件已推送到远程服务器${NC}"
}

# 函数：在远程服务器上运行
deploy_remote() {
    echo -e "${YELLOW}正在远程服务器上部署...${NC}"
    
    ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
        cd ${DEPLOY_DIR}
        
        # 加载镜像
        echo "加载 Docker 镜像..."
        docker load < ${IMAGE_NAME}.tar.gz
        
        # 停止并删除旧容器
        echo "停止旧容器..."
        docker stop ${CONTAINER_NAME} 2>/dev/null || true
        docker rm ${CONTAINER_NAME} 2>/dev/null || true
        
        # 使用 docker compose 启动（检测可用的命令）
        echo "启动新容器..."
        if command -v docker-compose &> /dev/null; then
            docker-compose up -d --remove-orphans
        else
            docker compose up -d --remove-orphans
        fi
        
        # 清理旧镜像和文件
        echo "清理旧文件..."
        rm -f ${IMAGE_NAME}.tar.gz
        docker system prune -f 2>/dev/null || true
        
        # 显示状态
        echo ""
        echo "部署状态:"
        docker ps -f name=${CONTAINER_NAME}
EOF
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  ✓ 部署成功！${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo -e "${BLUE}  访问地址: http://${REMOTE_HOST}:${PORT}${NC}"
        echo ""
    else
        echo -e "${RED}✗ 远程部署失败${NC}"
        exit 1
    fi
}

# 函数：停止远程容器
stop_remote() {
    echo -e "${YELLOW}正在停止远程容器...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} "docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME}"
    echo -e "${GREEN}✓ 远程容器已停止${NC}"
}

# 函数：查看远程日志
view_logs() {
    echo -e "${BLUE}查看远程容器日志（按 Ctrl+C 退出）...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} "docker logs -f ${CONTAINER_NAME}"
}

# 主逻辑
case "${1:-help}" in
    build)
        build_image
        ;;
    run)
        build_image
        run_local
        ;;
    stop)
        stop_local
        ;;
    push)
        build_image
        push_image
        ;;
    deploy)
        build_image
        push_image
        deploy_remote
        ;;
    remote-stop)
        stop_remote
        ;;
    logs)
        view_logs
        ;;
    help|*)
        show_help
        ;;
esac
