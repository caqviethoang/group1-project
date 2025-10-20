//src/hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { loginUser, registerUser, logout, clearError, getProfile, updateProfile } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const login = useCallback((email, password) => {
    return dispatch(loginUser({ email, password }));
  }, [dispatch]);

  const register = useCallback((name, email, password) => {
    return dispatch(registerUser({ name, email, password }));
  }, [dispatch]);

  const signOut = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const fetchProfile = useCallback(() => {
    return dispatch(getProfile());
  }, [dispatch]);

  const updateUserProfile = useCallback((profileData) => {
    return dispatch(updateProfile(profileData));
  }, [dispatch]);

  return {
    ...auth,
    login,
    register,
    logout: signOut,
    clearError: clearAuthError,
    getProfile: fetchProfile,
    updateProfile: updateUserProfile,
    isAdmin: auth.user?.role === 'admin',
    isModerator: auth.user?.role === 'moderator' || auth.user?.role === 'admin'
  };
};