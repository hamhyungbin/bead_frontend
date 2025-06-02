import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api'; //
import { TextField, Typography, Box, CircularProgress, Alert } from '@mui/material'; // MUI //
import { debounce } from 'lodash'; //

// IP Geolocation API 엔드포인트 (예시)
const IP_GEOLOCATION_API_URL = 'http://ip-api.com/json';

function WeatherWidget({ initialCity, onCityChange }) {
  // `city`는 실제로 날씨를 가져올 대상 도시, `inputCity`는 텍스트 필드에 표시되는 값입니다.
  const [city, setCity] = useState(initialCity || ''); // 초기 city를 빈 문자열로 설정하여 자동 감지 로직을 명확히 합니다.
  const [inputCity, setInputCity] = useState(initialCity || ''); //
  const [weatherData, setWeatherData] = useState(null); //
  const [loading, setLoading] = useState(true); // 초기 로딩 상태 true
  const [error, setError] = useState(null); //
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // 날씨 정보 가져오기 함수
  const fetchWeather = useCallback(async (currentCity) => {
    if (!currentCity) {
      setError("Please enter a city name.");
      setWeatherData(null);
      setLoading(false);
      return;
    }
    setLoading(true); //
    setError(null); //
    try {
      const response = await api.get(`/api/weather?city=${encodeURIComponent(currentCity)}`); //
      setWeatherData(response.data); //
    } catch (err) {
      setError(err.response?.data?.msg || `Failed to fetch weather for ${currentCity}`); //
      setWeatherData(null); //
    } finally {
      setLoading(false); //
    }
  }, []); //

  // 초기 마운트 시 IP 기반 도시 자동 감지 또는 initialCity 사용
  useEffect(() => {
    const initializeCity = async () => {
      setIsAutoDetecting(true);
      setLoading(true);
      if ((!initialCity || initialCity.toLowerCase() === 'seoul') && initialCity !== "") { // 명시적으로 빈 문자열이 아니면서, 기본값이거나 설정 안된 경우
        try {
          const geoResponse = await fetch(IP_GEOLOCATION_API_URL);
          if (!geoResponse.ok) {
            throw new Error('Geolocation API request failed');
          }
          const geoData = await geoResponse.json();
          if (geoData.status === 'success' && geoData.city) {
            const detectedCity = geoData.city;
            setInputCity(detectedCity);
            setCity(detectedCity);
            if (onCityChange && typeof onCityChange === 'function') {
              onCityChange(detectedCity);
            }
          } else {
            // 자동 감지 실패 시 initialCity (또는 기본 'Seoul') 사용
            const fallbackCity = initialCity || 'Seoul';
            setInputCity(fallbackCity);
            setCity(fallbackCity);
            // onCityChange(fallbackCity); // 이 경우엔 이미 initialCity이므로 호출 불필요할 수 있음
          }
        } catch (geoError) {
          console.error("Error auto-detecting city:", geoError);
          setError("Could not auto-detect city. Showing weather for Seoul."); // 사용자에게 알림
          const fallbackCity = initialCity || 'Seoul';
          setInputCity(fallbackCity);
          setCity(fallbackCity);
        } finally {
          setIsAutoDetecting(false);
          // setLoading(false); // fetchWeather에서 최종적으로 false로 설정됨
        }
      } else if (initialCity) { // 명시적인 initialCity가 있는 경우
        setInputCity(initialCity);
        setCity(initialCity);
        setIsAutoDetecting(false);
        // setLoading(false);
      } else { // initialCity가 아예 없는 경우 (예: 새 위젯 추가 직후)
        setIsAutoDetecting(false);
        setLoading(false); // 아무것도 안하고 로딩 종료
        setError("Enter a city to see the weather.");
      }
    };

    initializeCity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCity, onCityChange]); // fetchWeather는 city 변경 시 호출되므로 의존성 배열에서 제외

  // 'city' 상태가 변경되면 날씨 정보를 가져옵니다. (자동 감지 또는 사용자 입력에 의해)
  useEffect(() => {
    if (city && !isAutoDetecting) { // 자동 감지 중에는 중복 호출 방지
      fetchWeather(city);
    } else if (!city && !isAutoDetecting && !initialCity) {
        setLoading(false); // 도시가 없고, 자동감지 중도 아니고, 초기 도시도 없으면 로딩 중단
    }
  }, [city, fetchWeather, isAutoDetecting, initialCity]);

  // 디바운싱된 도시 업데이트 함수
  const debouncedCityUpdate = useCallback(
    debounce((newCity) => {
      if (newCity.trim() === "") {
        setError("Please enter a city name.");
        // setWeatherData(null); // 데이터를 지우거나, 이전 데이터 유지 선택
        return;
      }
      setCity(newCity); // fetchWeather는 city 상태 변경 시 useEffect에 의해 호출됨 //
      if (onCityChange && typeof onCityChange === 'function') {
        onCityChange(newCity); // 대시보드 페이지의 위젯 설정을 업데이트 //
      }
    }, 1000), // 1초 디바운스 //
    [onCityChange] //
  );

  // 입력 필드 변경 핸들러
  const handleInputChange = (e) => {
    const newTypedCity = e.target.value;
    setInputCity(newTypedCity); //
    if (newTypedCity.trim() !== "") {
      setError(null); // 입력 시작 시 에러 메시지 클리어
      debouncedCityUpdate(newTypedCity); //
    } else {
      // Optional: Clear weather data if input is empty, or show specific message
      // setWeatherData(null);
      // setError("City name cannot be empty.");
      debouncedCityUpdate.cancel(); // 입력이 비워지면 디바운스된 호출 취소
    }
  };

  return (
    <Box className="flex flex-col space-y-2 p-1"> {/* Add some padding if needed */}
      <TextField
        label="City"
        variant="outlined"
        size="small"
        value={inputCity}
        onChange={handleInputChange}
        className="mb-2" //
        fullWidth // Ensure TextField takes full width of its container
      />
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {error && !loading && <Alert severity="error" className="w-full">{error}</Alert>} {/* 로딩 중 아닐 때만 에러 표시 */}
      {weatherData && !loading && !error && ( // 데이터가 있고, 로딩 중 아니고, 에러도 없을 때
        <Box className="text-sm">
          <Typography variant="h6" className="font-semibold" sx={{ wordBreak: 'break-word' }}>
            {weatherData.name}, {weatherData.sys?.country}
          </Typography>
          <Typography sx={{ wordBreak: 'break-word' }}>
            Temperature: {weatherData.main?.temp}°C (Feels like: {weatherData.main?.feels_like}°C)
          </Typography>
          <Typography sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', wordBreak: 'break-word' }}>
            Weather: {weatherData.weather?.[0]?.description}
            {weatherData.weather?.[0]?.icon && (
              <img
                src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`} // HTTPS 및 @2x 아이콘 사용
                alt={weatherData.weather[0].description}
                className="inline-block ml-1"
                style={{width: '24px', height: '24px'}} // 크기 고정
              />
            )}
          </Typography>
          <Typography>Humidity: {weatherData.main?.humidity}%</Typography>
          <Typography>Wind: {weatherData.wind?.speed} m/s</Typography>
        </Box>
      )}
      {!loading && !weatherData && !error && initialCity === "" && ( // 로딩 아니고, 데이터 없고, 에러 없고, 초기 도시도 없을 때
        <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Search for a city to get weather information.
        </Typography>
      )}
    </Box>
  );
}

export default WeatherWidget;
