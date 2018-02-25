import { Controller, Post, HttpStatus, HttpCode, Get } from '@nestjs/common';
import {AuthService} from "../components/auth.service";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('token')
  @HttpCode(HttpStatus.OK)
  public async getToken() {
    return await this.authService.createToken();
  }

  @Get('authorized')
  public async authorized() {
    console.log('Authorized route...');
  }
}