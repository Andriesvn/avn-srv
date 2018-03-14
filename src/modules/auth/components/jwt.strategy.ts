import * as passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {Component} from '@nestjs/common';
import {AuthService} from "./auth.service";

const EXPIRES_IN_MINUTES = 60 * 24;
const SECRET = "4ukI0uIVnB3iI1yxj646fVXSE3ZVk4doZgz6fTbNg7jO41EAtl20J5F7Trtwe7OM";
const ALGORITHM = "HS256";
const ISSUER = "localhost";
const AUDIENCE = "it-manager";


@Component()
export class JwtStrategy extends Strategy {
  constructor(private readonly authService: AuthService) {
    super(
      {
        jwtFromRequest: ExtractJwt.fromHeader("authorization"),
        passReqToCallback: true,
        secretOrKey: SECRET,
        issuer: ISSUER,
        audience: AUDIENCE,
        jsonWebTokenOptions: {
          expiresIn: EXPIRES_IN_MINUTES,
          secret: SECRET,
          algorithm : ALGORITHM,
          issuer : ISSUER,
          audience : AUDIENCE }
      },
      async (req, payload, next) => await this.verify(req, payload, next)
    );
    passport.use(this);
  }

  public async verify(req, payload, done) {
    //THIS WILL ONLY BE THE USERID
    const user = await this.authService.validateUser(payload);
    if (!user) {
      return done("INVALID USER", false);
    }
    done(null, user);
  }
}