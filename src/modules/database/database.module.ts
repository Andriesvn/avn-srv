import {MiddlewaresConsumer, Module, NestModule} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Connection, ConnectionOptions} from "typeorm";
import {ModelService} from "./components/model.service";
import {ModelHelperService} from "./components/modelhelper.service";
import {UserController} from "./controllers/user.controller";
import {AuthenticatedMiddleware} from "../auth/middleware/authenticated.middleware";
import {AclService} from "../auth/components/acl.service";


const connectionOptions: ConnectionOptions = {
  type: 'sqlite',
  database: 'data/test.db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  subscribers: [__dirname + '/../**/*.subscriber{.ts,.js}'],
  synchronize: true,
}

@Module({
  imports: [TypeOrmModule.forRoot(connectionOptions)],
  components: [AclService,ModelService, ModelHelperService],
  controllers: [UserController],
})
export class DatabaseModule implements NestModule {
  configure(consumer: MiddlewaresConsumer): MiddlewaresConsumer | void {
      consumer.apply(AuthenticatedMiddleware).forRoutes(UserController);
  }

  constructor(private readonly connection: Connection) {
    //console.log(connection.getMetadata("user"));
    //this.seed();
  }

  //SEED SOME FAKE DATA FOR TESTING
  private seed(){
      this.seedACL();
      this.seedRoles();
      this.seedUsers();
  }

  private seedACL(){
      const repository = this.connection.getRepository('acl');
      let acl = [repository.create({
          id: "FULLACCESS",
          description: "FULL ACCESS TO ALL",
          order: 0,
          resources: ["*"],
          methods: ["*"],
          allowed: true
      })];
      acl.push(repository.create({
          id: "USER-ME",
          description: "Create Read Update Yourself ",
          order: 1,
          resources: ["user"],
          methods: ['find','create','update'],
          criteria: {
              where:{ id: "$user.id"},
          },
          allowed: true
      }));
      acl.push(repository.create({
          id: "USER-USER",
          description: "Create Read Update ALL USERS IN USER ROLE ",
          order: 1,
          resources: ["user"],
          methods: ['find','create','update','delete'],
          criteria: {
              where:{ 'roles.id': ['USER',"$user.roleids"]},
          },
          allowed: true
      }));
      repository.save(acl);
  }

  private seedRoles(){
      const repository = this.connection.getRepository('role');
      let roles = [repository.create({id:"SYSADMIN",name:"SYSTEM ADMIN",level:0, acl:[{id:"FULLACCESS"}]})];
      roles.push(repository.create({id:"SYSTECH",name:"SYSTEM TECHNICIAN",level:1}));
      roles.push(repository.create({id:"SUBADMIN",name:"SUBSCRIPTION ADMIN",level:10,acl:[{id:"USER-USER"}] }));
      roles.push(repository.create({id:"USER",name:"NORMAL USER",level:100,acl:[{id:"USER-ME"}]}));
      repository.save(roles);

  }

  private seedUsers(){
      const repository = this.connection.getRepository('user');
      let users =[repository.create({email: "andriesvn@avntech.net",first_name: "Andries",last_name : "van Niekerk",password:"12345",enabled:true,roles: [{id:"SYSADMIN"}], acl:[{id:"FULLACCESS"}] })];
      users.push(repository.create({email: "user@test.net",first_name: "User",last_name : "num 1",password:"12345",enabled:true,roles: [{id:"SUBADMIN"}]}));
      users.push(repository.create({email: "user2@test.net",first_name: "User",last_name : "num 1",password:"12345",enabled:true,roles: [{id:"USER"}]}));
      repository.save(users);
  }

}
