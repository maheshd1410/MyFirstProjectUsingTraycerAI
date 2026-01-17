import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loginUser,
  registerUser,
  logoutUser,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  setUser as setUserAction,
} from '../store/auth/authSlice';
import { LoginCredentials, RegisterData, UserRole, User } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const login = useCallback(
    (credentials: LoginCredentials) => {
      return dispatch(loginUser(credentials));
    },
    [dispatch]
  );

  const register = useCallback(
    (data: RegisterData) => {
      return dispatch(registerUser(data));
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  const setUser = useCallback(
    (user: User) => {
      dispatch(setUserAction(user));
    },
    [dispatch]
  );

  const isAdmin = user?.role === 'ADMIN';
  const isCustomer = user?.role === 'CUSTOMER';

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isCustomer,
    login,
    register,
    logout,
    setUser,
  };
};

/**
 * Hook to protect screens - redirect if not authenticated or wrong role
 */
export const useRequireAuth = (requiredRole?: UserRole) => {
  const { isAuthenticated, user } = useAuth();

  const hasAccess = isAuthenticated && (!requiredRole || user?.role === requiredRole);

  return {
    hasAccess,
    isAuthenticated,
    user,
  };
};
