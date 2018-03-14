import {Controller, Get, Req, Res} from "@nestjs/common";
import {ModelController} from "./model.controller";
import {User} from "../entities/user.entity";


@Controller('user')
export class UserController extends ModelController<User>{
    modelName = "user";
}
