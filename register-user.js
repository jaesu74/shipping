// 사용자 등록 스크립트
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shipping';
console.log(`Connecting to MongoDB at ${MONGODB_URI.replace(/ship:.*@/, 'ship:****@')}`);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
}).then(() => {
  console.log('MongoDB 연결 성공');
  createUser();
}).catch((error) => {
  console.error('MongoDB 연결 실패:', error.message);
  console.error('MongoDB 연결 실패 세부 정보:', error.stack);
  process.exit(1);
});

// 사용자 스키마 정의
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
});

const User = mongoose.model('User', UserSchema);

// 사용자 생성 함수
async function createUser() {
  try {
    const username = 'admin';
    const password = 'admin123';

    // 이미 존재하는 사용자 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`사용자 '${username}'가 이미 존재합니다.`);
      process.exit(0);
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 새 사용자 생성
    const user = new User({
      username,
      password: hashedPassword,
      role: 'admin'
    });
    
    // 저장
    await user.save();
    console.log(`사용자 '${username}'가 성공적으로 생성되었습니다.`);
  } catch (error) {
    console.error('사용자 생성 중 오류:', error.message);
  } finally {
    // MongoDB 연결 종료
    mongoose.disconnect();
  }
} 