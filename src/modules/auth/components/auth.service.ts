import * as jwt from 'jsonwebtoken';
import * as bcrypt from "bcrypt";
import * as _ from "lodash";
import {Component, HttpStatus, OnModuleInit} from '@nestjs/common';
import {Connection} from "typeorm";
import {User} from "../../database/entities/user.entity";


const EXPIRES_IN_MINUTES = 60 * 45;
//const EXPIRES_IN_MINUTES = 60;
const SECRET = "4ukI0uIVnB3iI1yxj646fVXSE3ZVk4doZgz6fTbNg7jO41EAtl20J5F7Trtwe7OM";
const ALGORITHM = "HS256";
const ISSUER = "localhost";
const AUDIENCE = "it-manager";




@Component()
export class AuthService implements OnModuleInit {

  private userCache: Map<string,any>;
  private cacheCleaner: any;


  constructor(private readonly connection: Connection) {
      this.userCache = new Map<string,any>();
  }

    onModuleInit() {
        this.userCache = new Map<string,any>();
        this.cacheCleaner = setInterval(this.cleanCache,60 * 1000,this.userCache);
    }

  private async cleanCache(cache){
      //console.log('Cleaning user Cache Now');
      if (cache && cache.size > 0){
          //console.log("USERS IN CACHE=",cache.size);
          var current_time = new Date().getTime() / 1000;
          cache.forEach((value,key)=>{
              if (current_time > value.exp){
                  //console.log("USER",value.email,"EXPIRED. REMOVING FROM CACHE");
                  cache.delete(key);
              }
          })
      }
  }


  private async createToken(_user: any) {
    const user = {
      user: _user.id,
    };
    //console.log("CREATE TOKEN USER:",user);
    const token = jwt.sign(user, SECRET, {
          algorithm: ALGORITHM,
          expiresIn: EXPIRES_IN_MINUTES,
          issuer: ISSUER,
          audience: AUDIENCE
      });
    return {
      expires_in: EXPIRES_IN_MINUTES,
      access_token: token,
      user: _user,
    };
  }

  private async getUser(id,email): Promise<any>{
      let userQuery = this.connection.getRepository('user').createQueryBuilder('user');
      if (id)
          userQuery.where("user.id = :id",{id:id})
      else if (email) userQuery.where("user.email = :email",{email:email});

      userQuery.leftJoinAndSelect("user.roles","roles")
          .leftJoinAndSelect("roles.acl", "roles-acl")
          .leftJoinAndSelect("user.acl", "acl")
          .addSelect("user.password")
          .addSelect("user.enabled");
      return await userQuery.getOne().then(value => {
          if (value){
              return this.buildUser(value as User);
          }
      });
  }

  async login(req, res){
      const email = req.body.email;
      //console.log("AUTH:FINDING USER:",req.body);

      await this.getUser(null,email)
          .then(value => {
              if (!value){
                  //TODO: LOG FAILED ATTEMTS WHERE USER DOES NOT EXIST
                    //IDEA: MAYBE BLOCK IP ADDRESS AFTER X AMOUNT OF TIMES
                  return res.status(HttpStatus.UNAUTHORIZED).json("UNAUTHORIZED");
              }  else {
                  //console.log("GOT AUTH USER:",value);
                  if (this.comparePassword(req, res,value as User)){
                      let tmpUser = _.omit(value, ['password','enabled']);
                      return this.createToken(tmpUser).then(token => {
                          //console.log("AUTH TOKEN=",value);
                              res.status(HttpStatus.OK).json(token);
                           });
                  } else {
                      return res.status(HttpStatus.UNAUTHORIZED).json("UNAUTHORIZED");
                  }

              }
          })
          .catch(reason => {
              console.log('AUTH:FIND USER ERROR:',reason);
              res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(reason);
              return reason;
          });
  }

  private buildUser(user: User): any{
      let tmpuser = _.omit(user, ['acl','roles','createdAt','updatedAt']);
      tmpuser['roleids'] = _.flatMap(user.roles, (role) =>{
          return role.id;
      });
      tmpuser['acl'] = this.getACL(user);
      return tmpuser;
  }

  private getACL(user: User): any[]{
      let aclmapper = (acl) => {
          return _.omit(acl, ['createdAt','updatedAt']);
      }
      return _.sortBy(_.unionBy(
          _.flatMap(user.roles, (role) =>{
              return _.map(role.acl,aclmapper);
          }),
          _.map(user.acl,aclmapper),
          "id"),['order']);
  }

  async validateUser(payload): Promise<any> {
    //CHECK IF USER IS IN HASHMAP
     const userID =  payload.user;
     let result: any = false;
     //CHECK IN CASHE FIRST
     if (this.userCache.has(userID)){
         //USER IS VALIDATED SO WE CAN RETURN IT
         //console.log("GOT USER FROM CACHE");
         let tmpUser = this.userCache.get(userID)
         if (tmpUser.exp < payload.exp){
             //UPDATE CACHE BEFORE IT GETS DELETED
             tmpUser.exp = payload.exp;
             this.userCache.set(userID,tmpUser);
         }
         result = tmpUser;
     } else {
        //FIND IT IN THE DATABASE
        await this.getUser(userID,null).then(value => {
            if (value) {
              if (value.enabled) {
                  let tmpUser = _.omit(value, ['password']);
                  //console.log("GOT USER FROM DB");
                  tmpUser.exp = payload.exp;
                  //SAVE RESULT IN CACHE
                  this.userCache.set(userID,tmpUser);
                  result = tmpUser;
              }
            }
        }).catch(() => {
            result = false;
            console.log("SOMETHING WENT WONG");
        });
      }
      return result;
  }

  private async comparePassword(req, res,user: User): Promise<boolean> {
      const password = req.body.password;
      return await bcrypt.compare(password, user.password)
          .then((result) => {
              if (result) {
                  return true;
              }
              else {
                  //TODO: LOG FAILED ATTEMTS WHERE PASSWORD INCORRECT
                   //IDEA: MAYBE BLOCK USER AFTER X AMOUNT OF TIMES
                  return false;
              }
          })
          .catch(reason => {
              return false;
          });
  }


}