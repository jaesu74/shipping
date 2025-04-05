# 해운 데이터 수집 및 모니터링 시스템

이 시스템은 다양한 해운 관련 지수와 데이터를 수집하고 모니터링할 수 있는 웹 애플리케이션입니다. Baltic Dry Index, SCFI, 벙커유 가격, 컨테이너 운임, 항만 혼잡도 등의 데이터를 자동으로 수집하여 시각화합니다.

## 주요 기능

- 해운 관련 지수 자동 수집
- JWT 기반 사용자 인증
- 관리자 및 일반 사용자 권한 분리
- 데이터 시각화 대시보드
- API 엔드포인트 제공
- 자동 스케줄링 데이터 업데이트

## 기술 스택

- **백엔드**: Node.js, Express
- **데이터 수집**: Axios, JSDOM, Puppeteer
- **인증**: JWT, bcrypt
- **프론트엔드**: React, Chart.js
- **로깅**: Winston
- **자동화**: node-cron

## 시작하기

### 전제 조건

- Node.js 14.0 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/shipping-data-monitoring.git
cd shipping-data-monitoring

# 의존성 설치
npm install
```

### 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음과 같이 설정하세요:

```
PORT=3000
JWT_SECRET=your_jwt_secret_key
```

### 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start

# 데이터 수집만 실행
npm run collect
```

## API 엔드포인트

### 인증

- `POST /login`: 사용자 로그인 및 JWT 토큰 발급

### 데이터 API

- `GET /api/shipping/latest`: 최신 해운 데이터 조회
- `GET /api/shipping/history`: 해운 데이터 이력 조회
- `POST /api/shipping/collect`: 해운 데이터 수집 실행 (관리자 전용)
- `GET /api/shipping/indices/:type`: 특정 유형의 해운 지수 데이터 조회
- `GET /api/status`: API 상태 확인

## 사용자 계정

기본 제공 계정:
- 관리자: admin / admin123
- 일반 사용자: user / user123

## 데이터 수집 소스

현재 이 시스템은 다음과 같은 데이터를 수집합니다:
- Baltic Exchange 지수 (BDI, BCI, BPI, BDTI)
- 상하이 컨테이너 운임 지수 (SCFI)
- 벙커유 가격 (VLSFO)
- 컨테이너 운임 (Freightos Baltic Index, Drewry WCI)
- 항만 혼잡도 지수

## 라이선스

ISC 