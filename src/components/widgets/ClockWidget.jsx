// src/components/widgets/ClockWidget.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

function ClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
      </Typography>
      <Typography variant="body1" component="div">
        {currentTime.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
      </Typography>
      <Typography variant="caption" component="div">
        {currentTime.toLocaleDateString([], { weekday: 'long' })}
      </Typography>
    </Box>
  );
}

export default ClockWidget;
