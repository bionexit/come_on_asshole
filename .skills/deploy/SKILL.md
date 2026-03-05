# Deploy Skill | 部署技能

快速将 React + Node.js 应用部署到 GitHub 和远程服务器。

## 快速开始 | Quick Start

```bash
# 在项目根目录执行
skills/deploy/deploy.sh
```

## 功能特性 | Features

- ✅ 自动构建 TypeScript 项目
- ✅ 推送到 GitHub
- ✅ 同步代码到远程服务器
- ✅ 构建 Docker 镜像
- ✅ 启动/重启容器
- ✅ 数据持久化（SQLite）

## 前置要求 | Prerequisites

- Docker & Docker Compose
- Git
- SSH 密钥已配置到服务器
- 服务器已安装 Docker

## 配置说明 | Configuration

编辑 `config.env` 文件：

```bash
# 远程服务器配置
REMOTE_HOST=101.32.241.70
REMOTE_USER=ubuntu
REMOTE_DIR=~/come-on-asshole
LOCAL_PORT=5173
CONTAINER_NAME=come-on-asshole
IMAGE_NAME=come-on-asshole:latest

# GitHub 配置（可选）
GITHUB_REPO=origin
GITHUB_BRANCH=main
```

## 使用方式 | Usage

### 1. 完整部署流程

```bash
./skills/deploy/deploy.sh
```

执行步骤：
1. 本地构建 (`npm run build`)
2. Git 提交并推送到 GitHub
3. 同步代码到服务器
4. 服务器构建 Docker 镜像
5. 启动/重启容器
6. 健康检查

### 2. 仅部署到服务器（不推送到 GitHub）

```bash
./skills/deploy/deploy.sh --server-only
```

### 3. 仅推送到 GitHub

```bash
./skills/deploy/deploy.sh --github-only
```

### 4. 查看帮助

```bash
./skills/deploy/deploy.sh --help
```

## 目录结构 | Structure

```
.skills/deploy/
├── SKILL.md              # 本说明文档
├── deploy.sh             # 主部署脚本
├── config.env            # 配置文件
├── deploy-server.sh      # 服务器端部署脚本
└── docker-compose.yml    # Docker 编排文件（可选覆盖）
```

## 脚本说明 | Scripts

### deploy.sh (本地执行)

主部署脚本，协调本地和远程部署流程。

**功能：**
- 检查前置条件
- 构建项目
- Git 操作
- SSH 同步
- 触发远程部署

### deploy-server.sh (服务器执行)

在服务器上执行的部署脚本。

**功能：**
- 拉取代码
- 创建数据目录
- 构建镜像
- 启动容器
- 健康检查

## 故障排查 | Troubleshooting

### 构建失败

```bash
# 查看详细日志
npm run build 2>&1 | tee build.log
```

### 容器无法启动

```bash
# SSH 到服务器查看日志
ssh ubuntu@101.32.241.70 "sudo docker logs come-on-asshole"
```

### 数据库权限问题

```bash
# SSH 到服务器修复权限
ssh ubuntu@101.32.241.70 "sudo chmod 777 ~/come-on-asshole/data"
```

### 端口被占用

```bash
# 查看占用 5173 端口的进程
ssh ubuntu@101.32.241.70 "sudo lsof -i :5173"
```

## 进阶用法 | Advanced

### 自定义构建参数

编辑 `deploy.sh` 中的 `BUILD_ARGS`：

```bash
BUILD_ARGS="--build-arg NODE_ENV=production --no-cache"
```

### 多环境部署

创建多个配置文件：

```bash
.skills/deploy/
├── config.env          # 生产环境
├── config.staging.env  # 测试环境
└── config.dev.env      # 开发环境
```

使用时指定配置：

```bash
CONFIG_FILE=config.staging.env ./skills/deploy/deploy.sh
```

### 回滚操作

```bash
# 查看历史镜像
ssh ubuntu@101.32.241.70 "sudo docker images come-on-asshole"

# 回滚到指定版本
ssh ubuntu@101.32.241.70 "sudo docker stop come-on-asshole && sudo docker rm come-on-asshole && sudo docker run -d --name come-on-asshole -p 5173:5173 come-on-asshole:<旧版本TAG>"
```

## 版本历史 | Changelog

### v1.0.0
- 初始版本
- 支持 GitHub + 服务器双部署
- 支持数据持久化
- 健康检查

## 许可证 | License

MIT - 与主项目保持一致
