import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Button, Typography, Paper } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm'; // 수정된 임포트

function LoginPage() {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', mt: -8 }}> {/* mt로 약간 위로 조정 */}
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