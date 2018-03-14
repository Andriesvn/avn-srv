import {Component, HttpStatus,HttpException} from "@nestjs/common";
import "rxjs/add/observable/of"
import {Connection, SelectQueryBuilder} from "typeorm";
import { isUndefined} from "util";
import {ModelHelperService} from "./modelhelper.service";
import {validate} from "class-validator";
import * as _ from "lodash";


//SERVICE THAT WILL BE RESPONSIBLE FOR ALL REST RELATED ACTIONS SUCH AS FIND,INSERT,UPDATE,DELETE

@Component()
export class ModelService {

  constructor(private readonly connection: Connection,private modelHelper: ModelHelperService) { }


  //FIND ALL FUNCTION FOR ALL MODELS
    public async findAll(model: string,req,res): Promise<any[]> {
    const findModelQuery = this.buildSelectQuery(model,req);
    return await findModelQuery.getManyAndCount().then(value => {
        return res.status(HttpStatus.OK).json({count:value[1], data:value[0]});
    })
        .catch(reason => {
      console.log('ERROR',reason);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(reason);
    });
  }

  private buildSelectQuery(model: string,req) : SelectQueryBuilder<any>{
    let modelQuery = this.connection.getRepository(model).createQueryBuilder();
    const sort = this.modelHelper.getSort(req);
    //populate the Relations
    modelQuery = this.modelHelper.buildWhere(modelQuery,model,req);

    modelQuery.limit(this.modelHelper.getLimit(req));
    modelQuery.offset(this.modelHelper.getSkip(req));

    if (!isUndefined(sort)) modelQuery.addOrderBy(this.modelHelper.getSort(req));
    //JUST FOR DEBUGGING
    modelQuery.printSql();

    return modelQuery;
  }
    //FIND A SINGLE MODEL
    public async findOne(model: string,req,res): Promise<any[]> {
        //TODO: CHECK PERMISIONS FRIST
       return this.connection.getRepository(model).findOneById(req.params.id).then(value => {
           //TODO: CHECK IF MODEL MATCHES PERMISION CRITERIA
           return res.status(HttpStatus.OK).json(value);
       })
       .catch(reason => {
           console.log(`MODELSERVICE: FIND ONE ${model} ERROR:`,reason);
           return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(reason);
       });
    }

    //CREATE A MODEL
    public async createOne(_model:string,req,res): Promise<any> {
        //TODO: CHECK PERMISIONS
        const modelRespetory = this.connection.getRepository(_model);
        let modelData = req.body;
        //TODO: CHECK IF DATA FROM REQ MATCHES PERMISION CRITERIA
        console.log(`CREATING MODEL ${_model} DATA`,modelData);
        let model = modelRespetory.create(modelData);
        return await this.validateModel(model).then(errors => {
            if (errors.length > 0) {
                console.log(`CREATE MODEL ${_model} Validation failed: `, errors);
                return res.status(HttpStatus.BAD_REQUEST).json({errors: errors});
            } else {
                return modelRespetory.save(model,
                    {data:{req: req}} //INJECT DATA FOR THE SUBSCTIBERS TO USE
                )
                    .then((value)=>{
                        //console.log("SAVED VALUE =",value);
                        return res.status(HttpStatus.OK).json(value);
                        //TODO: NOTIFY SUBSCRIBERS THE RECORD HAS BEEN CREATED
                    })
                    .catch(err => {
                        //TODO: REFLECT ERROR PROPERLY
                        console.log(`MODELSERVICE: CREATE ${model} ERROR:`,err);
                        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
                    });
            }
        }).catch(err => {
            console.log(`MODELSERVICE: CREATE ${model} VALIDATE ERROR:`,err);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        })
    }

    public async updateOne(_model:string,req,res): Promise<any> {
        //TODO: CHECK PERMISIONS
        const modelRespetory = this.connection.getRepository(_model);
        const modelId = req.params.id;
        let modelData = req.body;

        console.log(`UPDATING MODEL ${_model} ID:`,modelId,"DATA:",modelData);
        //FIND THE MODEL FIRST
        //TODO: CHECK IF DATA FROM REQ MATCHES PERMISION CRITERIA
        return modelRespetory.findOneById(modelId)
            .then(model => {
                if (!model){
                    throw new HttpException(`${_model} id:${modelId} NOT FOUND`, HttpStatus.BAD_REQUEST);
                }
                //TODO: CHECK IF MODEL ITSELF MATCHES PERMISION CRITERIA
                // VALIDATE NEW MODEL VALUES
                model = _.assignIn(model,modelData);
                return this.validateModel(model)
                    .then(errors => {
                        if (errors.length > 0) {
                            console.log(`CREATE MODEL ${_model} Validation failed: `, errors);
                            throw new HttpException({msg:"VALIDATION FAILED",errors: errors}, HttpStatus.BAD_REQUEST);
                        } else {
                            //NOW ACTUALY UPDATE THE MODEL
                            //model.updatedAt = new Date().toISOString();
                            //console.log("UPDATED DATE:",modelData.updatedAt);
                            //
                            return modelRespetory.save(model,
                                {data:{req: req}} //INJECT DATA FOR THE SUBSCTIBERS TO USE
                                )
                                .then((value) => {
                                    //TODO: OMIT UNCHANGED VALUES
                                    //TODO: NOTIFY SUBSCRIBERS THE RECORD HAS BEEN UPDATED
                                    //console.log("MODEL UPDATED: RETURN VALUE =",value);
                                    return res.status(HttpStatus.OK).json(value);
                                })
                        }
                    })
            })
    }

    public async removeOne(_model:string,req,res): Promise<any> {
      const modelId = req.params.id;
      const modelRespetory = this.connection.getRepository(_model);
      console.log(`DELETING MODEL ${_model} ID:`,modelId);
      //FIND THE MODEL FIRST
      return modelRespetory.findOneById(modelId)
          .then(model => {
              if (!model){
                  throw new HttpException(`${_model} id:${modelId} NOT FOUND`, HttpStatus.BAD_REQUEST);
              }
              //TODO: CHECK IF MODEL ITSELF MATCHES PERMISION CRITERIA
              modelRespetory.remove(model,
                  {data:{req: req}} //INJECT DATA FOR THE SUBSCTIBERS TO USE
              ).then((value) => {
                  //TODO: NOTIFY SUBSCRIBERS THE RECORD HAS BEEN DETETED
                  //console.log("MODEL UPDATED: RETURN VALUE =",value);
                  return res.status(HttpStatus.OK).json(value);
              })

          })

    }

    private async validateModel(model){
      return validate(model,{validationError: {target: false} })
    }

}