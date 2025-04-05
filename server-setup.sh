#!/bin/bash

# 서버 설정 스크립트 for ship.wvl.co.kr
# 이 스크립트는 Ubuntu 20.04 또는 Ubuntu 22.04에서 실행됨을 가정합니다.

# Root 권한 확인
if [ "$(id -u)" -ne 0 ]; then
    echo "이 스크립트는 root 권한으로 실행해야 합니다. sudo를 사용해 주세요."
    exit 1
fi

# 기본 업데이트 및 필수 패키지 설치
echo "시스템 업데이트 및 필수 패키지 설치 중..."
apt-get update
apt-get upgrade -y
apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx

# Node.js 18.x 설치
echo "Node.js 18.x 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# PM2 설치
echo "PM2 설치 중..."
npm install -g pm2

# MongoDB 설치
echo "MongoDB 설치 중..."
apt-get install -y gnupg
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list
apt-get update
apt-get install -y mongodb-org
systemctl enable mongod
systemctl start mongod

# 방화벽 설정
echo "방화벽 설정 중..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 애플리케이션 디렉토리 생성
echo "애플리케이션 디렉토리 생성 중..."
mkdir -p /var/www/ship.wvl.co.kr/current
mkdir -p /var/www/ship.wvl.co.kr/data
chown -R www-data:www-data /var/www/ship.wvl.co.kr

# Nginx 설정 복사 및 활성화
echo "Nginx 설정 중..."
cp nginx/ship.wvl.co.kr.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/ship.wvl.co.kr.conf /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# SSL 인증서 설정
echo "SSL 인증서 설정 중..."
certbot --nginx -d ship.wvl.co.kr --non-interactive --agree-tos --email admin@wvl.co.kr

# .env 파일 생성
echo "환경 변수 설정 중..."
cp .env.example /var/www/ship.wvl.co.kr/.env
# 환경 변수 설정 - 실제 배포 시 보안 값으로 변경해야 함
sed -i "s/your_strong_jwt_secret_key_here/$(openssl rand -hex 32)/" /var/www/ship.wvl.co.kr/.env

# PM2 시작 스크립트 설정
echo "PM2 시작 스크립트 설정 중..."
pm2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

echo "서버 설정이 완료되었습니다!"
echo "GitHub Action을 통해 애플리케이션을 배포하거나, 수동으로 배포할 수 있습니다."
echo "수동 배포의 경우 다음 명령어를 실행하세요:"
echo "  cd /var/www/ship.wvl.co.kr/current"
echo "  pm2 start server.js --name ship-monitor" 