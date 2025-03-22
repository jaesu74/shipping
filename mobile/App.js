import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, Button, ActivityIndicator, FlatList, ScrollView, Alert, Dimensions, TouchableOpacity 
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LineChart } from 'react-native-chart-kit';

export default function App() {
  // 상태 변수 선언
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([
    { id: 'all', name: '전체' },
    { id: 'baltic', name: 'Baltic 지수' },
    { id: 'container', name: '컨테이너 지수' },
    { id: 'bunker', name: '벙커유 가격' },
    { id: 'newbuild', name: '신조선 가격' },
    { id: 'secondhand', name: '중고선 가격' },
    { id: 'charter', name: '정기용선료' },
    { id: 'bareboat', name: '나용선료' },
    { id: 'portfreight', name: '항구별 운임' },
    { id: 'cargofreight', name: '화물별 운임' }
  ]);

  // 백엔드 서버의 기본 URL (예시: 로컬 테스트 시 http://localhost:5000)
  // 실제 배포 시에는 고정 도메인 또는 ngrok URL 등으로 업데이트 하세요.
  const BASE_URL = 'https://api.ship.wvl.co.kr';
  const API_DATA = `${BASE_URL}/api/data`;
  const API_LOGIN = `${BASE_URL}/login`;
  const API_LOGOUT = `${BASE_URL}/logout`;

  // 데이터 불러오기 함수
  const fetchData = () => {
    setLoading(true);
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

  // 컴포넌트 마운트 시, 세션이 유지되면 데이터 불러오기 시도
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
      })
      .catch(() => {
        // 로그인 필요 상태 유지
      });
  }, [API_DATA]);

  // 로그인 처리 함수
  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 모두 입력하세요.');
      return;
    }
    setLoading(true);
    fetch(API_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 쿠키 전달
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

  // 데이터 다운로드 처리 함수 (텍스트 파일로 저장 후 공유)
  const handleDownload = async () => {
    if (!data || data.length === 0) {
      Alert.alert('다운로드 오류', '다운로드할 데이터가 없습니다.');
      return;
    }
    // 데이터를 CSV 형식으로 변환 (간단 예시)
    let csv = '지수명,지수값,변동폭,비고,기타\n';
    data.forEach(row => {
      csv += `${row["지수명"]},${row["지수값"]},${row["변동폭"]},${row["비고"]},${row["기타"]}\n`;
    });
    const fileUri = FileSystem.documentDirectory + 'data.csv';
    try {
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      Sharing.isAvailableAsync().then((available) => {
        if (available) {
          Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('다운로드 완료', 'CSV 파일이 저장되었습니다: ' + fileUri);
        }
      });
    } catch (err) {
      Alert.alert('파일 저장 오류', err.message);
    }
  };

  // 데이터 시각화를 위한 차트 데이터 생성 (예시: 각 행의 "지수값"을 숫자로 변환하여 사용)
  const chartData = {
    labels: data.map((row, index) => row["지수명"] || `Item ${index + 1}`),
    datasets: [
      {
        data: data.map(row => {
          const value = parseFloat(row["지수값"]);
          return isNaN(value) ? 0 : value;
        }),
      },
    ],
  };

  // 카테고리별 데이터 필터링 함수
  const filterDataByCategory = (data, category) => {
    if (category === 'all') return data;
    
    return data.filter(item => {
      const name = item.name || '';
      if (category === 'baltic' && (name.includes('Baltic') || name.includes('BDI') || name.includes('BCI'))) {
        return true;
      } else if (category === 'container' && (name.includes('Container') || name.includes('컨테이너') || name.includes('SCFI'))) {
        return true;
      } else if (category === 'bunker' && (name.includes('벙커') || name.includes('bunker') || name.includes('VLSFO'))) {
        return true;
      } else if (category === 'newbuild' && (name.includes('신조선') || name.includes('Newbuild'))) {
        return true;
      } else if (category === 'secondhand' && (name.includes('중고선') || name.includes('Secondhand'))) {
        return true;
      } else if (category === 'charter' && (name.includes('용선료') || name.includes('Charter') || name.includes('TC'))) {
        return true;
      } else if (category === 'bareboat' && (name.includes('나용선') || name.includes('Bareboat') || name.includes('BB'))) {
        return true;
      } else if (category === 'portfreight' && ((name.includes('항구') || name.includes('Port')) && name.includes('운임'))) {
        return true;
      } else if (category === 'cargofreight' && ((name.includes('화물') || name.includes('Cargo')) && name.includes('운임'))) {
        return true;
      }
      return false;
    });
  };

  // 데이터 렌더링 로직 업데이트
  const filteredData = filterDataByCategory(data, selectedCategory);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Shipping Data</Text>
      {!loggedIn ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="아이디"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="로그인" onPress={handleLogin} />
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      ) : (
        <View>
          <Button title="로그아웃" onPress={handleLogout} />
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : error ? (
            <Text style={styles.error}>Error: {error}</Text>
          ) : (
            <View>
              <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        selectedCategory === category.id && styles.categoryButtonActive
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text 
                        style={[
                          styles.categoryText,
                          selectedCategory === category.id && styles.categoryTextActive
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <FlatList
                data={filteredData}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <Text style={styles.cell}>{item["지수명"]}</Text>
                    <Text style={styles.cell}>{item["지수값"]}</Text>
                    <Text style={styles.cell}>{item["변동폭"]}</Text>
                    <Text style={styles.cell}>{item["비고"]}</Text>
                    <Text style={styles.cell}>{item["기타"]}</Text>
                  </View>
                )}
                ListHeaderComponent={() => (
                  <View style={styles.row}>
                    <Text style={[styles.cell, styles.headerCell]}>지수명</Text>
                    <Text style={[styles.cell, styles.headerCell]}>지수값</Text>
                    <Text style={[styles.cell, styles.headerCell]}>변동폭</Text>
                    <Text style={[styles.cell, styles.headerCell]}>비고</Text>
                    <Text style={[styles.cell, styles.headerCell]}>기타</Text>
                  </View>
                )}
              />
              <View style={styles.buttonContainer}>
                <Button title="데이터 다운로드" onPress={handleDownload} />
              </View>
              <Text style={styles.chartTitle}>데이터 시각화 (지수값)</Text>
              {data.length > 0 && (
                <LineChart
                  data={chartData}
                  width={Dimensions.get('window').width - 20}
                  height={220}
                  yAxisLabel=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: "4", strokeWidth: "2", stroke: "#0000ff" },
                  }}
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  form: {
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 8,
    padding: 8,
    borderRadius: 4,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 5,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
  },
  headerCell: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 10,
  },
  categoryContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  categoryButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#000',
  },
  categoryText: {
    fontSize: 16,
  },
  categoryTextActive: {
    color: '#fff',
  },
});
