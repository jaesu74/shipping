/**
 * 목업 서버 - API 요청 처리
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'shipping_secret_key';

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 사용자 데이터
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    role: 'user'
  }
];

// 목업 데이터 디렉토리 및 파일 생성
const dataDir = path.join(__dirname, 'data');
const shippingDataFile = path.join(dataDir, 'shipping_data.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 목업 데이터 확인 및 생성
if (!fs.existsSync(shippingDataFile)) {
  // 목업 데이터 생성
  const mockData = [
    {
      date: new Date().toISOString(),
      indices: [
        {
          name: 'BDI (Baltic Dry Index)',
          value: '2450',
          change: '+120',
          source: 'Baltic Exchange',
        },
        {
          name: 'BCI (Baltic Capesize Index)',
          value: '3270',
          change: '+210',
          source: 'Baltic Exchange',
        },
        {
          name: 'BPI (Baltic Panamax Index)',
          value: '2130',
          change: '-45',
          source: 'Baltic Exchange',
        },
        {
          name: 'BDTI (Baltic Dirty Tanker Index)',
          value: '780',
          change: '+25',
          source: 'Baltic Exchange',
        },
        {
          name: 'SCFI 종합지수',
          value: '1025.4',
          change: '+24.8',
          source: '상하이 컨테이너 운임 지수',
        },
        {
          name: '글로벌 평균 VLSFO',
          value: '620.5 USD/mt',
          change: '-7.3',
          source: 'Ship & Bunker',
        },
        {
          name: '싱가포르 VLSFO',
          value: '635.8 USD/mt',
          change: '-5.5',
          source: 'Ship & Bunker',
        },
        {
          name: '로테르담 VLSFO',
          value: '582.4 USD/mt',
          change: '-6.2',
          source: 'Ship & Bunker',
        },
        {
          name: 'FBX 글로벌 컨테이너 운임',
          value: '4230 USD/40ft',
          change: '+250',
          source: 'Freightos Baltic Index',
        },
        {
          name: 'FBX 중국-서유럽',
          value: '5120 USD/40ft',
          change: '+320',
          source: 'Freightos Baltic Index',
        },
        {
          name: 'FBX 중국-미서부',
          value: '4850 USD/40ft',
          change: '+180',
          source: 'Freightos Baltic Index',
        },
        {
          name: 'FBX 중국-미동부',
          value: '6230 USD/40ft',
          change: '+350',
          source: 'Freightos Baltic Index',
        },
        {
          name: 'WCI 상하이-로테르담',
          value: '4850 USD/40ft',
          change: '+280',
          source: 'Drewry WCI',
        },
        {
          name: '글로벌 항만 혼잡도 지수',
          value: '45.8%',
          change: '-2.3',
          source: '글로벌 항만 혼잡도 지수',
        }
      ]
    }
  ];

  fs.writeFileSync(shippingDataFile, JSON.stringify(mockData, null, 2));
}

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다' });
    }
    req.user = user;
    next();
  });
};

// 로그인 엔드포인트
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요' });
  }

  // 사용자 확인
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: '존재하지 않는 사용자입니다' });
  }

  // 비밀번호 확인
  if (user.password !== password) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
  }

  // JWT 토큰 생성
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

// 최신 데이터 조회 API
app.get('/api/shipping/latest', authenticateToken, (req, res) => {
  try {
    const shippingData = JSON.parse(fs.readFileSync(shippingDataFile, 'utf8'));
    if (shippingData.length > 0) {
      res.json(shippingData[0]);
    } else {
      res.status(404).json({ error: '데이터가 없습니다' });
    }
  } catch (error) {
    console.error('최신 데이터 조회 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 데이터 히스토리 조회 API
app.get('/api/shipping/history', authenticateToken, (req, res) => {
  try {
    const shippingData = JSON.parse(fs.readFileSync(shippingDataFile, 'utf8'));
    res.json(shippingData);
  } catch (error) {
    console.error('데이터 히스토리 조회 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 데이터 수집 실행 API
app.post('/api/shipping/collect', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }
    
    const shippingData = JSON.parse(fs.readFileSync(shippingDataFile, 'utf8'));
    const latestData = JSON.parse(JSON.stringify(shippingData[0]));
    
    // 새로운 데이터 생성 (기존 데이터에서 약간의 변화만 주기)
    latestData.date = new Date().toISOString();
    
    latestData.indices.forEach(index => {
      // 임의의 변동폭 생성
      const change = Math.random() > 0.5 ? 
        '+' + (Math.random() * 50).toFixed(1) : 
        '-' + (Math.random() * 30).toFixed(1);
        
      // 기존 값에서 변동폭 적용
      let value = parseFloat(index.value.replace(/[^0-9.-]+/g, ''));
      let unit = index.value.replace(/[0-9.-]+/g, '').trim();
      
      if (change.startsWith('+')) {
        value += parseFloat(change.substring(1));
      } else {
        value -= parseFloat(change.substring(1));
      }
      
      // 소수점 아래가 있는 경우에만 소수점 표시
      if (value % 1 !== 0) {
        value = value.toFixed(1);
      } else {
        value = Math.round(value);
      }
      
      index.value = value + (unit ? ' ' + unit : '');
      index.change = change;
    });
    
    // 새 데이터를 배열의 첫번째에 추가
    shippingData.unshift(latestData);
    
    // 최대 30개만 유지
    if (shippingData.length > 30) {
      shippingData.length = 30;
    }
    
    fs.writeFileSync(shippingDataFile, JSON.stringify(shippingData, null, 2));
    
    res.json({ 
      success: true, 
      message: '데이터 수집이 완료되었습니다',
      data: latestData
    });
  } catch (error) {
    console.error('데이터 수집 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 특정 유형의 지수 데이터 조회 API
app.get('/api/shipping/indices/:type', authenticateToken, (req, res) => {
  try {
    const type = req.params.type;
    const validTypes = ['baltic', 'container', 'bunker', 'port', 'scfi'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: '유효하지 않은 지수 유형입니다' });
    }
    
    const shippingData = JSON.parse(fs.readFileSync(shippingDataFile, 'utf8'));
    
    if (shippingData.length === 0) {
      return res.status(404).json({ error: '데이터가 없습니다' });
    }
    
    const latestData = shippingData[0];
    
    // 유형별 필터링
    const filteredIndices = latestData.indices.filter(index => {
      switch(type) {
        case 'baltic':
          return index.source === 'Baltic Exchange';
        case 'container':
          return index.source === 'Freightos Baltic Index' || 
                 index.source === 'Drewry WCI';
        case 'bunker':
          return index.source === 'Ship & Bunker';
        case 'port':
          return index.source === '글로벌 항만 혼잡도 지수';
        case 'scfi':
          return index.source === '상하이 컨테이너 운임 지수';
        default:
          return false;
      }
    });
    
    res.json({
      date: latestData.date,
      indices: filteredIndices
    });
  } catch (error) {
    console.error('지수 데이터 조회 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// API 상태 확인
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 모든 요청을 index.html로 라우팅
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`http://localhost:${PORT} 에 접속하세요`);
}); 