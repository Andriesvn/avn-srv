import {CanActivate, ExecutionContext, Guard} from "@nestjs/common";
import {Reflector} from "@nestjs/core";

import {AclService} from "../components/acl.service";

@Guard()
export class AclGuard implements CanActivate {
    constructor(private readonly reflector: Reflector,private aclService: AclService) {}

    async canActivate(req, context: ExecutionContext): Promise<boolean> {
        const { parent, handler } = context;
        const resource: string = this.reflector.get("path", parent);
        const method: string = this.reflector.get("method_name", handler);


        const allowed = await this.aclService.hasPermission(req.user,resource,method);
        console.log("REQUEST ALLOWD:",allowed);
        if (allowed) {
            //BUILD A PERMISSION LIST FOR THIS METHOD AND RESOURCE AND INJECT IT INTO THE REQUEST
            if (!req.options)
             req.options = {acl: this.aclService.getMethodPermisions(req.user,resource,method)};
            else req.options.acl = this.aclService.getMethodPermisions(req.user,resource,method);
            //console.log("USER PERMISIONS FOUND, ACL=",req.options.acl);
        }

        return allowed;
    }

}