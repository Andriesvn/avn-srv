import {Component} from "@nestjs/common";
import {User} from "../../database/entities/user.entity";
import * as _ from "lodash";

@Component()
export class AclService {

    public hasPermission(user: User, resource: string,method: string): boolean {
        //GET ALL PERMISSIONS RELATED TO THIS RESOURCE AND METHOD
        console.log("CHECKING USER ACCESS ON",resource," METHOD:",method," - USER = ",user);
        let result = false;
        if (user.acl.length > 0){
            user.acl.forEach((acl)=>{
                if ((acl.resources.indexOf(resource) >= 0 || acl.resources.indexOf('*') >= 0) &&
                    (acl.methods.indexOf(method) >= 0 || acl.methods.indexOf('*') >= 0)) {
                    if (!acl.allowed) return acl.allowed; //IF ITS NOT ALLOWED STOP RIGHT THERE, DENY PERMISSION IS NOT OVERRIDABLE
                    result = acl.allowed;
                }
            });
        }
        return result;
    }

    public getMethodPermisions(user: User, resource: string,method: string): any[]{
        return user.acl.filter((acl)=>{
            return ((acl.resources.indexOf(resource) >= 0 || acl.resources.indexOf('*') >= 0) &&
                (acl.methods.indexOf(method) >= 0 || acl.methods.indexOf('*') >= 0));
        }).map((value) =>{
            return _.omit(value,['allowed','description']);
        });
    }

}