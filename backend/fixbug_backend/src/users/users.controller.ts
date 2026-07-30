import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';

@Controller('users')
export class UsersController {
    constructor(private userService:UsersService ){}
    @Post('register')
   async register(@Body() data:RegisterDto){
        return this.userService.register(data);
    }
    @Post('login')
    async login(@Body() data:LoginDto){
        return this.userService.login(data)
    }
}
