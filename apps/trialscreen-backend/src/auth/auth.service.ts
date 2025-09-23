import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.interface';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

// Define a type for the user object after validation
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
}
