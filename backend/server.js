// server.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000; // 포트를 5000번으로 설정

// CORS 설정: 모든 도메인에서 접근 가능하도록 설정 (필요에 따라 도메인을 제한하세요)
app.use(cors({ origin: true, credentials: true }));

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'shipping-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// 루트 라우트 (테스트용)
app.get('/', (req, res) => {
  res.send('Backend server is running.');
});

// 간단한 사용자 인증 (데모용)
// 아이디: admin, 비밀번호: password
const USER = { username: 'admin', password: 'password' };

// 로그인 처리 (POST /login)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USER.username && password === USER.password) {
    req.session.user = username;
    res.status(200).send('로그인 성공');
  } else {
    res.status(401).send('로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다.');
  }
});

// 로그아웃 처리 (GET /logout)
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.send('로그아웃 성공');
});

// 보호된 API 미들웨어 (로그인 필요)
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).send('인증 필요');
  }
}

// GET /api/data - 보호된 데이터 조회 API (예시 데이터 반환)
app.get('/api/data', isAuthenticated, (req, res) => {
  const data = [
    {
      "지수명": "예시 지수명",
      "지수값": "예시 지수값",
      "변동폭": "예시 변동폭",
      "비고": "예시 비고",
      "기타": "예시 기타 (간략 설명)"
    }
  ];
  res.json(data);
});

// GET /download - 보호된 텍스트 파일 다운로드 API
app.get('/download', isAuthenticated, (req, res) => {
  const dataText = `
지수명\t지수값\t변동폭\t비고\t기타
예시 지수명\t예시 지수값\t예시 변동폭\t예시 비고\t예시 기타 (간략 설명)
  `;
  res.setHeader('Content-disposition', 'attachment; filename=data.txt');
  res.setHeader('Content-Type', 'text/plain');
  res.send(dataText);
});

// 서버 실행 (모든 네트워크 인터페이스에서 접근 가능하도록 '0.0.0.0'으로 설정)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
