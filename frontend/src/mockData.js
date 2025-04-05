// mockData.js - 모의 데이터 모듈

// 모의 인증 데이터
export const MOCK_USERS = [
  { username: 'admin', password: 'admin123', token: 'admin-mock-token', role: 'admin' },
  { username: 'user', password: 'user123', token: 'user-mock-token', role: 'user' }
];

// 기본 해운 지수 데이터
export const MOCK_SHIPPING_INDICES = {
  date: "2023-04-05",
  indices: [
    // Baltic Exchange 지수
    { name: "BDI (Baltic Dry Index)", value: "1,432", change: "+15", source: "Baltic Exchange", category: "baltic" },
    { name: "BCI (Baltic Capesize Index)", value: "1,876", change: "+23", source: "Baltic Exchange", category: "baltic" },
    { name: "BPI (Baltic Panamax Index)", value: "1,543", change: "+11", source: "Baltic Exchange", category: "baltic" },
    { name: "BSI (Baltic Supramax Index)", value: "1,107", change: "-5", source: "Baltic Exchange", category: "baltic" },
    { name: "BHSI (Baltic Handysize Index)", value: "654", change: "-3", source: "Baltic Exchange", category: "baltic" },
    { name: "BDTI (Baltic Dirty Tanker Index)", value: "876", change: "+32", source: "Baltic Exchange", category: "baltic" },
    
    // 상하이 컨테이너 운임 지수
    { name: "SCFI 종합지수", value: "834.23", change: "-12.5", source: "상하이 컨테이너 운임 지수", category: "container" },
    
    // 벙커유 가격
    { name: "글로벌 평균 VLSFO", value: "$685.50", change: "-$2.5", source: "Ship & Bunker", category: "bunker" },
    { name: "싱가포르 VLSFO", value: "$703.50", change: "-$5.0", source: "Ship & Bunker", category: "bunker" },
    { name: "로테르담 VLSFO", value: "$635.00", change: "+$3.0", source: "Ship & Bunker", category: "bunker" },
    
    // 컨테이너 운임
    { name: "FBX (Freightos Baltic Index)", value: "$1,568", change: "+$102", source: "Freightos", category: "container" },
    { name: "WCI (Drewry World Container Index)", value: "$1,832", change: "+$87", source: "Drewry", category: "container" },
    
    // 항만 혼잡도
    { name: "부산항 혼잡도", value: "68%", change: "+2%", source: "항만 데이터", category: "congestion" },
    { name: "상해항 혼잡도", value: "76%", change: "+4%", source: "항만 데이터", category: "congestion" },
    { name: "로테르담항 혼잡도", value: "52%", change: "-5%", source: "항만 데이터", category: "congestion" },
  ]
};

// 선박 건조 가격 데이터
export const MOCK_NEWBUILDING_PRICES = [
  { type: "벌크선", size: "케이프사이즈 (180,000 DWT)", price: "$59.5M", change: "+$1.2M", shipyard: "한국/일본/중국" },
  { type: "벌크선", size: "파나막스 (82,000 DWT)", price: "$31.8M", change: "+$0.5M", shipyard: "한국/일본/중국" },
  { type: "벌크선", size: "수프라막스 (58,000 DWT)", price: "$28.2M", change: "+$0.3M", shipyard: "한국/일본/중국" },
  { type: "벌크선", size: "핸디사이즈 (38,000 DWT)", price: "$25.4M", change: "-$0.2M", shipyard: "한국/일본/중국" },
  
  { type: "탱커", size: "VLCC (300,000 DWT)", price: "$108.5M", change: "+$2.5M", shipyard: "한국/중국" },
  { type: "탱커", size: "수에즈막스 (158,000 DWT)", price: "$67.8M", change: "+$1.5M", shipyard: "한국/중국" },
  { type: "탱커", size: "아프라막스 (115,000 DWT)", price: "$53.2M", change: "+$0.8M", shipyard: "한국/일본/중국" },
  { type: "탱커", size: "MR (50,000 DWT)", price: "$37.5M", change: "+$0.4M", shipyard: "한국/일본/중국" },
  
  { type: "컨테이너선", size: "24,000 TEU", price: "$180.2M", change: "+$5.3M", shipyard: "한국/중국" },
  { type: "컨테이너선", size: "15,000 TEU", price: "$145.8M", change: "+$3.7M", shipyard: "한국/중국" },
  { type: "컨테이너선", size: "8,000 TEU", price: "$98.5M", change: "+$2.2M", shipyard: "한국/일본/중국" },
  { type: "컨테이너선", size: "2,500 TEU", price: "$42.3M", change: "+$0.8M", shipyard: "한국/일본/중국" },
  
  { type: "LNG선", size: "174,000 CBM", price: "$215.5M", change: "+$8.3M", shipyard: "한국" },
  { type: "LPG선", size: "VLGC (84,000 CBM)", price: "$82.7M", change: "+$2.2M", shipyard: "한국/일본" }
];

// 선박 중고 가격 데이터
export const MOCK_SECONDHAND_PRICES = [
  { type: "벌크선", size: "케이프사이즈 (180,000 DWT)", age: "5년", price: "$42.5M", change: "+$3.2M" },
  { type: "벌크선", size: "케이프사이즈 (180,000 DWT)", age: "10년", price: "$28.7M", change: "+$2.1M" },
  { type: "벌크선", size: "파나막스 (82,000 DWT)", age: "5년", price: "$23.8M", change: "+$1.2M" },
  { type: "벌크선", size: "파나막스 (82,000 DWT)", age: "10년", price: "$16.5M", change: "+$0.7M" },
  
  { type: "탱커", size: "VLCC (300,000 DWT)", age: "5년", price: "$85.2M", change: "+$3.5M" },
  { type: "탱커", size: "VLCC (300,000 DWT)", age: "10년", price: "$58.5M", change: "+$2.2M" },
  { type: "탱커", size: "아프라막스 (115,000 DWT)", age: "5년", price: "$42.3M", change: "+$1.4M" },
  { type: "탱커", size: "MR (50,000 DWT)", age: "5년", price: "$28.7M", change: "+$0.8M" },
  
  { type: "컨테이너선", size: "8,000 TEU", age: "5년", price: "$75.2M", change: "+$4.7M" },
  { type: "컨테이너선", size: "2,500 TEU", age: "5년", price: "$32.5M", change: "+$1.8M" },
  
  { type: "LNG선", size: "160,000 CBM", age: "5년", price: "$180.5M", change: "+$7.3M" },
  { type: "LPG선", size: "VLGC (84,000 CBM)", age: "5년", price: "$65.2M", change: "+$3.1M" }
];

// 전세계 벙커유 가격 데이터
export const MOCK_BUNKER_PRICES = [
  // 원유 가격
  { type: "원유", location: "WTI", price: "$76.25/배럴", change: "+$1.32", date: "2023-04-05" },
  { type: "원유", location: "Brent", price: "$78.48/배럴", change: "+$1.05", date: "2023-04-05" },
  { type: "원유", location: "Dubai", price: "$77.62/배럴", change: "+$0.98", date: "2023-04-05" },
  
  // 주요 항만별 벙커유 가격
  { type: "VLSFO", location: "싱가포르", price: "$703.50/톤", change: "-$5.00", date: "2023-04-05" },
  { type: "VLSFO", location: "로테르담", price: "$635.00/톤", change: "+$3.00", date: "2023-04-05" },
  { type: "VLSFO", location: "후지라", price: "$683.50/톤", change: "+$2.50", date: "2023-04-05" },
  { type: "VLSFO", location: "상해", price: "$712.00/톤", change: "-$4.50", date: "2023-04-05" },
  { type: "VLSFO", location: "홍콩", price: "$718.50/톤", change: "-$3.00", date: "2023-04-05" },
  
  { type: "MGO", location: "싱가포르", price: "$783.00/톤", change: "-$7.50", date: "2023-04-05" },
  { type: "MGO", location: "로테르담", price: "$742.50/톤", change: "+$2.00", date: "2023-04-05" },
  { type: "MGO", location: "후지라", price: "$765.50/톤", change: "+$1.50", date: "2023-04-05" },
  { type: "MGO", location: "상해", price: "$792.00/톤", change: "-$5.50", date: "2023-04-05" },
  
  { type: "IFO380", location: "싱가포르", price: "$498.00/톤", change: "-$6.50", date: "2023-04-05" },
  { type: "IFO380", location: "로테르담", price: "$475.50/톤", change: "+$1.50", date: "2023-04-05" },
  { type: "IFO380", location: "후지라", price: "$489.00/톤", change: "+$2.00", date: "2023-04-05" }
];

// 항만 혼잡도 상세 데이터
export const MOCK_PORT_CONGESTION = [
  // 아시아 지역
  { region: "아시아", port: "상해", congestion: "76%", vessels: 42, waitingTime: "3.2일", change: "+4%" },
  { region: "아시아", port: "싱가포르", congestion: "65%", vessels: 38, waitingTime: "2.8일", change: "+2%" },
  { region: "아시아", port: "부산", congestion: "68%", vessels: 35, waitingTime: "2.5일", change: "+2%" },
  { region: "아시아", port: "홍콩", congestion: "72%", vessels: 33, waitingTime: "3.0일", change: "+5%" },
  { region: "아시아", port: "닝보-저우산", congestion: "78%", vessels: 45, waitingTime: "3.5일", change: "+3%" },
  
  // 유럽 지역
  { region: "유럽", port: "로테르담", congestion: "52%", vessels: 28, waitingTime: "1.8일", change: "-5%" },
  { region: "유럽", port: "함부르크", congestion: "48%", vessels: 22, waitingTime: "1.5일", change: "-3%" },
  { region: "유럽", port: "앤트워프", congestion: "55%", vessels: 25, waitingTime: "2.0일", change: "-2%" },
  { region: "유럽", port: "발렌시아", congestion: "45%", vessels: 18, waitingTime: "1.2일", change: "-4%" },
  
  // 북미 지역
  { region: "북미", port: "로스앤젤레스", congestion: "63%", vessels: 32, waitingTime: "2.7일", change: "-8%" },
  { region: "북미", port: "롱비치", congestion: "58%", vessels: 28, waitingTime: "2.3일", change: "-6%" },
  { region: "북미", port: "뉴욕/뉴저지", congestion: "50%", vessels: 24, waitingTime: "1.8일", change: "-4%" },
  { region: "북미", port: "사바나", congestion: "45%", vessels: 20, waitingTime: "1.5일", change: "-5%" },
  
  // 남미 지역
  { region: "남미", port: "산토스", congestion: "62%", vessels: 25, waitingTime: "2.5일", change: "+1%" },
  { region: "남미", port: "부에노스아이레스", congestion: "58%", vessels: 22, waitingTime: "2.2일", change: "+2%" }
];

// 용선 가격 데이터 (1년 이하)
export const MOCK_TC_RATES_SHORT = [
  // 벌크선
  { type: "벌크선", size: "케이프사이즈 (180,000 DWT)", rate: "$24,500/일", change: "+$1,500", period: "6개월" },
  { type: "벌크선", size: "파나막스 (82,000 DWT)", rate: "$16,800/일", change: "+$800", period: "6개월" },
  { type: "벌크선", size: "수프라막스 (58,000 DWT)", rate: "$14,500/일", change: "+$500", period: "6개월" },
  { type: "벌크선", size: "핸디사이즈 (38,000 DWT)", rate: "$12,200/일", change: "+$300", period: "6개월" },
  
  // 탱커
  { type: "탱커", size: "VLCC (300,000 DWT)", rate: "$45,000/일", change: "+$3,500", period: "6개월" },
  { type: "탱커", size: "수에즈막스 (158,000 DWT)", rate: "$32,500/일", change: "+$2,800", period: "6개월" },
  { type: "탱커", size: "아프라막스 (115,000 DWT)", rate: "$28,000/일", change: "+$2,200", period: "6개월" },
  { type: "탱커", size: "MR (50,000 DWT)", rate: "$18,500/일", change: "+$1,200", period: "6개월" },
  
  // 컨테이너선
  { type: "컨테이너선", size: "8,500 TEU", rate: "$75,000/일", change: "+$5,000", period: "6개월" },
  { type: "컨테이너선", size: "4,250 TEU", rate: "$48,000/일", change: "+$3,500", period: "6개월" },
  { type: "컨테이너선", size: "2,500 TEU", rate: "$35,000/일", change: "+$2,500", period: "6개월" },
  { type: "컨테이너선", size: "1,700 TEU", rate: "$28,000/일", change: "+$1,800", period: "6개월" }
];

// 용선 가격 데이터 (1년 초과)
export const MOCK_TC_RATES_LONG = [
  // 벌크선
  { type: "벌크선", size: "케이프사이즈 (180,000 DWT)", rate: "$22,500/일", change: "+$1,200", period: "2-3년" },
  { type: "벌크선", size: "파나막스 (82,000 DWT)", rate: "$15,200/일", change: "+$600", period: "2-3년" },
  { type: "벌크선", size: "수프라막스 (58,000 DWT)", rate: "$13,800/일", change: "+$400", period: "2-3년" },
  { type: "벌크선", size: "핸디사이즈 (38,000 DWT)", rate: "$11,500/일", change: "+$200", period: "2-3년" },
  
  // 탱커
  { type: "탱커", size: "VLCC (300,000 DWT)", rate: "$42,000/일", change: "+$3,000", period: "2-3년" },
  { type: "탱커", size: "수에즈막스 (158,000 DWT)", rate: "$30,000/일", change: "+$2,500", period: "2-3년" },
  { type: "탱커", size: "아프라막스 (115,000 DWT)", rate: "$26,500/일", change: "+$2,000", period: "2-3년" },
  { type: "탱커", size: "MR (50,000 DWT)", rate: "$17,500/일", change: "+$1,000", period: "2-3년" },
  
  // 컨테이너선
  { type: "컨테이너선", size: "8,500 TEU", rate: "$70,000/일", change: "+$4,500", period: "2-3년" },
  { type: "컨테이너선", size: "4,250 TEU", rate: "$45,000/일", change: "+$3,000", period: "2-3년" },
  { type: "컨테이너선", size: "2,500 TEU", rate: "$32,000/일", change: "+$2,000", period: "2-3년" },
  { type: "컨테이너선", size: "1,700 TEU", rate: "$25,000/일", change: "+$1,500", period: "2-3년" }
];

// 지역별 운임 정보
export const MOCK_ROUTE_RATES = [
  // 컨테이너 운임
  { route: "중국-북유럽", vessel: "컨테이너선", size: "40ft", rate: "$1,785/FEU", change: "+$125", date: "2023-04-05" },
  { route: "중국-지중해", vessel: "컨테이너선", size: "40ft", rate: "$1,950/FEU", change: "+$150", date: "2023-04-05" },
  { route: "중국-서아프리카", vessel: "컨테이너선", size: "40ft", rate: "$2,830/FEU", change: "+$220", date: "2023-04-05" },
  { route: "중국-미동부", vessel: "컨테이너선", size: "40ft", rate: "$2,350/FEU", change: "+$180", date: "2023-04-05" },
  { route: "중국-미서부", vessel: "컨테이너선", size: "40ft", rate: "$1,880/FEU", change: "+$135", date: "2023-04-05" },
  { route: "중국-동남아", vessel: "컨테이너선", size: "40ft", rate: "$1,080/FEU", change: "+$65", date: "2023-04-05" },

  // 벌크 운임
  { route: "브라질-중국", vessel: "벌크선", size: "케이프사이즈", rate: "$18.35/톤", change: "+$1.25", date: "2023-04-05" },
  { route: "호주-중국", vessel: "벌크선", size: "케이프사이즈", rate: "$12.65/톤", change: "+$0.85", date: "2023-04-05" },
  { route: "미동부-중국", vessel: "벌크선", size: "파나막스", rate: "$35.80/톤", change: "+$2.15", date: "2023-04-05" },
  { route: "미서부-일본", vessel: "벌크선", size: "파나막스", rate: "$28.75/톤", change: "+$1.45", date: "2023-04-05" },

  // 탱커 운임
  { route: "중동-아시아", vessel: "탱커", size: "VLCC", rate: "WS 82.5", change: "+WS 5.0", date: "2023-04-05" },
  { route: "서아프리카-중국", vessel: "탱커", size: "수에즈막스", rate: "WS 95.0", change: "+WS 6.5", date: "2023-04-05" },
  { route: "발트해-북유럽", vessel: "탱커", size: "아프라막스", rate: "WS 105.0", change: "+WS 7.5", date: "2023-04-05" },
  { route: "카리브해-미동부", vessel: "탱커", size: "MR", rate: "WS 120.0", change: "+WS 8.0", date: "2023-04-05" }
];

// BDI 히스토리 차트용 모의 데이터
export const MOCK_BDI_CHART_DATA = [
  { date: '2023-10-01', BDI: 1320 },
  { date: '2023-10-08', BDI: 1350 },
  { date: '2023-10-15', BDI: 1380 },
  { date: '2023-10-22', BDI: 1410 },
  { date: '2023-10-29', BDI: 1395 },
  { date: '2023-11-05', BDI: 1370 },
  { date: '2023-11-12', BDI: 1350 },
  { date: '2023-11-19', BDI: 1320 },
  { date: '2023-11-26', BDI: 1310 },
  { date: '2023-12-03', BDI: 1330 },
  { date: '2023-12-10', BDI: 1355 },
  { date: '2023-12-17', BDI: 1385 },
  { date: '2023-12-24', BDI: 1410 },
  { date: '2023-12-31', BDI: 1425 },
  { date: '2024-01-07', BDI: 1445 },
  { date: '2024-01-14', BDI: 1432 },
  { date: '2024-01-21', BDI: 1417 },
  { date: '2024-01-28', BDI: 1405 },
  { date: '2024-02-04', BDI: 1420 },
  { date: '2024-02-11', BDI: 1438 },
  { date: '2024-02-18', BDI: 1455 },
  { date: '2024-02-25', BDI: 1430 },
  { date: '2024-03-03', BDI: 1418 },
  { date: '2024-03-10', BDI: 1432 },
];

// VLSFO 가격 히스토리 차트용 모의 데이터
export const MOCK_BUNKER_CHART_DATA = [
  { date: '2023-10-01', VLSFO: 620 },
  { date: '2023-10-08', VLSFO: 632 },
  { date: '2023-10-15', VLSFO: 645 },
  { date: '2023-10-22', VLSFO: 658 },
  { date: '2023-10-29', VLSFO: 650 },
  { date: '2023-11-05', VLSFO: 642 },
  { date: '2023-11-12', VLSFO: 638 },
  { date: '2023-11-19', VLSFO: 645 },
  { date: '2023-11-26', VLSFO: 653 },
  { date: '2023-12-03', VLSFO: 662 },
  { date: '2023-12-10', VLSFO: 670 },
  { date: '2023-12-17', VLSFO: 675 },
  { date: '2023-12-24', VLSFO: 682 },
  { date: '2023-12-31', VLSFO: 688 },
  { date: '2024-01-07', VLSFO: 690 },
  { date: '2024-01-14', VLSFO: 685 },
  { date: '2024-01-21', VLSFO: 680 },
  { date: '2024-01-28', VLSFO: 678 },
  { date: '2024-02-04', VLSFO: 682 },
  { date: '2024-02-11', VLSFO: 688 },
  { date: '2024-02-18', VLSFO: 692 },
  { date: '2024-02-25', VLSFO: 688 },
  { date: '2024-03-03', VLSFO: 683 },
  { date: '2024-03-10', VLSFO: 685 },
]; 