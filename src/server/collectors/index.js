const cron = require('node-cron');
const axios = require('axios');
const { logger } = require('../../shared/logger');
const ShippingData = require('../models/ShippingData');

const collectors = {
  async collectBDI() {
    // Baltic Dry Index 수집 로직
  },

  async collectSCFI() {
    // Shanghai Container Freight Index 수집 로직
  },

  async collectBunkerPrice() {
    // 벙커유 가격 수집 로직
  }
};

function setupCollectors() {
  // 매일 오전 9시에 데이터 수집
  cron.schedule('0 9 * * *', async () => {
    try {
      await Promise.all([
        collectors.collectBDI(),
        collectors.collectSCFI(),
        collectors.collectBunkerPrice()
      ]);
      logger.info('데이터 수집 완료');
    } catch (error) {
      logger.error('데이터 수집 실패:', error);
    }
  });
}

module.exports = {
  setupCollectors,
  collectors // 테스트용 export
}; 