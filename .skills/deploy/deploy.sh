#!/bin/bash

# =============================================================================
# Deploy Skill - React + Node.js 应用部署脚本
# 功能：推送到 GitHub + 部署到远程服务器
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# 加载配置
CONFIG_FILE="${SCRIPT_DIR}/config.env"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# 默认值
REMOTE_HOST="${REMOTE_HOST:-101.32.241.70}"
REMOTE_USER="${REMOTE_USER:-ubuntu}"
REMOTE_DIR="${REMOTE_DIR:-~/come-on-asshole}"
LOCAL_PORT="${LOCAL_PORT:-5173}"
CONTAINER_NAME="${CONTAINER_NAME:-come-on-asshole}"
IMAGE_NAME="${IMAGE_NAME:-come-on-asshole:latest}"
GITHUB_REPO="${GITHUB_REPO:-origin}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

# 显示帮助
show_help() {
    cat << EOF
部署脚本 - 支持 GitHub + 服务器双部署

用法: $0 [选项]

选项:
    --help, -h          显示帮助信息
    --server-only       仅部署到服务器（不推送到 GitHub）
    --github-only       仅推送到 GitHub（不部署到服务器）
    --skip-build        跳过本地构建
    --skip-checks       跳过健康检查
    --config FILE       指定配置文件

示例:
    $0                          # 完整部署流程
    $0 --server-only            # 仅部署到服务器
    $0 --github-only            # 仅推送到 GitHub
    $0 --config config.staging.env  # 使用指定配置

配置文件: ${CONFIG_FILE}
EOF
}

# 解析参数
SERVER_ONLY=false
GITHUB_ONLY=false
SKIP_BUILD=false
SKIP_CHECKS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --server-only)
            SERVER_ONLY=true
            shift
            ;;
        --github-only)
            GITHUB_ONLY=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --config)
            CONFIG_FILE="$2"
            if [ -f "$CONFIG_FILE" ]; then
                source "$CONFIG_FILE"
            else
                echo -e "${RED}错误: 配置文件不存在: $CONFIG_FILE${NC}"
                exit 1
            fi
            shift 2
            ;;
        *)
            echo -e "${RED}错误: 未知选项 $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 打印标题
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}     🚀 Deploy Skill v1.0.0${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# 打印步骤
print_step() {
    echo -e "${YELLOW}[步骤 $1/$2] $3${NC}"
}

# 打印成功
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 打印错误
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 检查前置条件
check_prerequisites() {
    print_step 0 5 "检查前置条件"
    
    # 检查是否在 git 仓库中
    if [ ! -d "$PROJECT_ROOT/.git" ]; then
        print_error "当前目录不是 git 仓库"
        exit 1
    fi
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "未安装 Docker"
        exit 1
    fi
    
    # 检查 SSH 连接
    if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH OK'" &> /dev/null; then
        print_error "无法连接到远程服务器 $REMOTE_HOST"
        echo "请确保："
        echo "  1. SSH 密钥已配置"
        echo "  2. 服务器可访问"
        exit 1
    fi
    
    print_success "前置条件检查通过"
    echo ""
}

# 步骤1：本地构建
step_build() {
    if [ "$SKIP_BUILD" = true ]; then
        print_step 1 5 "跳过本地构建"
        return
    fi
    
    print_step 1 5 "本地构建项目"
    
    cd "$PROJECT_ROOT"
    
    # 安装依赖
    echo "安装依赖..."
    npm ci
    
    # 构建项目
    echo "构建项目..."
    npm run build
    
    print_success "本地构建完成"
    echo ""
}

# 步骤2：推送到 GitHub
step_github() {
    if [ "$SERVER_ONLY" = true ]; then
        print_step 2 5 "跳过 GitHub 推送 (--server-only)"
        return
    fi
    
    print_step 2 5 "推送到 GitHub"
    
    cd "$PROJECT_ROOT"
    
    # 检查是否有变更
    if [ -z "$(git status --porcelain)" ]; then
        echo "没有变更需要提交"
    else
        # 添加所有变更
        git add -A
        
        # 提交（使用时间戳作为默认消息）
        COMMIT_MSG="deploy: $(date '+%Y-%m-%d %H:%M:%S')"
        git commit -m "$COMMIT_MSG"
        
        # 推送
        git push "$GITHUB_REPO" "$GITHUB_BRANCH"
    fi
    
    print_success "GitHub 推送完成"
    echo ""
}

# 步骤3：同步到服务器
step_sync() {
    if [ "$GITHUB_ONLY" = true ]; then
        print_step 3 5 "跳过服务器同步 (--github-only)"
        return
    fi
    
    print_step 3 5 "同步代码到服务器"
    
    # 确保远程目录存在
    ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_DIR/data"
    
    # 使用 rsync 同步代码
    echo "正在同步文件..."
    rsync -avz \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='*.tar.gz' \
        --exclude='.skills' \
        "$PROJECT_ROOT/" \
        "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
    
    print_success "代码同步完成"
    echo ""
}

# 步骤4：服务器部署
step_deploy() {
    if [ "$GITHUB_ONLY" = true ]; then
        print_step 4 5 "跳过服务器部署 (--github-only)"
        return
    fi
    
    print_step 4 5 "服务器部署"
    
    # 执行远程部署
    ssh "$REMOTE_USER@$REMOTE_HOST" << EOF
        cd $REMOTE_DIR
        
        # 确保数据目录存在
        mkdir -p data
        
        # 停止旧容器
        echo "停止旧容器..."
        sudo docker stop $CONTAINER_NAME 2>/dev/null || true
        sudo docker rm $CONTAINER_NAME 2>/dev/null || true
        
        # 构建新镜像
        echo "构建 Docker 镜像..."
        sudo docker build -t $IMAGE_NAME . 2>&1
        
        # 启动新容器
        echo "启动新容器..."
        sudo docker run -d \
            --name $CONTAINER_NAME \
            -p $LOCAL_PORT:$LOCAL_PORT \
            -v $REMOTE_DIR/data:/app/data \
            -e NODE_ENV=production \
            -e PORT=$LOCAL_PORT \
            --restart unless-stopped \
            $IMAGE_NAME
        
        echo ""
        echo "容器状态:"
        sudo docker ps -f name=$CONTAINER_NAME
EOF
    
    print_success "服务器部署完成"
    echo ""
}

# 步骤5：健康检查
step_health_check() {
    if [ "$SKIP_CHECKS" = true ] || [ "$GITHUB_ONLY" = true ]; then
        print_step 5 5 "跳过健康检查"
        return
    fi
    
    print_step 5 5 "健康检查"
    
    echo "等待容器启动..."
    sleep 3
    
    # 检查健康端点
    HEALTH_URL="http://$REMOTE_HOST:$LOCAL_PORT/health"
    MAX_RETRIES=5
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s "$HEALTH_URL" &> /dev/null; then
            print_success "健康检查通过"
            echo ""
            echo -e "${GREEN}========================================${NC}"
            echo -e "${GREEN}     ✓ 部署成功！${NC}"
            echo -e "${GREEN}========================================${NC}"
            echo -e "${BLUE}  访问地址: http://$REMOTE_HOST:$LOCAL_PORT${NC}"
            echo ""
            return
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "重试 $RETRY_COUNT/$MAX_RETRIES..."
        sleep 2
    done
    
    print_error "健康检查失败"
    echo "请检查服务器日志："
    echo "  ssh $REMOTE_USER@$REMOTE_HOST \"sudo docker logs $CONTAINER_NAME\""
    exit 1
}

# 主函数
main() {
    print_header
    
    # 检查前置条件
    check_prerequisites
    
    # 执行部署步骤
    step_build
    step_github
    step_sync
    step_deploy
    step_health_check
    
    echo -e "${BLUE}部署完成时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
}

# 执行主函数
main
