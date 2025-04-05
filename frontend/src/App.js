// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './App.css';

// axios 기본 설정 - 환경에 따라 동적으로 설정
const isProduction = window.location.hostname !== 'localhost';
axios.defaults.baseURL = isProduction 
  ? window.location.origin // GitHub Pages에서는 같은 도메인 사용
  : 'http://localhost:8080';

// 테마 설정
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// 모의 인증 데이터 (GitHub Pages 배포용)
const MOCK_USERS = [
  { username: 'admin', password: 'admin123', token: 'admin-mock-token' },
  { username: 'user', password: 'user123', token: 'user-mock-token' }
];

// 모의 데이터
const MOCK_SHIPPING_DATA = {
  date: new Date().toISOString().split('T')[0],
  indices: [
    { name: "BDI (Baltic Dry Index)", value: "1,432", change: "+15", source: "Baltic Exchange" },
    { name: "BCI (Baltic Capesize Index)", value: "1,876", change: "+23", source: "Baltic Exchange" },
    { name: "BPI (Baltic Panamax Index)", value: "1,543", change: "+11", source: "Baltic Exchange" },
    { name: "BSI (Baltic Supramax Index)", value: "1,107", change: "-5", source: "Baltic Exchange" },
    { name: "SCFI 종합지수", value: "834.23", change: "-12.5", source: "상하이 컨테이너 운임 지수" },
    { name: "글로벌 평균 VLSFO", value: "685.50", change: "-2.5", source: "벙커유 가격" },
    { name: "컨테이너 운임 (FEU)", value: "$2,430", change: "+$120", source: "컨테이너 운임" },
    { name: "부산항 혼잡도", value: "68%", change: "+2%", source: "항만 데이터" }
  ]
};

// 차트용 모의 데이터
const MOCK_CHART_DATA = [
  { date: '2023-11-01', BDI: 1200 },
  { date: '2023-11-08', BDI: 1250 },
  { date: '2023-11-15', BDI: 1340 },
  { date: '2023-11-22', BDI: 1380 },
  { date: '2023-11-29', BDI: 1320 },
  { date: '2023-12-06', BDI: 1410 },
  { date: '2023-12-13', BDI: 1380 },
  { date: '2023-12-20', BDI: 1432 },
  { date: '2023-12-27', BDI: 1410 },
  { date: '2024-01-03', BDI: 1367 },
  { date: '2024-01-10', BDI: 1432 },
];

// 로그인 컴포넌트
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('로그인 시도:', { username, password });
      
      // GitHub Pages 환경에서는 모의 인증 사용
      if (isProduction) {
        const mockUser = MOCK_USERS.find(
          user => user.username === username && user.password === password
        );
        
        if (mockUser) {
          console.log('모의 로그인 성공');
          localStorage.setItem('token', mockUser.token);
          localStorage.setItem('username', mockUser.username);
          setTimeout(() => {
            setLoading(false);
            onLogin(mockUser.token);
          }, 1000); // 실제 API 호출처럼 약간의 지연 추가
        } else {
          console.log('모의 로그인 실패');
          setTimeout(() => {
            setLoading(false);
            setError('아이디 또는 비밀번호가 올바르지 않습니다.');
          }, 1000);
        }
        return;
      }
      
      // 로컬 개발 환경에서는 실제 API 호출
      const response = await axios.post('/api/auth/login', { username, password });
      console.log('로그인 응답:', response.data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', username);
      setLoading(false);
      onLogin(response.data.token);
    } catch (err) {
      console.error('로그인 에러:', err);
      setLoading(false);
      
      if (err.response) {
        console.error('서버 응답:', err.response.data);
        setError(err.response.data.error || '로그인에 실패했습니다.');
      } else if (err.request) {
        console.error('요청 에러:', err.request);
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        console.error('기타 에러:', err.message);
        setError('로그인 요청 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(45deg, #f3f4f6 0%, #dbeafe 100%)',
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center" fontWeight="bold">
          해운 데이터 모니터링 시스템
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 3 }}>
          로그인
        </Typography>
        
        {error && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee', borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Paper>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="아이디"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 3, mb: 1, py: 1.2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : '로그인'}
          </Button>
          
          {isProduction && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
              테스트 계정: admin / admin123 또는 user / user123
            </Typography>
          )}
        </form>
      </Paper>
    </Box>
  );
}

// 헤더 컴포넌트
function Header({ onLogout }) {
  const username = localStorage.getItem('username') || '사용자';

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          해운 데이터 모니터링 시스템
        </Typography>
        <Typography variant="body2" sx={{ mr: 2 }}>
          {username}님 환영합니다
        </Typography>
        <IconButton color="inherit" onClick={onLogout} title="로그아웃">
          <ExitToAppIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

// 메인 대시보드 컴포넌트
function Dashboard({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shippingData, setShippingData] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const username = localStorage.getItem('username') || '사용자';

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        console.log('데이터 로딩 시작...');
        
        // GitHub Pages 환경에서는 모의 데이터 사용
        if (isProduction) {
          setTimeout(() => {
            if (isMounted) {
              setLatestData(MOCK_SHIPPING_DATA);
              setChartData(MOCK_CHART_DATA);
              setLoading(false);
            }
          }, 1000);
          return;
        }
        
        // 로컬 개발 환경에서는 실제 API 호출
        let fetchedLatestData = null;
        let fetchedHistoryData = [];
        
        // 최신 인덱스 데이터 가져오기
        try {
          const response = await axios.get('/api/indices/latest', config);
          console.log('최신 데이터 로드 성공:', response.data);
          fetchedLatestData = response.data;
          if (isMounted) setLatestData(response.data);
        } catch (latestError) {
          console.error('최신 데이터 로드 실패:', latestError);
          if (isMounted) {
            // 에러시 샘플 데이터 사용
            setLatestData(MOCK_SHIPPING_DATA);
            fetchedLatestData = MOCK_SHIPPING_DATA;
          }
        }
        
        // 모든 인덱스 데이터 가져오기
        try {
          const historyResponse = await axios.get('/api/indices', config);
          console.log('기록 데이터 로드 성공:', historyResponse.data);
          
          // 배열이 아닌 경우 배열로 변환
          fetchedHistoryData = Array.isArray(historyResponse.data) 
            ? historyResponse.data 
            : [historyResponse.data];
          
          if (isMounted) setShippingData(fetchedHistoryData);
        } catch (historyError) {
          console.error('기록 데이터 로드 실패:', historyError);
          // 기본 데이터 설정 (샘플 데이터의 배열)
          fetchedHistoryData = [fetchedLatestData || MOCK_SHIPPING_DATA];
          if (isMounted) setShippingData(fetchedHistoryData);
        }
      } catch (err) {
        console.error('데이터 로딩 에러:', err);
        if (isMounted) {
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header onLogout={onLogout} />
      <Container>
        <Typography variant="h5" gutterBottom>
          해운 시장 현황
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : latestData ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {latestData.indices.map((index, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {index.name}
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ mb: 1 }}>
                    {index.value}
                  </Typography>
                  <Typography 
                    color={index.change && index.change.startsWith('+') ? 'success.main' : 'error.main'}
                    variant="subtitle1"
                  >
                    {index.change || "0"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {index.source || "데이터 소스"}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 3, mb: 4, bgcolor: '#fff8e1' }}>
            <Typography color="warning.main">
              {error || "데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요."}
            </Typography>
          </Paper>
        )}

        {/* 차트 표시 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            BDI 추이
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="BDI" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

// 메인 App 컴포넌트
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const handleLogin = (token) => {
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
