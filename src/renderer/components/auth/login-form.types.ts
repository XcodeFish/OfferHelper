export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface LoginFormState {
  username: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  errors: {
    username?: string;
    password?: string;
    submit?: string;
  };
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  message?: string;
}
