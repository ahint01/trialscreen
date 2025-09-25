import type { User } from 'src/user/user.interface';

// Define the type for an authenticated user, omitting the password hash
type AuthenticatedUser = Omit<User, 'password_hash'>;

// Tell TypeScript to augment the existing 'express' module
declare module 'express' {
  // Add a new 'user' property to the Request interface
  export interface Request {
    user?: AuthenticatedUser;
  }
}
