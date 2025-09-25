import { Request } from 'express';
// We need to import the User interface to define AuthenticatedUser.
import { User } from 'src/user/user.interface';

export interface Trial {
  id: string;
  user_id: string;
  title: string;
  description: string;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
  created_at: Date;
  updated_at: Date;
}

// We'll define a type for the user payload that we expect
// to find on the request object after authentication.
export interface UserPayload {
  id: string;
}

// We will use this type to ensure our context has the correct user data.
// It omits the sensitive password_hash field.
export type AuthenticatedUser = Omit<User, 'password_hash'>;

// We'll create a custom Request interface that includes the
// user property to maintain type safety. We are now using the
// correct AuthenticatedUser type.
export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}
