export type Authority = 'ADMIN' | 'OWNER' | 'MANAGER' | 'VACATIONER';

export interface LoginResponse {
  token: string;
  userId: number;
  firstname: string;
  name: string;
  authority: Authority;
}

export interface CurrentUser {
  userId: number;
  firstname: string;
  name: string;
  authority: Authority;
}
