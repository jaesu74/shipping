require('dotenv').config();

module.exports = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shipping',
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  // 데이터 수집 설정
  collectors: {
    bdi: {
      url: process.env.BDI_API_URL,
      schedule: '0 9 * * *' // 매일 오전 9시
    },
    scfi: {
      url: process.env.SCFI_API_URL,
      schedule: '0 9 * * *'
    },
    bunkerPrice: {
      url: process.env.BUNKER_PRICE_API_URL,
      schedule: '0 9 * * *'
    }
  }
}; 