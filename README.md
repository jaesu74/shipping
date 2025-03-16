# 해운 데이터 수집 및 모니터링 시스템

해운 관련 주요 지수와 데이터를 자동으로 수집하고 모니터링하는 웹 애플리케이션입니다.

## 주요 기능

- Baltic Exchange 지수 수집 (BDI, BCI, BPI, BSI, BHSI)
- 상하이 컨테이너 운임 지수 (SCFI) 수집
- 벙커유 가격 정보 수집
- 실시간 데이터 모니터링
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