#!/bin/bash
# 便捷入口脚本 - 调用 Skill 进行部署
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/.skills/deploy/deploy.sh" "$@"
