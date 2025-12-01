import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse } from "./base";
import { CacheInvalidator } from "../cache/cache-invalidator";

/**
 * Login request interface
 */
export interface LoginRequest {
  user_id: string;
  password: string;
}

/**
 * Token response interface
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  role: string | null;
  is_admin: boolean;
}

/**
 * JWT payload interface
 */
export interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
  user_id: string;
  username: string;
}

/**
 * Service for handling authentication-related API calls
 */
export class AuthService extends BaseService {
  protected readonly serviceName = 'AuthService';

  /**
   * User login
   */
  async login(request: LoginRequest): Promise<ServiceResponse<TokenResponse>> {
    this.validateRequired(request, ['user_id', 'password']);
    this.validateTypes(request, {
      user_id: 'string',
      password: 'string',
    });

    if (request.user_id.trim().length === 0) {
      throw this.createValidationError('User ID cannot be empty');
    }

    if (request.password.length === 0) {
      throw this.createValidationError('Password cannot be empty');
    }

    try {
      return await this.post<TokenResponse>(API_ENDPOINTS.RBAC_LOGIN, {
        user_id: request.user_id.trim(),
        password: request.password,
      });
    } catch (error: any) {
      throw this.handleAuthError(error, 'rbac_login');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ServiceResponse<TokenResponse>> {
    if (!refreshToken || refreshToken.trim().length === 0) {
      throw this.createValidationError('Refresh token is required');
    }

    try {
      return await this.post<TokenResponse>(API_ENDPOINTS.RBAC_REFRESH, {
        refresh_token: refreshToken,
      });
    } catch (error: any) {
      throw this.handleAuthError(error, 'refresh_token');
    }
  }

  /**
   * Get current user info (RBAC)
   */
  async getCurrentUser(): Promise<ServiceResponse<any>> {
    try {
      return await this.get<any>(API_ENDPOINTS.RBAC_ME);
    } catch (error: any) {
      throw this.handleAuthError(error, 'get_current_user');
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId, oldPassword, newPassword }, ['userId', 'oldPassword', 'newPassword']);

    // Validate password strength
    const validation = this.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw this.createValidationError(
        `Password validation failed: ${validation.errors.join(', ')}`,
        { validationErrors: validation.errors }
      );
    }

    try {
      const result = await this.post<any>(
        API_ENDPOINTS.RBAC_CHANGE_PASSWORD,
        {
          user_id: userId,
          old_password: oldPassword,
          new_password: newPassword,
        }
      );
      
      // Invalidate user-related cache after password change
      if (result.success) {
        CacheInvalidator.invalidateUsers();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleAuthError(error, 'change_password');
    }
  }

  /**
   * Admin change password (admin only)
   */
  async adminChangePassword(
    targetUserId: string,
    newPassword: string
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ targetUserId, newPassword }, ['targetUserId', 'newPassword']);

    // Validate password strength
    const validation = this.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw this.createValidationError(
        `Password validation failed: ${validation.errors.join(', ')}`,
        { validationErrors: validation.errors }
      );
    }

    try {
      return await this.post<any>(
        API_ENDPOINTS.RBAC_ADMIN_CHANGE_PASSWORD,
        {
          target_user_id: targetUserId,
          new_password: newPassword,
        }
      );
    } catch (error: any) {
      throw this.handleAuthError(error, 'admin_change_password');
    }
  }

  /**
   * Create user (admin only)
   */
  async createUser(
    userId: string,
    password: string,
    role: 'admin' | 'user' = 'user'
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId, password }, ['userId', 'password']);

    // Validate password strength
    const validation = this.validatePasswordStrength(password);
    if (!validation.isValid) {
      throw this.createValidationError(
        `Password validation failed: ${validation.errors.join(', ')}`,
        { validationErrors: validation.errors }
      );
    }

    try {
      return await this.post<any>(
        API_ENDPOINTS.RBAC_CREATE_USER,
        {
          user_id: userId,
          password: password,
          role: role,
        }
      );
    } catch (error: any) {
      throw this.handleAuthError(error, 'create_user');
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<ServiceResponse<any>> {
    try {
      return await this.get<any>(API_ENDPOINTS.RBAC_GET_ALL_USERS);
    } catch (error: any) {
      throw this.handleAuthError(error, 'get_all_users');
    }
  }

  /**
   * Get user role
   */
  async getUserRole(userId: string): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId }, ['userId']);

    try {
      return await this.get<any>(API_ENDPOINTS.RBAC_GET_USER_ROLE(userId));
    } catch (error: any) {
      throw this.handleAuthError(error, 'get_user_role');
    }
  }

  /**
   * Set user role (admin only)
   */
  async setUserRole(
    userId: string,
    role: 'admin' | 'user'
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId, role }, ['userId', 'role']);

    try {
      return await this.post<any>(
        API_ENDPOINTS.RBAC_SET_ROLE,
        {
          user_id: userId,
          role: role,
        }
      );
    } catch (error: any) {
      throw this.handleAuthError(error, 'set_user_role');
    }
  }

  /**
   * Parse JWT token
   */
  parseJWT(token: string): JWTPayload | null {
    try {
      if (!token) return null;
      
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload) as JWTPayload;
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return null;
    }
  }

  /**
   * Check if JWT token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseJWT(token);
      if (!payload || !payload.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get user ID from JWT token
   */
  getUserIdFromToken(token: string): string | null {
    try {
      const payload = this.parseJWT(token);
      return payload?.user_id || payload?.sub || null;
    } catch (error) {
      console.error('Failed to extract user ID from token:', error);
      return null;
    }
  }

  /**
   * Handle authentication-specific errors
   */
  private handleAuthError(error: any, operation: string): Error {
    if (error.statusCode) {
      switch (error.statusCode) {
        case 400:
          if (operation === 'login') {
            return this.createValidationError(error.message || 'Invalid credentials');
          }
          if (operation === 'change_password') {
            return this.createValidationError(error.message || 'Invalid password data');
          }
          return this.createValidationError(error.message || 'Bad request');
          
        case 401:
          if (operation === 'login') {
            return this.createAuthError('Invalid user ID or password');
          }
          return this.createAuthError('Authentication required');
          
        case 403:
          return this.createAuthorizationError('Access denied');
          
        case 409:
          return this.createValidationError('Conflict with existing resource');
          
        case 422:
          return this.createValidationError(error.message || 'Validation error');
          
        case 500:
          return new Error('Internal server error');
          
        default:
          return new Error(error.message || 'Authentication failed');
      }
    }
    
    return error;
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password cannot be longer than 128 characters');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate token format
   */
  validateTokenFormat(token: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!token) {
      errors.push('Token is required');
      return { isValid: false, errors };
    }

    if (typeof token !== 'string') {
      errors.push('Token must be a string');
      return { isValid: false, errors };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      errors.push('Invalid JWT token format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export for backward compatibility
export default authService; 