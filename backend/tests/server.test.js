const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const ShippingData = require('../models/ShippingData');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await ShippingData.deleteMany({});
});

describe('인증 API 테스트', () => {
  test('사용자 등록', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        password: 'testpass'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('사용자가 생성되었습니다.');
  });

  test('중복 사용자 등록 방지', async () => {
    await User.create({
      username: 'testuser',
      password: 'testpass'
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        password: 'testpass'
      });
    
    expect(response.status).toBe(500);
  });

  test('로그인 성공', async () => {
    await User.create({
      username: 'testuser',
      password: '$2a$10$testhash' // bcrypt로 해시된 비밀번호
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test('잘못된 비밀번호로 로그인 실패', async () => {
    await User.create({
      username: 'testuser',
      password: '$2a$10$testhash'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'wrongpass'
      });
    
    expect(response.status).toBe(401);
  });
});

describe('데이터 API 테스트', () => {
  let token;

  beforeEach(async () => {
    const user = await User.create({
      username: 'testuser',
      password: '$2a$10$testhash'
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass'
      });

    token = loginResponse.body.token;
  });

  test('인증된 사용자만 데이터 접근 가능', async () => {
    const response = await request(app)
      .get('/api/indices')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
  });

  test('인증되지 않은 사용자는 데이터 접근 불가', async () => {
    const response = await request(app)
      .get('/api/indices');
    
    expect(response.status).toBe(401);
  });

  test('데이터 저장 및 조회', async () => {
    const testData = {
      date: '2024-02-20',
      indices: [
        {
          name: 'BDI',
          value: '1000',
          change: '+10',
          source: 'Test'
        }
      ]
    };

    await ShippingData.create(testData);

    const response = await request(app)
      .get('/api/indices/2024-02-20')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.date).toBe(testData.date);
    expect(response.body.indices[0].name).toBe('BDI');
  });
}); 