/**
 * 해운 데이터 API 라우트
 * 데이터 수집 모듈에서 얻은 데이터를 클라이언트에 제공합니다.
 */

const express = require('express');
const router = express.Router();
const { collectAllData, loadShippingData } = require('./data-collector');
const jwt = require('jsonwebtoken');

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'shipping_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다' });
    }
    req.user = user;
    next();
  });
};

/**
 * @route   GET /api/shipping/latest
 * @desc    최신 해운 데이터 조회
 * @access  Private
 */
router.get('/shipping/latest', authenticateToken, async (req, res) => {
  try {
    // 저장된 데이터 불러오기
    const shippingData = loadShippingData();
    
    // 데이터가 있는 경우 최신 데이터 반환
    if (shippingData.length > 0) {
      // 날짜 기준 내림차순 정렬
      const sortedData = [...shippingData].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      return res.json(sortedData[0]);
    }
    
    // 데이터가 없는 경우 새로 수집
    const newData = await collectAllData();
    if (newData) {
      return res.json(newData);
    } else {
      return res.status(500).json({ error: '데이터 수집에 실패했습니다' });
    }
  } catch (error) {
    console.error('최신 데이터 조회 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @route   GET /api/shipping/history
 * @desc    해운 데이터 히스토리 조회
 * @access  Private
 */
router.get('/shipping/history', authenticateToken, (req, res) => {
  try {
    // 저장된 데이터 불러오기
    const shippingData = loadShippingData();
    
    // 날짜 기준 내림차순 정렬
    const sortedData = [...shippingData].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    return res.json(sortedData);
  } catch (error) {
    console.error('데이터 히스토리 조회 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @route   GET /api/shipping/collect
 * @desc    해운 데이터 수집 실행
 * @access  Private (Admin)
 */
router.post('/shipping/collect', authenticateToken, async (req, res) => {
  try {
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }
    
    // 데이터 수집 실행
    const newData = await collectAllData();
    if (newData) {
      return res.json({ 
        success: true, 
        message: '데이터 수집이 완료되었습니다',
        data: newData
      });
    } else {
      return res.status(500).json({ error: '데이터 수집에 실패했습니다' });
    }
  } catch (error) {
    console.error('데이터 수집 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @route   GET /api/shipping/indices/:type
 * @desc    특정 유형의 해운 지수 데이터 조회
 * @access  Private
 */
router.get('/shipping/indices/:type', authenticateToken, (req, res) => {
  try {
    const type = req.params.type;
    const validTypes = ['baltic', 'container', 'bunker', 'port', 'scfi'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: '유효하지 않은 지수 유형입니다' });
    }
    
    // 저장된 데이터 불러오기
    const shippingData = loadShippingData();
    
    // 데이터가 없는 경우
    if (shippingData.length === 0) {
      return res.status(404).json({ error: '데이터가 없습니다' });
    }
    
    // 날짜 기준 내림차순 정렬
    const sortedData = [...shippingData].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    // 최신 데이터
    const latestData = sortedData[0];
    
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

/**
 * @route   GET /api/status
 * @desc    API 상태 확인
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({ 
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 