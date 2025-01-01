export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface SignupRequest {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }
  
  export interface AuthResponse {
    token: string;
    message: string;
    error?: string;
  }
  