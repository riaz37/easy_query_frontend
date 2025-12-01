// Authentication-related types and interfaces

export interface User {
  user_id: string;
  username: string;
  email: string;
  name: string;
  phone_number: string;
  address: string;
  about: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
  success: boolean;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresAt?: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextData extends AuthState {
  isInitialized: boolean;
  login: (data: LoginRequest) => Promise<User>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// JWT Token payload structure (based on the token from the API)
export interface JWTPayload {
  sub: string; // username
  user_id: string;
  roles: string[];
  permissions: string[];
  exp: number; // expiration timestamp
  jti: string; // JWT ID
}

// Authentication error types
export type AuthErrorType = 
  | 'invalid_credentials'
  | 'user_not_found'
  | 'user_already_exists'
  | 'invalid_token'
  | 'token_expired'
  | 'insufficient_permissions'
  | 'account_disabled'
  | 'validation_error'
  | 'network_error'
  | 'unknown_error';

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

// ========== RBAC Types (new authentication system) ==========

export interface RBACLoginRequest {
  user_id: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  role: string | null;
  is_admin: boolean;
}

export interface RBACChangePasswordRequest {
  user_id: string;
  old_password: string;
  new_password: string;
}

export interface AdminChangePasswordRequest {
  target_user_id: string;
  new_password: string;
}

export interface CreateUserRequest {
  user_id: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface SetRoleRequest {
  user_id: string;
  role: 'admin' | 'user';
}

export interface UserRoleResponse {
  user_id: string;
  role: string | null;
  is_admin: boolean;
}

export interface CheckAccessRequest {
  user_id: string;
  config_id?: number | null;
  db_id?: number | null;
}

export interface AccessCheckResponse {
  user_id: string;
  has_access: boolean;
  is_admin: boolean;
  config_id: number | null;
  db_id: number | null;
}

export interface GrantAccessRequest {
  user_id: string;
  config_id?: number[] | null;
  db_id?: number[] | null;
}

export interface RevokeAccessRequest {
  user_id: string;
  config_id?: number[] | null;
  db_id?: number[] | null;
}

export interface RBACUserAccessResponse {
  user_id: string;
  config_ids: number[];
  db_ids: number[];
  access_details: any[];
  total_access_entries: number;
} 