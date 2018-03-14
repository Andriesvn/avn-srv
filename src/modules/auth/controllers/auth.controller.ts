import {Controller, Post, HttpStatus, HttpCode, Get, Res, Req} from '@nestjs/common';
import {AuthService} from "../components/auth.service";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Post()
  public async login(@Req() req,@Res() res) {
    return this.authService.login(req,res);
  }

  @Get('authorized')
  public async authorized() {
    console.log('Authorized route...');
  }
}