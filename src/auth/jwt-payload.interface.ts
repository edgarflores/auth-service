export interface IJwtPayload {
  sub: string;
  email: string;
  isActive: boolean;
  roles: string[];
  apps: string[];
}
