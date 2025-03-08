// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 상태 변수 선언
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 백엔드 서버 기본 URL (최신 주소로 업데이트)
  const BASE_URL = 'http://localhost:5000';
  const API_DATA = `${BASE_URL}/api/data`;
  const API_LOGIN = `${BASE_URL}/login`;
  const API_LOGOUT = `${BASE_URL}/logout`;

  // 백엔드에서 데이터 불러오기 함수
  const fetchData = () => {
    fetch(API_DATA, { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          throw new Error('데이터 가져오기 실패');
        }
        return response.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  // 컴포넌트 마운트 시, 세션 유지 여부 확인 (세션이 살아 있다면 데이터 로드)
  useEffect(() => {
    console.log('Fetching data from:', API_DATA);
    fetch(API_DATA, { credentials: 'include' })
      .then(response => {
        console.log('응답 상태:', response.status);
        if (response.ok) return response.json();
        else throw new Error('세션 만료 또는 로그인 필요');
      })
      .then(json => {
        setLoggedIn(true);
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [API_DATA]);

  // 로그인 처리 함수
  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch(API_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 세션 쿠키 전달
      body: JSON.stringify({ username, password }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        return res.text();
      })
      .then(() => {
        setLoggedIn(true);
        fetchData();
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    fetch(API_LOGOUT, { credentials: 'include' })
      .then(() => {
        setLoggedIn(false);
        setData([]);
      })
      .catch(err => console.error('로그아웃 오류:', err));
  };

  return (
    <div className="App">
      <h1>Shipping Data</h1>
      {!loggedIn ? (
        <form onSubmit={handleLogin}>
          <div>
            <label>아이디: </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label>비밀번호: </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">로그인</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      ) : (
        <div>
          <button onClick={handleLogout}>로그아웃</button>
          {loading ? (
            <p>Loading data...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>Error: {error}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>지수명</th>
                  <th>지수값</th>
                  <th>변동폭</th>
                  <th>비고</th>
                  <th>기타</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index}>
                    <td>{row["지수명"]}</td>
                    <td>{row["지수값"]}</td>
                    <td>{row["변동폭"]}</td>
                    <td>{row["비고"]}</td>
                    <td>{row["기타"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
