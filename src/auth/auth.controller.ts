// src/auth/auth.controller.ts
import { Body, Controller, Post, Res, Get, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type {  Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register( dto.username,
    dto.lastname,
    dto.dni,
    dto.birthday,
    dto.password,
    dto.confirmPassword);
  }


  @Post('login')
async login(@Body() dto: LoginDto, @Res() res: Response) {
    //Validamos credenciales
  const result = await this.authService.login(dto.username, dto.password);

    //Si no son válidas, devolvemos 401 Unauthorized
  if (!result.ok) {
    return res.status(401).json(result);
  }

  //Si son válidas, guardamos el token en una cookie httpOnly
  //- httpOnly: el cliente no puede leerla con JS (más seguro)
  //- sameSite: evita envío en requests cross-site
  res.cookie('session_id', result.token, {
    httpOnly: true,
    sameSite: 'lax',
  });

  //Devolvemos el resultado al frontend
  return res.json(result);
}


@Get('session')
  async getSession(@Req() req: Request) {
console.log('Cookies recibidas:', req.cookies);
  //Leemos la cookie 'session_id' enviada por el cliente
    const token = req.cookies['session_id'];
    if (!token) throw new UnauthorizedException();

  //Buscamos la sesión en Redis usando el token
    const session = await this.authService.getSession(token);
    if (!session) throw new UnauthorizedException();

  //Devolvemos el objeto de sesión { username }
    return session; 
  }

  
@Post('logout')
async logout(@Req() req: Request, @Res() res: Response) {
  const token = req.cookies['session_id'];
  if (token) {
    // Borrar la sesión en Redis
    await this.authService.deleteSession(token);
  }

  // Borrar la cookie en el navegador
  res.clearCookie('session_id', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true si usás HTTPS
  });

  return res.json({ ok: true, message: "Sesión cerrada" });
}
  
}
