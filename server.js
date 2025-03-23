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
const PORT = process.env.PORT || 8080;

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

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

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

// 데이터 디렉토리 설정 (로컬 환경에서만)
if (!isCloudEnvironment) {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    // 로컬 데이터 파일이 있으면 로드
    const dataFile = path.join(dataDir, 'shipping_data.json');
    if (fs.existsSync(dataFile)) {
      try {
        const fileData = fs.readFileSync(dataFile, 'utf8');
        const parsedData = JSON.parse(fileData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          shippingData = parsedData;
          logger.info('로컬 데이터 파일을 로드했습니다.');
        }
      } catch (error) {
        logger.error('데이터 파일 로드 중 오류:', error);
      }
    }
  } catch (error) {
    logger.error('데이터 디렉토리 설정 중 오류:', error);
  }
}

// 루트 라우트 (정적 파일 서빙)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API 상태 확인
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend server is running.',
    timestamp: new Date().toISOString(),
    environment: isCloudEnvironment ? 'cloud' : 'local'
  });
});

// 인덱스 데이터 API
app.get('/api/indices', (req, res) => {
  try {
    res.json(shippingData);
  } catch (error) {
    logger.error('인덱스 데이터 제공 중 오류:', error);
    res.status(500).json({ error: '데이터 검색 중 오류가 발생했습니다.' });
  }
});

// 특정 날짜의 인덱스 데이터 API
app.get('/api/indices/:date', (req, res) => {
  try {
    const requestedDate = req.params.date;
    const dateData = shippingData.find(item => item.date === requestedDate);
    
    if (dateData) {
      res.json(dateData);
    } else {
      res.status(404).json({ error: '해당 날짜의 데이터를 찾을 수 없습니다.' });
    }
  } catch (error) {
    logger.error('날짜별 인덱스 데이터 제공 중 오류:', error);
    res.status(500).json({ error: '데이터 검색 중 오류가 발생했습니다.' });
  }
});

// 최신 인덱스 데이터 API
app.get('/api/indices/latest', (req, res) => {
  try {
    if (shippingData.length > 0) {
      // 날짜 기준으로 정렬하고 최신 데이터 반환
      const sortedData = [...shippingData].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      res.json(sortedData[0]);
    } else {
      res.status(404).json({ error: '데이터가 없습니다.' });
    }
  } catch (error) {
    logger.error('최신 인덱스 데이터 제공 중 오류:', error);
    res.status(500).json({ error: '데이터 검색 중 오류가 발생했습니다.' });
  }
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  logger.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// 서버 시작
app.listen(PORT, () => {
  logger.log(`Server is running on port ${PORT}`);
  logger.log(`Environment: ${isCloudEnvironment ? 'Google Cloud App Engine' : 'Local Development'}`);
  logger.log(`API 엔드포인트: http://localhost:${PORT}/api/status`);
});

// 데이터 수집 함수 (비동기)
const collectShippingData = async () => {
  if (!axios) {
    logger.warn('axios 모듈이 없어 데이터 수집을 건너뜁니다.');
    return;
  }
  
  try {
    logger.info('해운 데이터 수집 시작...');
    // 여기에 실제 데이터 수집 로직 구현
    // 실제 구현에서는 외부 API 호출이나 웹 스크래핑 등 포함
    
    // 샘플 코드: 현재 날짜의 새 데이터 추가
    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 데이터가 이미 있는지 확인
    const todayDataIndex = shippingData.findIndex(item => item.date === today);
    
    // 샘플 데이터 생성 (실제로는 API 호출 등으로 대체)
    const newData = {
      date: today,
      indices: [
        {
          name: "BDI (Baltic Dry Index)",
          value: (1400 + Math.floor(Math.random() * 100)).toString(),
          change: (Math.random() > 0.5 ? "+" : "-") + Math.floor(Math.random() * 30).toString(),
          source: "Baltic Exchange"
        },
        {
          name: "BCI (Baltic Capesize Index)",
          value: (1800 + Math.floor(Math.random() * 150)).toString(),
          change: (Math.random() > 0.5 ? "+" : "-") + Math.floor(Math.random() * 40).toString(),
          source: "Baltic Exchange"
        },
        {
          name: "SCFI 종합지수",
          value: (800 + Math.floor(Math.random() * 50) + Math.random().toFixed(2)).toString(),
          change: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 20).toFixed(1),
          source: "상하이 컨테이너 운임 지수"
        },
        {
          name: "글로벌 평균 VLSFO",
          value: (650 + Math.floor(Math.random() * 60) + Math.random().toFixed(2)).toString(),
          change: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 10).toFixed(1),
          source: "벙커유 가격"
        }
      ]
    };
    
    if (todayDataIndex >= 0) {
      // 기존 데이터 업데이트
      shippingData[todayDataIndex] = newData;
    } else {
      // 새 데이터 추가
      shippingData.push(newData);
    }
    
    // 로컬 환경에서만 파일에 저장
    if (!isCloudEnvironment) {
      try {
        const dataDir = path.join(__dirname, 'data');
        fs.writeFileSync(
          path.join(dataDir, 'shipping_data.json'),
          JSON.stringify(shippingData, null, 2)
        );
        logger.info('데이터를 파일에 저장했습니다.');
      } catch (error) {
        logger.error('데이터 저장 중 오류:', error);
      }
    }
    
    logger.info('해운 데이터 수집 완료');
  } catch (error) {
    logger.error('데이터 수집 중 오류:', error);
  }
};

// 초기 데이터 수집 실행
setTimeout(collectShippingData, 5000);

// 매일 특정 시간에 데이터 수집 스케줄링 (선택 사항, node-cron 필요)
try {
  const cron = require('node-cron');
  // 매일 오전 9시에 실행 (서버 시간 기준)
  cron.schedule('0 9 * * *', collectShippingData);
  logger.info('데이터 수집 스케줄러가 설정되었습니다. 매일 오전 9시에 실행됩니다.');
} catch (error) {
  logger.warn('node-cron 모듈을 로드할 수 없습니다. 자동 데이터 수집이 비활성화됩니다.');
} 