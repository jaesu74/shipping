# 해운 데이터 수집 및 모니터링 시스템

해운 관련 주요 지수와 데이터를 자동으로 수집하고 모니터링하는 웹 애플리케이션입니다.

## 주요 기능

- Baltic Exchange 지수 수집 (BDI, BCI, BPI, BSI, BHSI)
- 상하이 컨테이너 운임 지수 (SCFI) 수집
- 벙커유 가격 정보 수집
- 신조선 가격 지수 수집
- 중고선 가격 지수 수집
- 정기용선료 지수 수집
- 나용선료 지수 수집
- 주요 항구별 운임 정보 수집
- 주요 화물별 운임 정보 수집
- 실시간 데이터 모니터링
- 카테고리별 데이터 필터링
- 데이터 CSV 다운로드
- 이메일 알림 서비스

## 기술 스택

### 백엔드
- Node.js
- Express.js
- Selenium WebDriver
- Puppeteer
- Winston (로깅)
- Node-cron (스케줄링)

### 프론트엔드
- React.js
- React Hooks
- CSS3

## 설치 및 실행 방법

1. 저장소 클론
```bash
git clone [repository-url]
```

2. 백엔드 설정
```bash
cd backend
npm install
npm start
```

3. 프론트엔드 설정
```bash
cd frontend
npm install
npm start
```

4. 브라우저에서 접속
- 프론트엔드: http://localhost:3000
- 백엔드: http://localhost:5000

## 기본 계정 정보
- 아이디: admin
- 비밀번호: password

## 데이터 수집 스케줄
- 매일 오전 9시
- 매일 오후 3시

## 라이선스
ISC License 

## 도메인 연결 및 배포 방법

### 프론트엔드 배포 (GitHub Pages)

1. 프론트엔드 디렉토리로 이동하여 gh-pages 패키지 설치
```bash
cd frontend
npm install gh-pages --save-dev
```

2. package.json에 homepage 필드와 deploy 스크립트 확인
```json
"homepage": "https://ship.wvl.co.kr",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

3. GitHub Pages 배포 실행
```bash
npm run deploy
```

4. GitHub 저장소 설정에서 Pages 설정 확인
   - Settings > Pages > Source에서 gh-pages 브랜치 선택
   - Custom domain에 ship.wvl.co.kr 입력

### 백엔드 서버 배포 (Linux/Ubuntu 서버)

1. PM2를 글로벌로 설치
```bash
npm install pm2 -g
```

2. 백엔드 코드 복제 및 의존성 설치
```bash
git clone https://github.com/jaesu74/shipping.git
cd shipping/backend
npm install
```

3. PM2로 서버 실행
```bash
pm2 start ecosystem.config.js --env production
```

4. Nginx 설정 (도메인 연결)
```
server {
    listen 80;
    server_name api.ship.wvl.co.kr;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. Let's Encrypt로 SSL 인증서 발급
```bash
sudo certbot --nginx -d api.ship.wvl.co.kr
```

### DNS 설정 (도메인 공급자 웹사이트)

1. `ship.wvl.co.kr` DNS 레코드 추가
   - CNAME 레코드: `ship` → `jaesu74.github.io`

2. `api.ship.wvl.co.kr` DNS 레코드 추가
   - A 레코드: `api.ship` → 백엔드 서버 IP 주소

### 도메인 확인

설정이 완료되면 다음 주소로 접속 가능:
- 프론트엔드: https://ship.wvl.co.kr
- 백엔드 API: https://api.ship.wvl.co.kr 