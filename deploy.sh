#!/bin/bash

# AI预测网站一键部署脚本
# 使用方法: chmod +x deploy.sh && ./deploy.sh

set -e

echo "🚀 开始部署AI预测网站..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用root权限运行此脚本"
    echo "使用: sudo ./deploy.sh"
    exit 1
fi

# 获取当前目录（脚本所在目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查必需文件
REQUIRED_FILES=("index.html" "styles.css" "script.js" "sales_data.json" "stats.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必需文件: $file"
        echo "请确保所有文件都在脚本所在目录中"
        exit 1
    fi
done

# 创建项目目录
PROJECT_DIR="/var/www/ai-prediction"
echo "📁 创建项目目录: $PROJECT_DIR"
mkdir -p $PROJECT_DIR

# 复制文件到项目目录
echo "📋 复制文件到项目目录..."
cp -r * "$PROJECT_DIR/"

echo "✅ 所有必需文件检查完成"

# 选择部署方式
echo ""
echo "请选择部署方式:"
echo "1) Python HTTP服务器 (简单快速)"
echo "2) Nginx (生产环境推荐)"
echo "3) 仅复制文件到 $PROJECT_DIR"
read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        echo "🐍 使用Python HTTP服务器部署..."
        
        # 检查Python3
        if ! command -v python3 &> /dev/null; then
            echo "❌ Python3 未安装，正在安装..."
            if command -v apt &> /dev/null; then
                apt update && apt install -y python3
            elif command -v yum &> /dev/null; then
                yum install -y python3
            else
                echo "❌ 无法自动安装Python3，请手动安装"
                exit 1
            fi
        fi
        
        # 创建systemd服务文件
        cat > /etc/systemd/system/ai-prediction.service << EOF
[Unit]
Description=AI Prediction Website
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/python3 -m http.server 8080
Restart=always

[Install]
WantedBy=multi-user.target
EOF

        # 启动服务
        systemctl daemon-reload
        systemctl enable ai-prediction
        systemctl start ai-prediction
        
        echo "✅ Python HTTP服务器部署完成"
        echo "🌐 访问地址: http://$(hostname -I | awk '{print $1}'):8080"
        ;;
        
    2)
        echo "🌐 使用Nginx部署..."
        
        # 安装Nginx
        if ! command -v nginx &> /dev/null; then
            echo "📦 正在安装Nginx..."
            if command -v apt &> /dev/null; then
                apt update && apt install -y nginx
            elif command -v yum &> /dev/null; then
                yum install -y nginx
            else
                echo "❌ 无法自动安装Nginx，请手动安装"
                exit 1
            fi
        fi
        
        # 创建Nginx配置
        cat > /etc/nginx/sites-available/ai-prediction << EOF
server {
    listen 80;
    server_name _;
    
    root $PROJECT_DIR;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    location ~* \.(css|js|json)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/css application/json application/javascript text/xml application/xml;
}
EOF

        # 启用配置
        if [ -d "/etc/nginx/sites-enabled" ]; then
            ln -sf /etc/nginx/sites-available/ai-prediction /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/default
        else
            # CentOS/RHEL 配置方式
            cat > /etc/nginx/conf.d/ai-prediction.conf << EOF
server {
    listen 80;
    server_name _;
    
    root $PROJECT_DIR;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    location ~* \.(css|js|json)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/css application/json application/javascript text/xml application/xml;
}
EOF
        fi
        
        # 测试配置并启动
        nginx -t
        systemctl enable nginx
        systemctl restart nginx
        
        echo "✅ Nginx部署完成"
        echo "🌐 访问地址: http://$(hostname -I | awk '{print $1}')/"
        ;;
        
    3)
        echo "📋 仅复制文件到项目目录"
        echo "✅ 文件已复制到: $PROJECT_DIR"
        echo "💡 您可以手动配置Web服务器指向此目录"
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

# 设置文件权限
chown -R www-data:www-data $PROJECT_DIR 2>/dev/null || chown -R nginx:nginx $PROJECT_DIR 2>/dev/null || true
chmod -R 755 $PROJECT_DIR

echo ""
echo "🎉 部署完成！"
echo "📂 项目目录: $PROJECT_DIR"
echo "🔧 如需修改，请编辑目录中的文件"

# 显示服务状态
if systemctl is-active --quiet ai-prediction 2>/dev/null; then
    echo "🟢 Python服务状态: $(systemctl is-active ai-prediction)"
elif systemctl is-active --quiet nginx 2>/dev/null; then
    echo "🟢 Nginx服务状态: $(systemctl is-active nginx)"
fi

echo ""
echo "📋 常用命令:"
if systemctl is-active --quiet ai-prediction 2>/dev/null; then
    echo "  查看日志: journalctl -u ai-prediction -f"
    echo "  重启服务: systemctl restart ai-prediction"
    echo "  停止服务: systemctl stop ai-prediction"
elif systemctl is-active --quiet nginx 2>/dev/null; then
    echo "  查看日志: journalctl -u nginx -f"
    echo "  重启服务: systemctl restart nginx"
    echo "  停止服务: systemctl stop nginx"
    echo "  测试配置: nginx -t"
fi

echo "  查看端口: netstat -tlnp | grep :80"
echo "  防火墙设置: ufw allow 80/tcp  # Ubuntu"
echo "            firewall-cmd --add-port=80/tcp --permanent  # CentOS" 