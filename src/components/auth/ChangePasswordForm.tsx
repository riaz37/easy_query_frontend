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
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/loading';
import { cn } from '@/lib/utils';

// Validation schema for change password form
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const { changePassword, isLoading, error, clearError } = useAuthContext();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      clearError();
      await changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      setIsSuccess(true);
      reset();
      
      // Show success message for a few seconds before calling onSuccess
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      // Error is handled by the auth context
      console.error('Password change failed:', error);
    }
  };

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (isSuccess) {
    return (
      <div className="card-enhanced w-full">
        <div className="card-content-enhanced">
          <div className="text-center py-4 sm:py-6">
            <CheckCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-4 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-emerald-300">
              Password changed successfully!
            </h3>
            <p className="text-xs sm:text-sm mb-4 text-gray-300">
              You will be redirected to login in a few seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-enhanced w-full">
      <div className="card-content-enhanced">
        <div className="card-header-enhanced">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">
              Change Password
            </h2>
            <p className="text-sm sm:text-base text-gray-300">
              Enter your current password and choose a new one
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
            <Label htmlFor="currentPassword" className="text-sm font-medium text-white">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter your current password"
                {...register('currentPassword')}
                className={`modal-input-enhanced pr-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
                style={{
                  border: '1px solid var(--components-paper-outlined, #FFFFFF1F)',
                  height: '48px'
                }}
              />
              <button
                type="button"
                onClick={toggleCurrentPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs sm:text-sm text-red-400">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-white">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                {...register('newPassword')}
                className={`modal-input-enhanced pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                style={{
                  border: '1px solid var(--components-paper-outlined, #FFFFFF1F)',
                  height: '48px'
                }}
              />
              <button
                type="button"
                onClick={toggleNewPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs sm:text-sm text-red-400">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword" className="text-sm font-medium text-white">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmNewPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                {...register('confirmNewPassword')}
                className={`modal-input-enhanced pr-10 ${errors.confirmNewPassword ? 'border-red-500' : ''}`}
                style={{
                  border: '1px solid var(--components-paper-outlined, #FFFFFF1F)',
                  height: '48px'
                }}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <p className="text-xs sm:text-sm text-red-400">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <ButtonLoader
              type="submit"
              loading={isLoading}
              text="Changing..."
              size="md"
              variant="primary"
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/25"
            >
              Change Password
            </ButtonLoader>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
} 