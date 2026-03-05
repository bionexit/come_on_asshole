#!/bin/bash

# Nginx 配置部署脚本
# 用于配置 HTTPS 和反向代理

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="asshole.biw.ac"
NGINX_CONF="nginx-asshole.conf"
REMOTE_HOST="101.32.241.70"
REMOTE_USER="ubuntu"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Nginx + SSL 配置部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查域名解析
echo -e "${YELLOW}[1/5] 检查域名解析...${NC}"
echo "请确保 ${DOMAIN} 已解析到 ${REMOTE_HOST}"
read -p "是否继续? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
fi

# 上传 Nginx 配置
echo -e "${YELLOW}[2/5] 上传 Nginx 配置文件...${NC}"
scp ${NGINX_CONF} ${REMOTE_USER}@${REMOTE_HOST}:/tmp/${NGINX_CONF}
echo -e "${GREEN}✓ 配置文件已上传${NC}"

# 远程执行配置
echo -e "${YELLOW}[3/5] 配置远程服务器...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
    # 检查 Nginx 是否安装
    if ! command -v nginx &> /dev/null; then
        echo "安装 Nginx..."
        sudo apt update
        sudo apt install -y nginx
    fi

    # 安装 Certbot
    if ! command -v certbot &> /dev/null; then
        echo "安装 Certbot..."
        sudo apt install -y certbot python3-certbot-nginx
    fi

    # 复制配置文件
    sudo mv /tmp/${NGINX_CONF} /etc/nginx/conf.d/asshole.conf

    # 测试配置
    echo "测试 Nginx 配置..."
    sudo nginx -t

    # 申请 SSL 证书 (如果还没有)
    if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        echo "申请 SSL 证书..."
        sudo certbot --nginx -d ${DOMAIN} --agree-tos --non-interactive --email admin@${DOMAIN}
    fi

    # 重启 Nginx
    echo "重启 Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx

    echo ""
    echo "Nginx 状态:"
    sudo systemctl status nginx --no-pager | head -5
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ Nginx 配置成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${BLUE}  HTTP:  http://${DOMAIN}${NC}"
    echo -e "${BLUE}  HTTPS: https://${DOMAIN}${NC}"
    echo ""
    echo -e "${YELLOW}常用命令:${NC}"
    echo "  测试配置: sudo nginx -t"
    echo "  重启 Nginx: sudo systemctl restart nginx"
    echo "  查看日志: sudo tail -f /var/log/nginx/${DOMAIN}.access.log"
else
    echo -e "${RED}✗ 配置失败${NC}"
    exit 1
fi
