// server.js
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
    new transports.Console(),
    new transports.File({ filename: 'data-collection.log' })
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

// 데이터 저장 디렉토리 설정
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 수신자 이메일 목록 저장
let subscribedEmails = [];
if (fs.existsSync(path.join(dataDir, 'emails.json'))) {
  subscribedEmails = JSON.parse(fs.readFileSync(path.join(dataDir, 'emails.json'), 'utf8'));
}

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

// 루트 라우트 (테스트용)
app.get('/', (req, res) => {
  res.send('Backend server is running.');
});

// 간단한 사용자 인증 (데모용)
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

// 데이터 소스 목록
const dataSources = [
  { 
    name: "Baltic Exchange", 
    url: "https://www.balticexchange.com/",
    method: "selenium",
    indices: [
      { name: "BDI (Baltic Dry Index)", id: "bdi" },
      { name: "BCI (Baltic Capesize Index)", id: "bci" },
      { name: "BPI (Baltic Panamax Index)", id: "bpi" },
      { name: "BSI (Baltic Supramax Index)", id: "bsi" },
      { name: "BHSI (Baltic Handysize Index)", id: "bhsi" }
    ]
  },
  { 
    name: "상하이 컨테이너 운임 지수", 
    url: "https://en.sse.net.cn/indices/scfinew.jsp",
    method: "puppeteer",
    indices: [
      { name: "SCFI 종합지수", id: "scfi_main" },
      { name: "SCFI 유럽항로", id: "scfi_europe" },
      { name: "SCFI 지중해항로", id: "scfi_med" },
      { name: "SCFI 미서안항로", id: "scfi_uswc" },
      { name: "SCFI 미동안항로", id: "scfi_usec" }
    ]
  },
  { 
    name: "벙커유 가격", 
    url: "https://shipandbunker.com/prices",
    method: "puppeteer",
    indices: [
      { name: "글로벌 평균 VLSFO", id: "vlsfo_global" },
      { name: "글로벌 평균 MGO", id: "mgo_global" },
      { name: "싱가포르 VLSFO", id: "vlsfo_singapore" },
      { name: "로테르담 VLSFO", id: "vlsfo_rotterdam" }
    ]
  },
  { 
    name: "신조선 가격 지수", 
    url: "https://www.clarksons.net/n/#/mqs/newbuilding-prices",
    method: "puppeteer",
    indices: [
      { name: "컨테이너선 신조선 가격", id: "newbuild_container" },
      { name: "탱커선 신조선 가격", id: "newbuild_tanker" },
      { name: "벌크선 신조선 가격", id: "newbuild_bulk" },
      { name: "LNG선 신조선 가격", id: "newbuild_lng" }
    ]
  },
  { 
    name: "중고선 가격 지수", 
    url: "https://www.clarksons.net/n/#/mqs/second-hand-prices",
    method: "puppeteer",
    indices: [
      { name: "5년 중고 컨테이너선 가격", id: "secondhand_container_5y" },
      { name: "5년 중고 탱커선 가격", id: "secondhand_tanker_5y" },
      { name: "5년 중고 벌크선 가격", id: "secondhand_bulk_5y" },
      { name: "10년 중고 컨테이너선 가격", id: "secondhand_container_10y" },
      { name: "10년 중고 탱커선 가격", id: "secondhand_tanker_10y" },
      { name: "10년 중고 벌크선 가격", id: "secondhand_bulk_10y" }
    ]
  },
  { 
    name: "정기용선료 지수", 
    url: "https://www.clarksons.net/n/#/mqs/timecharter-rates",
    method: "puppeteer",
    indices: [
      { name: "컨테이너선 용선료 (1700 TEU)", id: "tc_container_1700" },
      { name: "컨테이너선 용선료 (4400 TEU)", id: "tc_container_4400" },
      { name: "벌크선 용선료 (케이프사이즈)", id: "tc_bulk_capesize" },
      { name: "벌크선 용선료 (파나막스)", id: "tc_bulk_panamax" },
      { name: "탱커선 용선료 (VLCC)", id: "tc_tanker_vlcc" },
      { name: "탱커선 용선료 (MR)", id: "tc_tanker_mr" }
    ]
  },
  { 
    name: "나용선료 지수", 
    url: "https://www.clarksons.net/n/#/mqs/bareboat-rates",
    method: "selenium",
    indices: [
      { name: "컨테이너선 나용선료", id: "bb_container" },
      { name: "탱커선 나용선료", id: "bb_tanker" },
      { name: "벌크선 나용선료", id: "bb_bulk" },
      { name: "LNG선 나용선료", id: "bb_lng" }
    ]
  },
  { 
    name: "주요 항구별 운임 정보", 
    url: "https://www.freightos.com/freight-resources/freight-rate-index-industry-pricing/",
    method: "puppeteer",
    indices: [
      { name: "상하이-로테르담 운임", id: "freight_shanghai_rotterdam" },
      { name: "상하이-로스앤젤레스 운임", id: "freight_shanghai_la" },
      { name: "상하이-뉴욕 운임", id: "freight_shanghai_newyork" },
      { name: "부산-로테르담 운임", id: "freight_busan_rotterdam" },
      { name: "부산-로스앤젤레스 운임", id: "freight_busan_la" }
    ]
  },
  { 
    name: "주요 화물별 운임 정보", 
    url: "https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index-assessed-by-drewry",
    method: "puppeteer",
    indices: [
      { name: "컨테이너 화물 운임", id: "cargo_container" },
      { name: "냉동화물 운임", id: "cargo_reefer" },
      { name: "건화물 운임", id: "cargo_dry" },
      { name: "특수화물 운임", id: "cargo_special" },
      { name: "위험물 운임", id: "cargo_hazardous" }
    ]
  }
];

// ===== 웹 스크래핑 함수 =====

// 셀레니움 기반 스크래핑 함수
async function scrapeWithSelenium(source) {
  logger.info(`셀레니움으로 ${source.name} 데이터 수집 시작`);
  let driver;
  
  try {
    // 헤드리스 크롬 드라이버 설정
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    await driver.get(source.url);
    
    // 예: Baltic Exchange 지수 수집
    if (source.name === "Baltic Exchange") {
      // 로그인 필요한 경우
      if (source.url.includes('balticexchange')) {
        await driver.findElement(By.id('username')).sendKeys(process.env.BALTIC_USERNAME || 'demo');
        await driver.findElement(By.id('password')).sendKeys(process.env.BALTIC_PASSWORD || 'password');
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.wait(until.urlContains('dashboard'), 5000);
        
        // 인덱스 페이지로 이동
        await driver.get('https://www.balticexchange.com/en/data-services/market-information/indices.html');
        await driver.wait(until.elementLocated(By.css('.indices-table')), 10000);
      }
      
      // 데이터 추출
      const results = {};
      for (const index of source.indices) {
        try {
          const element = await driver.findElement(By.css(`[data-index-id="${index.id}"]`));
          const value = await element.getText();
          results[index.id] = { 
            name: index.name, 
            value: value.trim(),
            source: source.name,
            url: source.url
          };
        } catch (err) {
          logger.error(`${index.name} 데이터 추출 실패: ${err.message}`);
        }
      }
      
      return results;
    }
    
    // 다른 사이트에 맞는 셀레니움 스크래핑 로직 추가
    
  } catch (error) {
    logger.error(`셀레니움 스크래핑 오류 (${source.name}): ${error.message}`);
    return null;
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

// Puppeteer 기반 스크래핑 함수
async function scrapeWithPuppeteer(source) {
  logger.info(`Puppeteer로 ${source.name} 데이터 수집 시작`);
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(source.url, { waitUntil: 'networkidle2' });
    
    // 상하이 컨테이너 운임 지수 수집
    if (source.name === "상하이 컨테이너 운임 지수") {
      await page.waitForSelector('.indexTable', { timeout: 10000 });
      
      const results = {};
      
      // 메인 지수 추출
      const mainIndex = await page.$eval('#n1ScfiIndex', el => el.textContent.trim());
      results.scfi_main = {
        name: "SCFI 종합지수",
        value: mainIndex,
        source: source.name,
        url: source.url
      };
      
      // 각 항로별 지수 추출
      const routes = await page.evaluate(() => {
        const data = {};
        const rows = document.querySelectorAll('.indexTable tbody tr');
        
        rows.forEach(row => {
          const route = row.querySelector('td:first-child')?.textContent.trim();
          const value = row.querySelector('td:nth-child(2)')?.textContent.trim();
          const change = row.querySelector('td:nth-child(3)')?.textContent.trim();
          
          if (route && value) {
            // 항로명에서 공백 제거하고 소문자로 변환하여 ID로 사용
            const routeId = route.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            data[routeId] = { route, value, change };
          }
        });
        
        return data;
      });
      
      // 필요한 항로 데이터 매핑
      for (const index of source.indices) {
        if (index.id !== 'scfi_main' && routes[index.id]) {
          results[index.id] = {
            name: index.name,
            value: routes[index.id].value,
            change: routes[index.id].change,
            source: source.name,
            url: source.url
          };
        }
      }
      
      return results;
    }
    
    // 벙커유 가격 데이터 수집
    if (source.name === "벙커유 가격") {
      await page.waitForSelector('.prices-table', { timeout: 10000 });
      
      const bunkerPrices = await page.evaluate(() => {
        const data = {};
        const rows = document.querySelectorAll('.prices-table tbody tr');
        
        rows.forEach(row => {
          const port = row.querySelector('td:first-child')?.textContent.trim();
          const vlsfo = row.querySelector('td:nth-child(2)')?.textContent.trim();
          const mgo = row.querySelector('td:nth-child(3)')?.textContent.trim();
          
          if (port && (vlsfo || mgo)) {
            // 항구명에서 공백 제거하고 소문자로 변환하여 ID로 사용
            const portId = port.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            data[portId] = { port, vlsfo, mgo };
          }
        });
        
        // 글로벌 평균 가격 추가
        const globalAvg = document.querySelector('.global-average');
        if (globalAvg) {
          const vlsfoGlobal = globalAvg.querySelector('.vlsfo')?.textContent.trim();
          const mgoGlobal = globalAvg.querySelector('.mgo')?.textContent.trim();
          
          data.global = { port: 'Global Average', vlsfo: vlsfoGlobal, mgo: mgoGlobal };
        }
        
        return data;
      });
      
      const results = {};
      
      // 필요한 벙커유 데이터 매핑
      results.vlsfo_global = {
        name: "글로벌 평균 VLSFO",
        value: bunkerPrices.global?.vlsfo || 'N/A',
        source: source.name,
        url: source.url
      };
      
      results.mgo_global = {
        name: "글로벌 평균 MGO",
        value: bunkerPrices.global?.mgo || 'N/A',
        source: source.name,
        url: source.url
      };
      
      // 싱가포르와 로테르담 데이터 추가
      if (bunkerPrices.singapore) {
        results.vlsfo_singapore = {
          name: "싱가포르 VLSFO",
          value: bunkerPrices.singapore.vlsfo,
          source: source.name,
          url: source.url
        };
      }
      
      if (bunkerPrices.rotterdam) {
        results.vlsfo_rotterdam = {
          name: "로테르담 VLSFO",
          value: bunkerPrices.rotterdam.vlsfo,
          source: source.name,
          url: source.url
        };
      }
      
      return results;
    }
    
    // 다른 사이트에 맞는 Puppeteer 스크래핑 로직 추가
    
  } catch (error) {
    logger.error(`Puppeteer 스크래핑 오류 (${source.name}): ${error.message}`);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// API 호출을 통한 데이터 수집 함수
async function fetchFromAPI(source) {
  logger.info(`API로 ${source.name} 데이터 수집 시작`);
  
  try {
    const response = await axios.get(source.url, {
      headers: source.apiKey ? { 'Authorization': `Bearer ${source.apiKey}` } : {}
    });
    
    // API 응답 데이터 처리 로직
    // 각 API에 맞게 구현 필요
    
    return response.data;
  } catch (error) {
    logger.error(`API 호출 오류 (${source.name}): ${error.message}`);
    return null;
  }
}

// 파일 다운로드 함수 (Excel, PDF 등)
async function downloadAndParseFile(source) {
  logger.info(`파일 다운로드 시작: ${source.name}`);
  
  try {
    const response = await axios({
      method: 'GET',
      url: source.url,
      responseType: 'stream'
    });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileName = `${source.name.replace(/\s+/g, '_')}_${timestamp}.${source.fileType || 'xlsx'}`;
    const filePath = path.join(dataDir, fileName);
    
    // 파일 저장
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        logger.info(`파일 다운로드 완료: ${filePath}`);
        // 파일 파싱 로직 (Excel, PDF 등 형식에 맞게 구현)
        resolve({ filePath });
      });
      writer.on('error', reject);
    });
  } catch (error) {
    logger.error(`파일 다운로드 오류 (${source.name}): ${error.message}`);
    return null;
  }
}

// 셀레니움으로 나용선료 데이터 수집 함수
async function scrapeBareBoatRates(driver, source) {
  let results = [];
  try {
    logger.info('나용선료 데이터 수집 중...');
    
    // URL 접속
    await driver.get(source.url);
    
    // 로그인이 필요한 경우 처리
    const loginRequired = await driver.findElements(By.css('input[type="password"]'));
    if (loginRequired.length > 0) {
      // 클락슨 계정 로그인
      await driver.findElement(By.id('username')).sendKeys(process.env.CLARKSONS_USERNAME || 'demo_user');
      await driver.findElement(By.id('password')).sendKeys(process.env.CLARKSONS_PASSWORD || 'demo_pass');
      await driver.findElement(By.css('button[type="submit"]')).click();
      await driver.wait(until.urlContains('mqs'), 5000);
    }
    
    // 데이터 테이블 대기
    await driver.wait(until.elementLocated(By.css('.data-table')), 10000);
    
    // 컨테이너선 나용선료
    const containerBB = await driver.findElement(By.xpath('//tr[contains(., "Container")]//td[2]')).getText();
    results.push({
      name: "컨테이너선 나용선료",
      value: containerBB,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 탱커선 나용선료
    const tankerBB = await driver.findElement(By.xpath('//tr[contains(., "Tanker")]//td[2]')).getText();
    results.push({
      name: "탱커선 나용선료",
      value: tankerBB,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 벌크선 나용선료
    const bulkBB = await driver.findElement(By.xpath('//tr[contains(., "Bulk")]//td[2]')).getText();
    results.push({
      name: "벌크선 나용선료",
      value: bulkBB,
      date: new Date().toISOString().split('T')[0]
    });
    
    // LNG선 나용선료
    const lngBB = await driver.findElement(By.xpath('//tr[contains(., "LNG")]//td[2]')).getText();
    results.push({
      name: "LNG선 나용선료",
      value: lngBB,
      date: new Date().toISOString().split('T')[0]
    });
    
    logger.info(`나용선료 데이터 수집 완료: ${results.length}개`);
    return results;
  } catch (error) {
    logger.error(`나용선료 데이터 수집 중 오류: ${error.message}`);
    return [];
  }
}

// Puppeteer로 신조선 가격 데이터 수집 함수
async function scrapeNewbuildPrices(page, source) {
  let results = [];
  try {
    logger.info('신조선 가격 데이터 수집 중...');
    
    // URL 접속
    await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 로그인이 필요한 경우 처리
    const loginForm = await page.$('input[type="password"]');
    if (loginForm) {
      // 클락슨 계정 로그인
      await page.type('#username', process.env.CLARKSONS_USERNAME || 'demo_user');
      await page.type('#password', process.env.CLARKSONS_PASSWORD || 'demo_pass');
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    }
    
    // 데이터 로딩 대기
    await page.waitForSelector('.data-table', { timeout: 30000 });
    
    // 컨테이너선 신조선 가격
    const containerPrice = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => row.textContent.includes('Container'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "컨테이너선 신조선 가격",
      value: containerPrice,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 탱커선 신조선 가격
    const tankerPrice = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => row.textContent.includes('Tanker'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "탱커선 신조선 가격",
      value: tankerPrice,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 벌크선 신조선 가격
    const bulkPrice = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => row.textContent.includes('Bulk'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "벌크선 신조선 가격",
      value: bulkPrice,
      date: new Date().toISOString().split('T')[0]
    });
    
    // LNG선 신조선 가격
    const lngPrice = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => row.textContent.includes('LNG'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "LNG선 신조선 가격",
      value: lngPrice,
      date: new Date().toISOString().split('T')[0]
    });
    
    logger.info(`신조선 가격 데이터 수집 완료: ${results.length}개`);
    return results;
  } catch (error) {
    logger.error(`신조선 가격 데이터 수집 중 오류: ${error.message}`);
    return [];
  }
}

// Puppeteer로 중고선 가격 데이터 수집 함수
async function scrapeSecondhandPrices(page, source) {
  let results = [];
  try {
    logger.info('중고선 가격 데이터 수집 중...');
    
    // URL 접속
    await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 로그인이 필요한 경우 처리
    const loginForm = await page.$('input[type="password"]');
    if (loginForm) {
      // 클락슨 계정 로그인
      await page.type('#username', process.env.CLARKSONS_USERNAME || 'demo_user');
      await page.type('#password', process.env.CLARKSONS_PASSWORD || 'demo_pass');
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    }
    
    // 데이터 로딩 대기
    await page.waitForSelector('.data-table', { timeout: 30000 });
    
    // 5년 중고 컨테이너선 가격
    const container5y = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Container') && row.textContent.includes('5 year'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "5년 중고 컨테이너선 가격",
      value: container5y,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 다른 중고선 가격들도 유사한 방식으로 수집
    // 10년 중고 컨테이너선 가격
    const container10y = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Container') && row.textContent.includes('10 year'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "10년 중고 컨테이너선 가격",
      value: container10y,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 5년 중고 탱커선 가격
    const tanker5y = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Tanker') && row.textContent.includes('5 year'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "5년 중고 탱커선 가격",
      value: tanker5y,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 10년 중고 탱커선 가격
    const tanker10y = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Tanker') && row.textContent.includes('10 year'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "10년 중고 탱커선 가격",
      value: tanker10y,
      date: new Date().toISOString().split('T')[0]
    });
    
    logger.info(`중고선 가격 데이터 수집 완료: ${results.length}개`);
    return results;
  } catch (error) {
    logger.error(`중고선 가격 데이터 수집 중 오류: ${error.message}`);
    return [];
  }
}

// Puppeteer로 정기용선료 데이터 수집 함수
async function scrapeTimecharter(page, source) {
  let results = [];
  try {
    logger.info('정기용선료 데이터 수집 중...');
    
    // URL 접속
    await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 로그인이 필요한 경우 처리
    const loginForm = await page.$('input[type="password"]');
    if (loginForm) {
      // 클락슨 계정 로그인
      await page.type('#username', process.env.CLARKSONS_USERNAME || 'demo_user');
      await page.type('#password', process.env.CLARKSONS_PASSWORD || 'demo_pass');
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    }
    
    // 데이터 로딩 대기
    await page.waitForSelector('.data-table', { timeout: 30000 });
    
    // 컨테이너선 용선료 (1700 TEU)
    const container1700 = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Container') && row.textContent.includes('1700 TEU'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "컨테이너선 용선료 (1700 TEU)",
      value: container1700,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 컨테이너선 용선료 (4400 TEU)
    const container4400 = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Container') && row.textContent.includes('4400 TEU'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "컨테이너선 용선료 (4400 TEU)",
      value: container4400,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 벌크선 용선료 (케이프사이즈)
    const bulkCapesize = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Bulk') && row.textContent.includes('Capesize'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "벌크선 용선료 (케이프사이즈)",
      value: bulkCapesize,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 벌크선 용선료 (파나막스)
    const bulkPanamax = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Bulk') && row.textContent.includes('Panamax'));
      return row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "벌크선 용선료 (파나막스)",
      value: bulkPanamax,
      date: new Date().toISOString().split('T')[0]
    });
    
    logger.info(`정기용선료 데이터 수집 완료: ${results.length}개`);
    return results;
  } catch (error) {
    logger.error(`정기용선료 데이터 수집 중 오류: ${error.message}`);
    return [];
  }
}

// Puppeteer로 주요 항구별 운임 정보 수집 함수
async function scrapePortFreightRates(page, source) {
  let results = [];
  try {
    logger.info('주요 항구별 운임 정보 수집 중...');
    
    // URL 접속
    await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 데이터 로딩 대기 (프라이토스 인덱스 테이블)
    await page.waitForSelector('.freight-index-table', { timeout: 30000 });
    
    // 상하이-로테르담 운임
    const shanghaiRotterdam = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Shanghai') && row.textContent.includes('Rotterdam'));
      return row ? row.querySelector('td:nth-child(3)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "상하이-로테르담 운임",
      value: shanghaiRotterdam,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 상하이-로스앤젤레스 운임
    const shanghaiLA = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Shanghai') && row.textContent.includes('Los Angeles'));
      return row ? row.querySelector('td:nth-child(3)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "상하이-로스앤젤레스 운임",
      value: shanghaiLA,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 상하이-뉴욕 운임
    const shanghaiNY = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Shanghai') && row.textContent.includes('New York'));
      return row ? row.querySelector('td:nth-child(3)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "상하이-뉴욕 운임",
      value: shanghaiNY,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 부산-로테르담 운임
    const busanRotterdam = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Busan') && row.textContent.includes('Rotterdam'));
      return row ? row.querySelector('td:nth-child(3)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "부산-로테르담 운임",
      value: busanRotterdam,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 부산-로스앤젤레스 운임
    const busanLA = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(row => 
        row.textContent.includes('Busan') && row.textContent.includes('Los Angeles'));
      return row ? row.querySelector('td:nth-child(3)').textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "부산-로스앤젤레스 운임",
      value: busanLA,
      date: new Date().toISOString().split('T')[0]
    });
    
    logger.info(`주요 항구별 운임 정보 수집 완료: ${results.length}개`);
    return results;
  } catch (error) {
    logger.error(`주요 항구별 운임 정보 수집 중 오류: ${error.message}`);
    return [];
  }
}

// Puppeteer로 주요 화물별 운임 정보 수집 함수
async function scrapeCargoFreightRates(page, source) {
  let results = [];
  try {
    logger.info('주요 화물별 운임 정보 수집 중...');
    
    // URL 접속
    await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 데이터 로딩 대기 (드루리 세계 컨테이너 지수 차트)
    await page.waitForSelector('.drewry-container-index', { timeout: 30000 });
    
    // 컨테이너 화물 운임 - Drewry 세계 컨테이너 지수
    const containerRate = await page.evaluate(() => {
      const element = document.querySelector('.drewry-container-index .current-rate');
      return element ? element.textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "컨테이너 화물 운임",
      value: containerRate,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 냉동화물 운임
    const reeferRate = await page.evaluate(() => {
      const element = document.querySelector('.reefer-container-index .current-rate');
      return element ? element.textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "냉동화물 운임",
      value: reeferRate,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 건화물 운임
    const dryRate = await page.evaluate(() => {
      const element = document.querySelector('.dry-cargo-index .current-rate');
      return element ? element.textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "건화물 운임",
      value: dryRate,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 특수화물 운임
    const specialRate = await page.evaluate(() => {
      const element = document.querySelector('.special-cargo-index .current-rate');
      return element ? element.textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "특수화물 운임",
      value: specialRate,
      date: new Date().toISOString().split('T')[0]
    });
    
    // 위험물 운임
    const hazardousRate = await page.evaluate(() => {
      const element = document.querySelector('.hazardous-cargo-index .current-rate');
      return element ? element.textContent.trim() : 'N/A';
    });
    
    results.push({
      name: "위험물 운임",
      value: hazardousRate,
      date: new Date().toISOString().split('T')[0]
    });
    
    logger.info(`주요 화물별 운임 정보 수집 완료: ${results.length}개`);
    return results;
  } catch (error) {
    logger.error(`주요 화물별 운임 정보 수집 중 오류: ${error.message}`);
    return [];
  }
}

// ===== 데이터 수집 및 처리 함수 =====

// 모든 데이터 수집 함수
async function collectAllData() {
  logger.info('데이터 수집 시작...');
  let allData = [];
  let driver;
  let browser;
  let page;
  
  try {
    // 셀레니움 드라이버 초기화
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    // 퍼펫티어 브라우저 초기화
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    // 각 데이터 소스별 스크래핑
    for (const source of dataSources) {
      logger.info(`${source.name} 데이터 수집 시작...`);
      let sourceData = [];
      
      // 소스별 스크래핑 방법 분기
      if (source.method === 'selenium') {
        if (source.name === 'Baltic Exchange') {
          sourceData = await scrapeWithSelenium(source);
        } else if (source.name === '나용선료 지수') {
          sourceData = await scrapeBareBoatRates(driver, source);
        }
      } else if (source.method === 'puppeteer') {
        if (source.name === '상하이 컨테이너 운임 지수') {
          sourceData = await scrapeWithPuppeteer(source);
        } else if (source.name === '벙커유 가격') {
          sourceData = await scrapeWithPuppeteer(source);
        } else if (source.name === '신조선 가격 지수') {
          sourceData = await scrapeNewbuildPrices(page, source);
        } else if (source.name === '중고선 가격 지수') {
          sourceData = await scrapeSecondhandPrices(page, source);
        } else if (source.name === '정기용선료 지수') {
          sourceData = await scrapeTimecharter(page, source);
        } else if (source.name === '주요 항구별 운임 정보') {
          sourceData = await scrapePortFreightRates(page, source);
        } else if (source.name === '주요 화물별 운임 정보') {
          sourceData = await scrapeCargoFreightRates(page, source);
        }
      }
      
      allData = [...allData, ...sourceData];
      logger.info(`${source.name} 데이터 수집 완료: ${sourceData.length}개`);
    }
    
    // 모든 데이터 취합 및 저장
    if (allData.length > 0) {
      // 현재 날짜 기준 파일명 생성
      const today = new Date().toISOString().split('T')[0];
      const filename = path.join(dataDir, `shipping_data_${today}.json`);
      
      // 기존 데이터가 있으면 합치기
      let existingData = [];
      if (fs.existsSync(filename)) {
        existingData = JSON.parse(fs.readFileSync(filename, 'utf8'));
        
        // 중복 제거 (같은 날짜, 같은 지수명 데이터)
        const existingMap = new Map(existingData.map(item => [item.name, item]));
        for (const item of allData) {
          existingMap.set(item.name, item);
        }
        allData = Array.from(existingMap.values());
      }
      
      // 데이터 저장
      fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
      logger.info(`총 ${allData.length}개 데이터 저장 완료: ${filename}`);
      
      // 구독자들에게 이메일 발송
      if (subscribedEmails.length > 0) {
        await sendDataReport(allData, subscribedEmails);
      }
    } else {
      logger.warn('수집된 데이터가 없습니다.');
    }
    
    return allData;
  } catch (error) {
    logger.error(`데이터 수집 중 오류 발생: ${error.message}`);
    return [];
  } finally {
    // 리소스 정리
    if (driver) {
      await driver.quit();
    }
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// 메일 전송 함수 (실제 구현 필요)
function sendEmailsToSubscribers(emails, data, timestamp) {
  // nodemailer 등을 이용한 이메일 전송 구현
  logger.info(`이메일 전송 기능은 아직 구현되지 않았습니다.`);
}

// 이메일 구독 처리 (POST /subscribe)
app.post('/subscribe', isAuthenticated, (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).send('유효한 이메일 주소를 입력해주세요.');
  }
  
  if (!subscribedEmails.includes(email)) {
    subscribedEmails.push(email);
    fs.writeFileSync(
      path.join(dataDir, 'emails.json'),
      JSON.stringify(subscribedEmails)
    );
    logger.info(`새 이메일 구독 추가됨: ${email}`);
  }
  
  res.status(200).send(`${email} 주소로 데이터 보고서를 전송하도록 설정되었습니다.`);
});

// 이메일 구독 해제 (POST /unsubscribe)
app.post('/unsubscribe', (req, res) => {
  const { email } = req.body;
  
  subscribedEmails = subscribedEmails.filter(e => e !== email);
  fs.writeFileSync(
    path.join(dataDir, 'emails.json'),
    JSON.stringify(subscribedEmails)
  );
  
  logger.info(`이메일 구독 해제됨: ${email}`);
  res.status(200).send(`${email} 주소가 구독 목록에서 제거되었습니다.`);
});

// 수동 데이터 수집 트리거 (POST /collect)
app.post('/collect', isAuthenticated, async (req, res) => {
  try {
    logger.info('수동 데이터 수집 시작...');
    const result = await collectAllData();
    res.status(200).json({ 
      success: true, 
      message: '데이터 수집 완료', 
      count: result.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`수동 데이터 수집 실패: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: '데이터 수집 실패', 
      error: error.message 
    });
  }
});

// 데이터 수집 API (GET /api/data)
app.get('/api/data', isAuthenticated, async (req, res) => {
  try {
    // 실제 데이터 수집 시도
    const collectedData = await collectAllData();
    
    // 수집된 데이터가 있으면 사용, 없으면 기본 데이터 사용
    if (collectedData && collectedData.length > 0) {
      shippingData = collectedData;
    }
    
    res.json(shippingData);
  } catch (error) {
    logger.error('데이터 제공 중 오류:', error);
    // 오류 발생 시에도 기본 데이터 반환
    res.json(shippingData);
  }
});

// 데이터 수집 트리거 API (GET /collect)
app.get('/collect', isAuthenticated, async (req, res) => {
  try {
    shippingData = await collectAllData();
    res.json({ message: '데이터 수집 완료', timestamp: new Date() });
  } catch (error) {
    logger.error('데이터 수집 중 오류:', error);
    res.status(500).send('데이터 수집 중 오류가 발생했습니다.');
  }
});

// GET /api/sources - 데이터 소스 목록 조회
app.get('/api/sources', (req, res) => {
  const sourcesInfo = dataSources.map(source => ({
    name: source.name,
    url: source.url,
    indices: source.indices.map(index => index.name)
  }));
  
  res.json(sourcesInfo);
});

// GET /download - 보호된 CSV 파일 다운로드 API
app.get('/download', isAuthenticated, (req, res) => {
  try {
    // 최신 CSV 파일 찾기
    const files = fs.readdirSync(dataDir);
    const csvFiles = files.filter(f => f.endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      // CSV 파일이 없으면 새로 생성
      return collectAllData().then(() => {
        // 최신 CSV 파일 찾기
        const updatedFiles = fs.readdirSync(dataDir);
        const updatedCsvFiles = updatedFiles.filter(f => f.endsWith('.csv'));
        
        if (updatedCsvFiles.length === 0) {
          return res.status(404).send('데이터 파일을 찾을 수 없습니다.');
        }
        
        // 가장 최근 파일
        const latestFile = updatedCsvFiles.sort().pop();
        const csvPath = path.join(dataDir, latestFile);
        
        res.setHeader('Content-disposition', `attachment; filename=${latestFile}`);
        res.setHeader('Content-Type', 'text/csv');
        
        // 파일 스트림으로 전송
        const fileStream = fs.createReadStream(csvPath);
        fileStream.pipe(res);
      }).catch(error => {
        logger.error(`데이터 수집 및 CSV 생성 실패: ${error.message}`);
        res.status(500).send('데이터 파일 생성 중 오류가 발생했습니다.');
      });
    }
    
    // 가장 최근 파일
    const latestFile = csvFiles.sort().pop();
    const csvPath = path.join(dataDir, latestFile);
    
    res.setHeader('Content-disposition', `attachment; filename=${latestFile}`);
    res.setHeader('Content-Type', 'text/csv');
    
    // 파일 스트림으로 전송
    const fileStream = fs.createReadStream(csvPath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error(`파일 다운로드 오류: ${error.message}`);
    res.status(500).send('파일 다운로드 중 오류가 발생했습니다.');
  }
});

// 최초 실행 시 데이터 수집 (서버 시작 후)
let isInitialDataCollected = false;

// 서버 시작 완료 후 초기 데이터 수집
app.on('ready', () => {
  setTimeout(async () => {
    if (!isInitialDataCollected) {
      logger.info('서버 시작 후 초기 데이터 수집 시작...');
      try {
        await collectAllData();
        isInitialDataCollected = true;
        logger.info('초기 데이터 수집 완료');
      } catch (error) {
        logger.error(`초기 데이터 수집 실패: ${error.message}`);
      }
    }
  }, 5000); // 서버 시작 5초 후 데이터 수집 시작
});

// 매일 오전 9시와 오후 3시에 데이터 수집 스케줄링
cron.schedule('0 9,15 * * *', async () => {
  logger.info('정기 데이터 수집 시작 (예약된 작업)');
  try {
    await collectAllData();
    logger.info('정기 데이터 수집 완료');
  } catch (error) {
    logger.error(`정기 데이터 수집 실패: ${error.message}`);
  }
});

// 서버 실행
const server = app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
  logger.info(`서버 시작됨 (포트: ${PORT})`);
  
  // 서버 준비 이벤트 발생
  app.emit('ready');
});
