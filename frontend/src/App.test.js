import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';

// axios 모킹
jest.mock('axios');

describe('App 컴포넌트 테스트', () => {
  beforeEach(() => {
    // localStorage 초기화
    localStorage.clear();
    // axios 모킹 초기화
    axios.mockReset();
  });

  test('로그인 페이지 렌더링', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    expect(screen.getByText('로그인')).toBeInTheDocument();
    expect(screen.getByLabelText('아이디')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  test('로그인 성공', async () => {
    // 로그인 API 응답 모킹
    axios.post.mockResolvedValueOnce({
      data: { token: 'test-token' }
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // 로그인 폼 입력
    fireEvent.change(screen.getByLabelText('아이디'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'testpass' }
    });

    // 로그인 버튼 클릭
    fireEvent.click(screen.getByText('로그인'));

    // 로그인 성공 후 대시보드로 이동 확인
    await waitFor(() => {
      expect(screen.getByText('해운 데이터 모니터링')).toBeInTheDocument();
    });
  });

  test('로그인 실패', async () => {
    // 로그인 API 에러 응답 모킹
    axios.post.mockRejectedValueOnce(new Error('로그인 실패'));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // 로그인 폼 입력
    fireEvent.change(screen.getByLabelText('아이디'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'wrongpass' }
    });

    // 로그인 버튼 클릭
    fireEvent.click(screen.getByText('로그인'));

    // 에러 메시지 표시 확인
    await waitFor(() => {
      expect(screen.getByText('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.')).toBeInTheDocument();
    });
  });

  test('대시보드 데이터 로딩', async () => {
    // 토큰 설정
    localStorage.setItem('token', 'test-token');

    // API 응답 모킹
    axios.get.mockResolvedValueOnce({
      data: {
        date: '2024-02-20',
        indices: [
          {
            name: 'BDI',
            value: '1000',
            change: '+10',
            source: 'Test'
          }
        ]
      }
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // 로딩 상태 확인
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // 데이터 로드 완료 후 확인
    await waitFor(() => {
      expect(screen.getByText('BDI')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('+10')).toBeInTheDocument();
    });
  });

  test('인증되지 않은 사용자 리다이렉트', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // 로그인 페이지로 리다이렉트 확인
    expect(screen.getByText('로그인')).toBeInTheDocument();
  });
});
