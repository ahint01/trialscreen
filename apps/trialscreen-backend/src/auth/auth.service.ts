import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { type User } from 'src/user/user.interface';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

type AuthenticatedUser = Omit<User, 'password_hash'>;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.userService.findByEmail(email);

    if (user && user.password_hash) {
      const passwordMatch = await bcrypt.compare(pass, user.password_hash);
      if (passwordMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  login(user: AuthenticatedUser) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // New method to validate the token
  validateToken(token: string): AuthenticatedUser | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token);
      // The `sub` property is the user ID from our login payload.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      return { id: payload.sub, email: payload.email, ...payload };
    } catch (error) {
      console.error('JWT validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
