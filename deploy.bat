@echo off
chcp 65001 >nul
echo ==========================================
echo   🚀 Come On Asshole - 部署脚本
echo ==========================================
echo.

:: 检查 Node.js
echo 🔍 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    exit /b 1
)
echo ✅ Node.js 已安装
echo.

:: 检查 npm
echo 🔍 检查 npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 npm
    exit /b 1
)
echo ✅ npm 已安装
echo.

:: 安装依赖
echo 📦 安装依赖...
call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    exit /b 1
)
echo ✅ 依赖安装完成
echo.

:: 检查并初始化数据库
echo 🗄️  检查数据库...
if not exist "local.db" (
    echo 📝 数据库不存在，正在初始化...
    call npm run db:generate
    call npm run db:migrate
    if errorlevel 1 (
        echo ❌ 数据库初始化失败
        exit /b 1
    )
) else (
    echo ✅ 数据库已存在
)
echo.

:: 构建项目
echo 🔨 构建项目...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败
    exit /b 1
)
echo ✅ 构建完成
echo.

:: 检查 dist 目录
echo 📁 检查构建输出...
if not exist "dist" (
    echo ❌ 错误: dist 目录不存在
    exit /b 1
)
echo ✅ dist 目录已生成
echo.

echo ==========================================
echo   🎉 部署准备完成！
echo ==========================================
echo.
echo 你可以选择以下方式运行：
echo.
echo   1. 本地预览: npm run preview
echo   2. 开发模式: npm run dev
echo   3. 部署 dist 目录到服务器
echo.
pause
