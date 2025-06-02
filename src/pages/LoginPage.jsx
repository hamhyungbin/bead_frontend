import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Button, Typography, Paper } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm'; // 수정된 임포트

function LoginPage() {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          padding: { xs: 2, sm: 3, md: 4 }, // 화면 크기별 패딩 조정
          width: '100%', 
          mt: { xs: 0, sm: -8 } // 작은 화면에서는 상단 마진 제거 또는 감소
        }}
      >
        <LoginForm />
        <Button
          fullWidth
          variant="text"
          onClick={() => navigate('/register')}
          sx={{ mt: 1 }}
        >
          Don't have an account? Sign Up
        </Button>
      </Paper>
    </Container>
  );
}

export default LoginPage;
