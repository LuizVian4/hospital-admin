import { useMutation } from '@tanstack/react-query';
import type { ChangePasswordRequest, DeleteAccountRequest, UpdateProfileRequest } from '@escala/shared';
import { api } from '@/api/client';

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => api.updateProfile(data),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => api.changePassword(data),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (data: DeleteAccountRequest) => api.deleteAccount(data),
  });
}
