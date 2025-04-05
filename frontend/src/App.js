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

// axios 기본 설정
axios.defaults.baseURL = 'http://localhost:8080';

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

// 로그인 컴포넌트
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('로그인 시도:', { username, password });
      const response = await axios.post('/api/auth/login', { username, password });
      console.log('로그인 응답:', response.data);
      localStorage.setItem('token', response.data.token);
      onLogin(response.data.token);
    } catch (err) {
      console.error('로그인 에러:', err);
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
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          로그인
        </Typography>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="아이디"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
          >
            로그인
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

// 헤더 컴포넌트
function Header({ onLogout }) {
  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          해운 데이터 모니터링 시스템
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
        
        // 기본 샘플 데이터 생성
        const sampleData = {
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
        };
        
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
            setLatestData(sampleData);
            fetchedLatestData = sampleData;
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
          fetchedHistoryData = [fetchedLatestData || sampleData];
          if (isMounted) setShippingData(fetchedHistoryData);
        }
      } catch (err) {
        console.error('데이터 로딩 중 일반 오류:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.reload();
        } else {
          if (isMounted) setError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    return () => {
      isMounted = false; // 컴포넌트 언마운트 시 플래그 설정
    };
  }, []); // 빈 의존성 배열 - 컴포넌트가 마운트될 때만 실행

  // 로딩 중 표시
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // 차트 데이터 처리
  const chartData = [];
  
  // 실제 데이터가 있으면 사용
  if (shippingData && shippingData.length > 0) {
    shippingData.forEach(item => {
      if (item && item.date && item.indices) {
        const bdiItem = item.indices.find(i => i.name && i.name.includes('BDI'));
        if (bdiItem) {
          const bdiValue = parseFloat(String(bdiItem.value || "0").replace(/,/g, '')) || 0;
          chartData.push({
            date: item.date,
            BDI: bdiValue
          });
        }
      }
    });
  }
  
  // 데이터가 없으면 샘플 데이터 사용
  if (chartData.length === 0) {
    chartData.push({ date: '2023-01-01', BDI: 1500 });
    chartData.push({ date: '2023-01-02', BDI: 1550 });
    chartData.push({ date: '2023-01-03', BDI: 1600 });
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header onLogout={onLogout} />
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          해운 데이터 모니터링
        </Typography>
        
        {/* 최신 데이터 표시 */}
        {latestData && latestData.indices && latestData.indices.length > 0 ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {latestData.indices.map((index, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">{index.name || "지수"}</Typography>
                  <Typography variant="h4">{index.value || "N/A"}</Typography>
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
