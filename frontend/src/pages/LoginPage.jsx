import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../features/tickets/schemas';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../api/authService';
import { toast } from 'sonner';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const user = await authService.login(data);
      await login(user);
      toast.success('Bienvenido');
    } catch (error) {
      toast.error(error.message || 'Credenciales incorrectas');
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <h1 style={{ textAlign: 'center' }}>Login</h1>
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Contraseña"
          type="password"
          {...register('password')}
          error={errors.password?.message}
        />
        <Button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;
