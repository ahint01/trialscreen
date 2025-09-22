export interface User {
  id: string;
  email: string;
  password?: string; // add password_hash here later
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
}
