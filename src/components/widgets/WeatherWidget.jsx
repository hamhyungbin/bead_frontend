import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { TextField, Button, Typography, Box, CircularProgress, Alert } from '@mui/material'; // MUI
import { debounce } from 'lodash';

function WeatherWidget({ initialCity, onCityChange }) {
  const [city, setCity] = useState(initialCity || 'Seoul');
  const [inputCity, setInputCity] = useState(initialCity || 'Seoul');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (currentCity) => {
    if (!currentCity) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/weather?city=${encodeURIComponent(currentCity)}`);
      setWeatherData(response.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to fetch weather");
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(city);
  }, [city, fetchWeather]);

  const debouncedCityUpdate = useCallback(
    debounce((newCity) => {
      setCity(newCity); // This will trigger fetchWeather via useEffect
      onCityChange(newCity); // This updates the config in the DB
    }, 1000), // Update city after 1 second of inactivity
    [onCityChange]
  );

  const handleInputChange = (e) => {
    setInputCity(e.target.value);
    debouncedCityUpdate(e.target.value);
  };


  return (
    <Box className="flex flex-col space-y-2">
      <TextField
        label="City"
        variant="outlined"
        size="small"
        value={inputCity}
        onChange={handleInputChange}
        className="mb-2"
      />
      {loading && <CircularProgress size={24} className="self-center"/>}
      {error && <Alert severity="error" className="w-full">{error}</Alert>}
      {weatherData && !loading && (
        <Box className="text-sm">
          <Typography variant="h6" className="font-semibold">
            {weatherData.name}, {weatherData.sys?.country}
          </Typography>
          <Typography>
            Temperature: {weatherData.main?.temp}°C (Feels like: {weatherData.main?.feels_like}°C)
          </Typography>
          <Typography>
            Weather: {weatherData.weather?.[0]?.description}
            {weatherData.weather?.[0]?.icon && (
              <img
                src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`}
                alt={weatherData.weather[0].description}
                className="inline-block ml-1 w-6 h-6"
              />
            )}
          </Typography>
          <Typography>Humidity: {weatherData.main?.humidity}%</Typography>
          <Typography>Wind: {weatherData.wind?.speed} m/s</Typography>
        </Box>
      )}
    </Box>
  );
}

export default WeatherWidget;