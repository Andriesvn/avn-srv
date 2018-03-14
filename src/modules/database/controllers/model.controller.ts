import {Controller, Delete, Get, Post, Put, Req, Res, UseGuards} from "@nestjs/common";
import {ModelService} from "../components/model.service";
import {AclGuard} from "../../auth/guards/acl.guard";
import {MethodName} from "../decorator/method_name.decorator";


// THIS IS A GENERIC ABSTRACT CLASS WE WANT ALL REST CONTROLLERS TO DERIVE FROM
//  IT WILL CONTAIN ALL THE DEFAULT FUNCTIONS FOR NORMAL REST AS WELL AS ANY EXTRA FEATURES ALL RESET CONTROLLERS SHOULD HAVE

/**
*    FEATURES WE WANT TO INCLUDE:
*       1. BASIC CRUD
*       2. PUB SUB FUNCTIONS SUCH AS WATCH
*       3. CHANGE TRACKING FUNCTIONS SUCH AS :
*           . HISTORY OF A RECORD
*           . CHANGES SINCE A SPECIFIC TIME
*       4. REPLICATION FUNCTIONS SUCH AS:
*           . UPLOAD CHANGES SINCE OFFLINE
*           . DOWNLOAD CHANGES SINCE OFLINE
*
* */

@Controller()
@UseGuards(AclGuard)
export abstract class ModelController<T> {
    abstract modelName: string;

    constructor(private modelService: ModelService) {
    }

    @Get()
    @MethodName("find")
    public async findall(@Req() req,@Res() res) {
        //console.log("REQUEST.USER=",req.user);
        console.log("MODELCONTROLLER-FINDALL-ACL:",req.options.acl);
        return await this.modelService.findAll(this.modelName,req,res);
    }

    @Get(":id")
    @MethodName("find")
    public async findone(@Req() req,@Res() res) {
        //console.log("FINDONE:",req.params.id);
        return await this.modelService.findOne(this.modelName,req,res);
    }

    // ALLOWS TO CREATE A SINGLE RECORD
    // TODO: ALLOW TO CREATE MULTIPLE RECORDS (NOT SURE IF WE WANT TO ALLOW THIS)?
    @Post()
    @MethodName("create")
    public async create(@Req() req,@Res() res) {
        //console.log("FINDONE:",req.params.id);
        return await this.modelService.createOne(this.modelName,req,res);
    }

    // ALLOWS TO UPDATE A SINGLE RECORD
    // TODO: ALLOW TO UPDATE MULTIPLE RECORDS (NOT SURE IF WE WANT TO ALLOW THIS)?
    @Put(":id")
    @Post(":id")
    @MethodName("update")
    public async update(@Req() req,@Res() res) {
        return await this.modelService.updateOne(this.modelName,req,res);
    }

    // ALLOWS TO REMOVE A SINGLE RECORD
    // TODO: ALLOW TO REMOVE MULTIPLE RECORDS (NOT SURE IF WE WANT TO ALLOW THIS)?
    @Delete(":id")
    @MethodName("remove")
    public async removeone(@Req() req,@Res() res) {
        //console.log("FINDONE:",req.params.id);
        return await this.modelService.removeOne(this.modelName,req,res);
    }


}