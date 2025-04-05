# ship.wvl.co.kr 배포 가이드

이 문서는 해운 데이터 모니터링 시스템을 ship.wvl.co.kr에 배포하기 위한 가이드입니다.

## 1. 사전 요구사항

- GitHub 계정 및 저장소 권한
- SSH 액세스 가능한 서버 (Ubuntu 20.04 또는 22.04 권장)
- 도메인 (ship.wvl.co.kr)이 서버 IP로 연결되어 있어야 함

## 2. GitHub Secrets 설정

GitHub 액션을 사용한 자동 배포를 위해 저장소에 다음 비밀을 추가해야 합니다:

1. `SSH_PRIVATE_KEY`: 서버 접속을 위한 SSH 비밀키
2. `SSH_HOST`: 서버 호스트 (예: ship.wvl.co.kr 또는 IP 주소)
3. `SSH_USER`: SSH 사용자 이름 (예: root, ubuntu 등)

GitHub 저장소 > Settings > Secrets and variables > Actions 메뉴에서 위 비밀들을 추가할 수 있습니다.

## 3. 서버 초기 설정

서버 초기 설정을 위해 다음 단계를 따르세요:

1. 이 저장소를 서버에 클론:
   ```bash
   git clone https://github.com/your-username/shipping-monitoring.git
   cd shipping-monitoring
   ```

2. 서버 설정 스크립트 실행:
   ```bash
   chmod +x server-setup.sh
   sudo ./server-setup.sh
   ```

이 스크립트는 다음 작업을 수행합니다:
- 필요한 시스템 패키지 설치
- Node.js 18.x 및 PM2 설치
- MongoDB 설치 및 설정
- Nginx 설정 및 SSL 인증서 획득
- 애플리케이션 디렉토리 구조 설정

## 4. 배포 키 설정

GitHub Actions에서 서버에 SSH 접속하기 위한 키를 설정해야 합니다:

1. 서버에서 SSH 키 생성:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions"
   ```

2. 공개 키를 서버의 authorized_keys에 추가:
   ```bash
   cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
   ```

3. 비밀 키를 GitHub Secrets `SSH_PRIVATE_KEY`에 추가

## 5. GitHub Actions를 통한 자동 배포

main 브랜치에 변경 사항을 푸시하면 GitHub Actions가 자동으로 실행되어 다음 작업을 수행합니다:

1. 코드 테스트
2. 프론트엔드 빌드
3. 배포 패키지 생성
4. 서버에 패키지 전송 및 배포

배포 상태는 GitHub 저장소의 Actions 탭에서 확인할 수 있습니다.

## 6. 수동 배포

필요한 경우 다음 단계로 수동 배포가 가능합니다:

1. 프론트엔드 빌드:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

2. 배포 패키지 생성:
   ```bash
   mkdir -p deploy
   cp -r backend data-collector.js server.js api-routes.js package.json package-lock.json .env.example deploy/
   mkdir -p deploy/public
   cp -r frontend/build/* deploy/public/
   ```

3. 서버로 전송 및 배포:
   ```bash
   tar -czf deploy.tar.gz deploy
   scp deploy.tar.gz user@ship.wvl.co.kr:/tmp/
   ssh user@ship.wvl.co.kr
   
   # 서버에서 실행
   cd /var/www/ship.wvl.co.kr
   if [ -d "current" ]; then
     mv current previous_$(date +%Y%m%d%H%M%S)
   fi
   mkdir -p current
   tar -xzf /tmp/deploy.tar.gz -C current --strip-components=1
   cd current
   npm ci --production
   cp /var/www/ship.wvl.co.kr/.env .env
   pm2 restart ship-monitor || pm2 start server.js --name ship-monitor
   rm /tmp/deploy.tar.gz
   ```

## 7. 유지보수

### 로그 확인
```bash
pm2 logs ship-monitor
```

### 서비스 재시작
```bash
pm2 restart ship-monitor
```

### 데이터베이스 백업
```bash
mongodump --out /var/backups/mongodb/$(date +%Y%m%d)
```

### SSL 인증서 갱신 (자동으로 갱신되지만, 수동 갱신도 가능)
```bash
certbot renew
```

## 8. 문제 해결

### 배포 실패
- GitHub Actions 로그 확인
- 서버 로그 확인: `pm2 logs ship-monitor`
- Nginx 로그 확인: `cat /var/log/nginx/ship.wvl.co.kr.error.log`

### 서비스 장애
1. Nginx 상태 확인: `systemctl status nginx`
2. MongoDB 상태 확인: `systemctl status mongod`
3. Node.js 애플리케이션 상태 확인: `pm2 status`

## 9. 보안 고려사항

- 정기적으로 서버 업데이트: `apt update && apt upgrade -y`
- JWT 비밀키 정기적 변경
- `.env` 파일 보안 유지
- 방화벽 규칙 검토: `ufw status` 