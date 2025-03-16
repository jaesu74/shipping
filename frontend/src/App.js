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
  const [currentPage, setCurrentPage] = useState(1);
  const [currentDate, setCurrentDate] = useState('');
  const [email, setEmail] = useState('');
  const [itemsPerPage] = useState(40);
  const [lastUpdated, setLastUpdated] = useState('');
  const [sourceCategories, setSourceCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 백엔드 서버 기본 URL (최신 주소로 업데이트)
  const BASE_URL = 'http://localhost:5000';
  const API_DATA = `${BASE_URL}/api/data`;
  const API_LOGIN = `${BASE_URL}/login`;
  const API_LOGOUT = `${BASE_URL}/logout`;
  const API_SOURCES = `${BASE_URL}/api/sources`;
  const API_SUBSCRIBE = `${BASE_URL}/subscribe`;
  const API_COLLECT = `${BASE_URL}/collect`;

  // 페이지네이션 계산
  const filteredData = selectedCategory === 'all' 
    ? data 
    : data.filter(item => {
        const category = item["지수명"].toLowerCase().includes(selectedCategory.toLowerCase());
        return category;
      });
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // 페이지 변경 핸들러
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // 카테고리 변경 핸들러
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 이동
  };

  // 데이터 수집 및 이메일 발송 함수
  const collectAndSendData = () => {
    setLoading(true);
    
    // 백엔드에 이메일 등록 및 보고서 요청
    fetch(API_SUBSCRIBE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('이메일 등록 실패');
        }
        return response.text();
      })
      .then(text => {
        alert(`${email}으로 해운 데이터 보고서가 설정되었습니다.`);
        setLoading(false);
      })
      .catch(err => {
        console.error('이메일 등록 오류:', err.message);
        setError(err.message);
        setLoading(false);
      });
  };

  // 수동 데이터 수집 요청 함수
  const triggerDataCollection = () => {
    if (!window.confirm('새로운 데이터를 수집하시겠습니까? 몇 분 정도 소요될 수 있습니다.')) {
      return;
    }
    
    setLoading(true);
    fetch(API_COLLECT, {
      method: 'POST',
      credentials: 'include',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('데이터 수집 요청 실패');
        }
        return response.json();
      })
      .then(result => {
        if (result.success) {
          alert(`데이터 수집 완료! ${result.count}개 항목이 수집되었습니다.`);
          fetchData(); // 새로운 데이터 가져오기
        } else {
          throw new Error(result.message || '알 수 없는 오류');
        }
      })
      .catch(err => {
        console.error('데이터 수집 요청 오류:', err.message);
        setError(err.message);
        setLoading(false);
      });
  };

  // 백엔드에서 데이터 불러오기 함수
  const fetchData = () => {
    console.log('데이터 요청 중...');
    fetch(API_DATA, { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log('응답 상태:', response.status);
        if (!response.ok) {
          throw new Error('데이터 가져오기 실패: ' + response.status);
        }
        return response.json();
      })
      .then(json => {
        console.log('받은 데이터:', json);
        
        setData(json);
        
        // 데이터 카테고리 추출
        const categories = new Set();
        json.forEach(item => {
          // 카테고리 구분 로직 (첫 단어 또는 특정 키워드 기준)
          const name = item["지수명"];
          if (name.includes('Baltic') || name.includes('BDI') || name.includes('BCI')) {
            categories.add('baltic');
          } else if (name.includes('Container') || name.includes('컨테이너') || name.includes('SCFI')) {
            categories.add('container');
          } else if (name.includes('벙커') || name.includes('bunker') || name.includes('VLSFO')) {
            categories.add('bunker');
          } else if (name.includes('Port') || name.includes('항만')) {
            categories.add('port');
          } else {
            categories.add('other');
          }
        });
        
        setSourceCategories(Array.from(categories));
        
        // 현재 날짜 설정
        const now = new Date();
        const formattedDate = now.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setCurrentDate(formattedDate);
        
        // 마지막 업데이트 시간
        if (json.length > 0 && json[0]["수집시간"]) {
          const timestamp = json[0]["수집시간"];
          const updateDate = new Date(timestamp);
          const formattedUpdated = updateDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          setLastUpdated(formattedUpdated);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('데이터 요청 오류:', err.message);
        setError(err.message);
        setLoading(false);
      });
  };

  // 컴포넌트 마운트 시 세션 유지 여부 확인
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
        
        // 데이터 카테고리 추출
        const categories = new Set();
        json.forEach(item => {
          // 카테고리 구분 로직 (첫 단어 또는 특정 키워드 기준)
          const name = item["지수명"];
          if (name.includes('Baltic') || name.includes('BDI') || name.includes('BCI')) {
            categories.add('baltic');
          } else if (name.includes('Container') || name.includes('컨테이너') || name.includes('SCFI')) {
            categories.add('container');
          } else if (name.includes('벙커') || name.includes('bunker') || name.includes('VLSFO')) {
            categories.add('bunker');
          } else if (name.includes('Port') || name.includes('항만')) {
            categories.add('port');
          } else {
            categories.add('other');
          }
        });
        
        setSourceCategories(Array.from(categories));
        
        // 현재 날짜 설정
        const now = new Date();
        const formattedDate = now.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setCurrentDate(formattedDate);
        
        // 마지막 업데이트 시간
        if (json.length > 0 && json[0]["수집시간"]) {
          const timestamp = json[0]["수집시간"];
          const updateDate = new Date(timestamp);
          const formattedUpdated = updateDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          setLastUpdated(formattedUpdated);
        }
        
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        
        // 현재 날짜 설정(로그인 화면에서도 날짜 표시)
        const now = new Date();
        const formattedDate = now.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setCurrentDate(formattedDate);
      });
  }, [API_DATA]);

  // 로그인 처리 함수
  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('로그인 시도 중...');
    fetch(API_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 세션 쿠키 전달
      body: JSON.stringify({ username, password }),
    })
      .then(res => {
        console.log('로그인 응답 상태:', res.status);
        if (!res.ok) {
          throw new Error('로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        return res.text();
      })
      .then(() => {
        console.log('로그인 성공, 데이터 요청 중...');
        setLoggedIn(true);
        // 로그인 성공 후 명시적으로 데이터 요청
        fetchData();
      })
      .catch(err => {
        console.error('로그인 오류:', err.message);
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

  // 이메일 입력 핸들러
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // 이메일 전송 핸들러
  const handleSubmitEmail = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      collectAndSendData();
    } else {
      alert('유효한 이메일 주소를 입력해주세요.');
    }
  };

  // 데이터 다운로드 핸들러
  const handleDownload = () => {
    window.location.href = `${BASE_URL}/download`;
  };

  return (
    <div className="App">
      <div className="ocean-wave"></div>
      <div className="date-display">
        <span>{currentDate}</span>
        {lastUpdated && <span className="last-updated">마지막 업데이트: {lastUpdated}</span>}
      </div>
      
      {!loggedIn ? (
        <div className="login-container">
          <h1 className="brand">해운 데이터 센터</h1>
          <p className="brand-subtitle">안전한 해상 물류 정보 플랫폼</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="사용자 아이디 입력"
              />
            </div>
            <div className="form-group">
              <label>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
              />
            </div>
            <button type="submit">로그인</button>
            {error && <p className="error">{error}</p>}
          </form>
        </div>
      ) : (
        <div className="data-container">
          <div className="header-controls">
            <button className="logout" onClick={handleLogout}>로그아웃</button>
            
            <div className="action-buttons">
              <button className="action-button refresh" onClick={triggerDataCollection}>
                데이터 새로고침
              </button>
              <button className="action-button download" onClick={handleDownload}>
                CSV 다운로드
              </button>
            </div>
            
            <div className="email-form">
              <form onSubmit={handleSubmitEmail}>
                <div className="form-group-inline">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="이메일 주소 입력"
                    required
                  />
                  <button type="submit" className="send-email">보고서 설정</button>
                </div>
              </form>
              <small>지정된 이메일로 일일 보고서를 전송합니다 (매일 2회 자동 업데이트)</small>
            </div>
          </div>
          
          {loading ? (
            <div className="loading">데이터를 불러오는 중입니다...</div>
          ) : error ? (
            <div className="error">오류: {error}</div>
          ) : (
            <>
              <h2>해운 데이터 현황</h2>
              
              {sourceCategories.length > 0 && (
                <div className="category-filter">
                  <button 
                    className={selectedCategory === 'all' ? 'active' : ''} 
                    onClick={() => handleCategoryChange('all')}
                  >
                    전체
                  </button>
                  {sourceCategories.map(category => (
                    <button 
                      key={category}
                      className={selectedCategory === category ? 'active' : ''}
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category === 'baltic' && '발틱 지수'}
                      {category === 'container' && '컨테이너 운임'}
                      {category === 'bunker' && '벙커유 가격'}
                      {category === 'port' && '항만 통계'}
                      {category === 'other' && '기타 지수'}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>지수명</th>
                      <th>지수값</th>
                      <th>변동폭</th>
                      <th>비고</th>
                      <th>기타</th>
                      <th>출처</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((row, index) => (
                      <tr key={index}>
                        <td>{row["지수명"]}</td>
                        <td>{row["지수값"]}</td>
                        <td className={row["변동폭"].includes('▲') ? 'positive' : 'negative'}>
                          {row["변동폭"]}
                        </td>
                        <td>{row["비고"]}</td>
                        <td>{row["기타"]}</td>
                        <td>
                          <a href={row["출처"]} target="_blank" rel="noopener noreferrer">
                            바로가기
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="pagination">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  이전
                </button>
                
                <span className="page-info">
                  {currentPage} / {totalPages} 페이지
                </span>
                
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  다음
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
