const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const puppeteer = require('puppeteer');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

// 로깅 설정
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console()
    // Google Cloud에서는 파일 로깅 비활성화
    // new transports.File({ filename: 'data-collection.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://ship.wvl.co.kr', 'http://ship.wvl.co.kr'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'shipping-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// App Engine에서는 로컬 파일 시스템을 사용하지 않고 메모리에 데이터 저장
const isCloudEnvironment = process.env.GAE_APPLICATION !== undefined;

// 수신자 이메일 목록 저장
let subscribedEmails = [];

// 데이터 저장 변수
let shippingData = [
  {
    date: new Date().toISOString().split('T')[0],
    indices: [
      {
        name: "BDI (Baltic Dry Index)",
        value: "1,432",
        change: "+15",
        source: "Baltic Exchange"
      },
      {
        name: "BCI (Baltic Capesize Index)",
        value: "1,876",
        change: "+23",
        source: "Baltic Exchange"
      },
      {
        name: "SCFI 종합지수",
        value: "834.23",
        change: "-12.5",
        source: "상하이 컨테이너 운임 지수"
      },
      {
        name: "글로벌 평균 VLSFO",
        value: "685.50",
        change: "-2.5",
        source: "벙커유 가격"
      }
    ]
  }
];

// 로컬 환경에서만 파일 시스템 사용
if (!isCloudEnvironment) {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  
  if (fs.existsSync(path.join(dataDir, 'emails.json'))) {
    subscribedEmails = JSON.parse(fs.readFileSync(path.join(dataDir, 'emails.json'), 'utf8'));
  }
}

// 루트 라우트 (테스트용)
app.get('/', (req, res) => {
  res.send('Backend server is running.');
});

// ... 나머지 코드 ... 