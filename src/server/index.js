const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { setupRoutes } = require('./routes');
const { setupCollectors } = require('./collectors');
const { logger } = require('../shared/logger');
const config = require('../config');

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// 데이터베이스 연결
mongoose.connect(config.mongoUri)
  .then(() => logger.info('MongoDB 연결 성공'))
  .catch(err => logger.error('MongoDB 연결 실패:', err));

// 라우트 설정
setupRoutes(app);

// 데이터 수집기 설정
setupCollectors();

// 서버 시작
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`서버가 포트 ${port}에서 실행 중입니다.`);
}); 