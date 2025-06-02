import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Box, Button, Typography, Paper, Alert } from '@mui/material';
import RegisterForm from '../components/Auth/RegisterForm';

function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;


  return (
    <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', mt: -8 }}>
        {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
        <RegisterForm />
        <Button
          fullWidth
          variant="text"
          onClick={() => navigate('/login')}
          sx={{ mt: 1 }}
        >
          Already have an account? Sign In
        </Button>
      </Paper>
    </Container>
  );
}

export default RegisterPage;