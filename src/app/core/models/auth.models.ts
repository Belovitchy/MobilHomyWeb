export type Authority = 'ADMIN' | 'OWNER' | 'MANAGER' | 'VACATIONER';

export interface LoginResponse {
  token: string;
  firstname: string;
  name: string;
  authority: Authority;
}

export interface CurrentUser {
  firstname: string;
  name: string;
  authority: Authority;
}
