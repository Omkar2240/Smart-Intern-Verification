import React, { useState } from 'react';
import { Register, RegisterFormData } from '@/components/register';
import { useAuth } from '@/context/auth-context';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await register({
        name: data.name,
        email: data.email,
        registration_number: data.registrationNumber,
        mobile_number: data.mobile,
        password: data.password,
      });
      router.replace('/(tabs)');
    } finally {
      setIsLoading(false);
    }
  };

  return <Register onRegister={handleRegister} isLoading={isLoading} />;
}
