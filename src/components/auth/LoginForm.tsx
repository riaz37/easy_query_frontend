"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { ButtonLoader } from '@/components/ui/loading';
import { cn } from '@/lib/utils';

// Validation schema for login form
const loginSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading, error, clearError } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="card-enhanced w-full">
      <div className="card-content-enhanced">
        <div className="card-header-enhanced">
          <div className="text-left mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">
              Sign in to your account
            </h2>
            <p className="text-sm sm:text-base text-gray-300">
              Enter your credentials to access the system
            </p>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="user_id" className="text-sm font-medium text-white">User ID</Label>
            <Input
              id="user_id"
              type="text"
              placeholder="Enter your user ID"
              {...register('user_id')}
              className={`modal-input-enhanced ${errors.user_id ? 'border-red-500' : ''}`}
              style={{
                border: '1px solid var(--components-paper-outlined, #FFFFFF1F)',
                height: '48px'
              }}
            />
            {errors.user_id && (
              <p className="text-xs sm:text-sm text-red-400">{errors.user_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                className={`modal-input-enhanced pr-10 ${errors.password ? 'border-red-500' : ''}`}
                style={{
                  border: '1px solid var(--components-paper-outlined, #FFFFFF1F)',
                  height: '48px'
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
              >
                <Image
                  src="/dashboard/eye.svg"
                  alt={showPassword ? "Hide password" : "Show password"}
                  width={16}
                  height={16}
                  className={`transition-opacity duration-200 ${showPassword ? "opacity-50" : "opacity-100"}`}
                />
              </button>
            </div>
            {errors.password && (
              <p className="text-xs sm:text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <ButtonLoader
            type="submit"
            loading={isLoading}
            text="Signing in..."
            size="md"
            variant="primary"
            className="w-full text-sm sm:text-base font-semibold transition-colors duration-200 text-white bg-white/4 hover:bg-white/10 cursor-pointer"
            style={{
              borderRadius: '99px',
              height: '48px'
            }}
          >
            Sign In
          </ButtonLoader>
        </form>
        </div>
      </div>
    </div>
  );
} 