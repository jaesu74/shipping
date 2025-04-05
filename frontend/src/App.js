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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './App.css';

// 모의 데이터 모듈 가져오기
import {
  MOCK_USERS,
  MOCK_SHIPPING_INDICES,
  MOCK_NEWBUILDING_PRICES,
  MOCK_SECONDHAND_PRICES,
  MOCK_BUNKER_PRICES,
  MOCK_PORT_CONGESTION,
  MOCK_TC_RATES_SHORT,
  MOCK_TC_RATES_LONG,
  MOCK_ROUTE_RATES,
  MOCK_BDI_CHART_DATA,
  MOCK_BUNKER_CHART_DATA
} from './mockData';

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
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Noto Sans KR',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)',
          borderRadius: 8,
        },
      },
    },
  },
});

// 탭 패널 컴포넌트
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

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
          localStorage.setItem('role', mockUser.role);
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
      localStorage.setItem('role', response.data.role || 'user');
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
  const role = localStorage.getItem('role') || 'user';

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          해운 데이터 모니터링 시스템
        </Typography>
        <Typography variant="body2" sx={{ mr: 2 }}>
          {username}님 ({role === 'admin' ? '관리자' : '일반사용자'})
        </Typography>
        <IconButton color="inherit" onClick={onLogout} title="로그아웃">
          <ExitToAppIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

// 대시보드 지수 표시용 컴포넌트
function IndexCard({ index }) {
  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {index.name}
      </Typography>
      <Typography variant="h5" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
        {index.value}
      </Typography>
      <Typography 
        color={index.change && index.change.startsWith('+') ? 'success.main' : 'error.main'}
        variant="subtitle1"
        sx={{ fontWeight: 'medium' }}
      >
        {index.change || "0"}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
        {index.source || "데이터 소스"}
      </Typography>
    </Paper>
  );
}

// 데이터 테이블 컴포넌트
function DataTable({ data, columns }) {
  return (
    <TableContainer component={Paper} sx={{ mb: 4 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            {columns.map((column, index) => (
              <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex} hover>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.key === 'change' && row[column.key] ? (
                    <Typography 
                      color={row[column.key].startsWith('+') ? 'success.main' : 'error.main'}
                      variant="body2"
                    >
                      {row[column.key]}
                    </Typography>
                  ) : (
                    row[column.key]
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// 선박 건조 가격 컴포넌트
function NewbuildingPrices() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>선박 건조 가격</Typography>
      <DataTable 
        data={MOCK_NEWBUILDING_PRICES}
        columns={[
          { key: 'type', label: '선종' },
          { key: 'size', label: '크기' },
          { key: 'price', label: '가격' },
          { key: 'change', label: '변동' },
          { key: 'shipyard', label: '건조 지역' }
        ]}
      />
    </Box>
  );
}

// 중고선 가격 컴포넌트
function SecondhandPrices() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>중고선 가격</Typography>
      <DataTable 
        data={MOCK_SECONDHAND_PRICES}
        columns={[
          { key: 'type', label: '선종' },
          { key: 'size', label: '크기' },
          { key: 'age', label: '선령' },
          { key: 'price', label: '가격' },
          { key: 'change', label: '변동' }
        ]}
      />
    </Box>
  );
}

// 벙커유 가격 컴포넌트
function BunkerPrices() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>벙커유 가격</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <DataTable 
            data={MOCK_BUNKER_PRICES}
            columns={[
              { key: 'type', label: '유종' },
              { key: 'location', label: '지역' },
              { key: 'price', label: '가격' },
              { key: 'change', label: '변동' },
              { key: 'date', label: '날짜' }
            ]}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>VLSFO 가격 추이</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={MOCK_BUNKER_CHART_DATA}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="VLSFO" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// 항만 혼잡도 컴포넌트
function PortCongestion() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>항만 혼잡도</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <DataTable 
            data={MOCK_PORT_CONGESTION}
            columns={[
              { key: 'region', label: '지역' },
              { key: 'port', label: '항만' },
              { key: 'congestion', label: '혼잡도' },
              { key: 'vessels', label: '대기 선박' },
              { key: 'waitingTime', label: '평균 대기시간' },
              { key: 'change', label: '변동' }
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>지역별 항만 혼잡도</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { region: '아시아', congestion: 71.8 },
                    { region: '유럽', congestion: 50.0 },
                    { region: '북미', congestion: 54.0 },
                    { region: '남미', congestion: 60.0 }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="congestion" name="혼잡도 (%)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// 단기 용선료 컴포넌트
function ShortTermCharterRates() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>단기 용선료 (1년 이하)</Typography>
      <DataTable 
        data={MOCK_TC_RATES_SHORT}
        columns={[
          { key: 'type', label: '선종' },
          { key: 'size', label: '크기' },
          { key: 'rate', label: '용선료' },
          { key: 'change', label: '변동' },
          { key: 'period', label: '계약 기간' }
        ]}
      />
    </Box>
  );
}

// 장기 용선료 컴포넌트
function LongTermCharterRates() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>장기 용선료 (1년 초과)</Typography>
      <DataTable 
        data={MOCK_TC_RATES_LONG}
        columns={[
          { key: 'type', label: '선종' },
          { key: 'size', label: '크기' },
          { key: 'rate', label: '용선료' },
          { key: 'change', label: '변동' },
          { key: 'period', label: '계약 기간' }
        ]}
      />
    </Box>
  );
}

// 운임 정보 컴포넌트
function RouteRates() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>지역별 운임 정보</Typography>
      <DataTable 
        data={MOCK_ROUTE_RATES}
        columns={[
          { key: 'route', label: '항로' },
          { key: 'vessel', label: '선종' },
          { key: 'size', label: '크기' },
          { key: 'rate', label: '운임' },
          { key: 'change', label: '변동' },
          { key: 'date', label: '날짜' }
        ]}
      />
    </Box>
  );
}

// 메인 대시보드 컴포넌트
function Dashboard({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = () => {
      setLoading(true);
      
      // GitHub Pages에서는 모의 데이터 사용
      setTimeout(() => {
        if (isMounted) {
          setLatestData(MOCK_SHIPPING_INDICES);
          setChartData(MOCK_BDI_CHART_DATA);
          setLoading(false);
        }
      }, 1000);
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header onLogout={onLogout} />
      
      <Container maxWidth="xl">
        {/* 주요 지수 섹션 */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
          주요 해운 지수
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : latestData ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {latestData.indices.slice(0, 8).map((index, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <IndexCard index={index} />
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

        {/* BDI 차트 */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            BDI (Baltic Dry Index) 추이
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="BDI" stroke="#8884d8" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
        
        {/* 탭 섹션 */}
        <Paper sx={{ mb: 4, pb: 2 }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="건조 가격" />
            <Tab label="중고선 가격" />
            <Tab label="벙커유 가격" />
            <Tab label="항만 혼잡도" />
            <Tab label="단기 용선료" />
            <Tab label="장기 용선료" />
            <Tab label="지역별 운임" />
          </Tabs>
          
          <TabPanel value={tabIndex} index={0}>
            <NewbuildingPrices />
          </TabPanel>
          
          <TabPanel value={tabIndex} index={1}>
            <SecondhandPrices />
          </TabPanel>
          
          <TabPanel value={tabIndex} index={2}>
            <BunkerPrices />
          </TabPanel>
          
          <TabPanel value={tabIndex} index={3}>
            <PortCongestion />
          </TabPanel>
          
          <TabPanel value={tabIndex} index={4}>
            <ShortTermCharterRates />
          </TabPanel>
          
          <TabPanel value={tabIndex} index={5}>
            <LongTermCharterRates />
          </TabPanel>
          
          <TabPanel value={tabIndex} index={6}>
            <RouteRates />
          </TabPanel>
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
    localStorage.removeItem('role');
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
