import {Component, HttpStatus, HttpException} from "@nestjs/common";
import {Connection, SelectQueryBuilder,} from "typeorm";
import * as _ from "lodash";
import {EntityMetadata} from "typeorm/metadata/EntityMetadata";

interface PopulateOptions{
    idsOnly? : boolean
}

interface WhereClause{
    field:string,
    opp:string,
    value:any,
    options?:{
        whereAdded?: boolean,
        isOR?: boolean
    },
}

interface PopulateCause{
    relation: string,
    options?: PopulateOptions,
}

@Component()
export class ModelHelperService {

    constructor(private readonly connection: Connection) {

    }
    //GET THE POPULATE FROM THE REQUEST
    // POPULATE is in the following format:
    //   populate : "relation"
    //   populate : ["realtion"]
    //   populate : {relation: 'relation' | ["relations"], options? : {idsOnly? : boolean} }
    // TODO: THE TYPE OF JOIN TO BE SPESIFIED (LEFT | INNER) *** MIGHT CAUSE PROBLEMS WITH THE WHERE RELATION JOINS? ***
    // TODO: ALLOW WHERE STATMENT TO BE ADDED TO THE POPULATE CAUSE. THEN IT CAN BE USED IN THE JOIN ITSELF
    private getPopulate(req): any{
        var populate;
        if (req.query.populate) populate = unescape(req.query.populate)
        else populate = (typeof req.body.populate !== 'undefined' ? req.body.populate : undefined);
        if (_.isString(populate)) {
            try {
                populate = JSON.parse(populate);
            }
            catch(e) {}
        }
        return populate;
    }

    //GET THE WHERE FROM THE REQUEST
    // Where clasue is in the following format:
    //  where: { fieldname : value }        |  ** Where Fieldname = Value
    //  where: { fieldname : [value] }       | ** Where Fieldname IN (Values)
    //  where: { fieldname : { opperator: value | [values] } } ** WHERE Fieldname Opperator Value | (Values)
    //
    //        * Opperators :
    //                      EQ  : WHERE FIELD = VALUE
    //                      IN  : WHERE FIELD IN (VALUES)
    //                      LT  : WHERE FIELD < VALUE
    //                      LTE : WHERE FIELD <= VALUE
    //                      GT  : WHERE FIELD > VALUE
    //                      GTE : WHERE FIELD => VALUE
    //                      LIKE: WHERE FIELD LIKE "VALUE"
    //                      NUL: WHERE FIELD IS NULL
    //                      !NUL: WHERE FIELD IS NOT NULL
    //                      !OP : WHERE FIELD NOT OPERATOR VALUE
    //
    //  where: OR [{ fieldname : value },
    //             { fieldname : [value] },
    //             { fieldname : { opperator: value | [values] } },
    //            ]

    //Test

    private getWhere(req): any{
        var DEFAULT_WHERE = null;
        var where;
        if (req.query.where) where = unescape(req.query.where)
        else where = (typeof req.body.where !== 'undefined' ? req.body.where : DEFAULT_WHERE)

        //console.log("WHERE=",where);
        if (_.isString(where)) {
            try {
                where = JSON.parse(where);
            }
            catch(e) {}
        }
        return where;
    }
//GET THE LIMIT FROM THE REQUEST
    public getLimit(req): number {
        const DEFAULT_LIMIT = 50;
        var limit;
        if (req.query.limit) limit = unescape(req.query.limit)
        else limit = (typeof req.body.limit !== 'undefined' ? req.body.limit : DEFAULT_LIMIT)

        if (limit) { limit = +limit; }
        return limit;
    }
//GET THE SKIP FROM THE REQUEST
    public getSkip(req): number{
        var DEFAULT_SKIP = 0;
        var skip;
        if (req.query.skip) skip = unescape(req.query.skip)
        else skip = (typeof req.body.skip !== 'undefined' ? req.body.skip : DEFAULT_SKIP)

        if (skip) { skip = +skip; }
        //console.log("SKIP=",skip);
        return skip;
    }
//GET THE SORT FROM THE REQUEST
    public getSort(req): any{
        var sort;
        if (req.query.sort) sort = unescape(req.query.sort)
        else sort = (typeof req.body.sort !== 'undefined' ? req.body.sort : undefined);

        // If `sort` is a string, attempt to JSON.parse() it.
        // (e.g. `{"name": 1}`)
        if (_.isString(sort)) {
            try {
                sort = JSON.parse(sort);
            }
                // If it is not valid JSON, then fall back to interpreting it as-is.
                // (e.g. "{name, ASC}")
            catch(e) {}
        }
        return sort;
    }


    //PHRASE THE WHERE QUERY INTO THE APPROPRIATE FORMAT SO IT CAN BE EASILY APPLIED TO THE QUERY ITSELF
    private phraseWhere(where: any,options?:{ isOR?: boolean }) : WhereClause[]{

        if(!_.isPlainObject(where)){
          console.log("Cannot process where statement. Must be an Object");
          return [];
        }

        let whereList: WhereClause[] = [];

        if (where)
       _.forIn(where, (value, key) => {
           //if KEY IS AND | OR THEN ADD ALL AND | OR INSTANCES
           //console.log("PHRASEWHERE VALUE:",value,'KEY:',key);
           if (_.toUpper(key) === 'AND' || _.toUpper(key) === 'OR') {
               //THEN MAKE SURE IT IS AN ARRAY AND THAT IT HAS ATLEAST 2 VALUES IN IT.
               if (_.isArray(value) && value.length > 1) {
                   //THEN SEND THROUGH THE SINGLE WHERE STATEMENTS WITH THE SPECIFIC OPTIONS.
                   _.forEach(value, (singlewhere) => {
                       //options.isOR = (_.toUpper(key) === 'OR');
                       //query = this.phraseWhere(query,modelMetaData,singlewhere,options);
                       whereList = _.concat(whereList,this.phraseWhere(singlewhere,{ isOR: (_.toUpper(key) === 'OR')}));
                   });
               } else {
                   //RETURN AN ERROR. OR MUST BE AN ARRAY AND HAVE MORE THAN ONE OR ITEM
                   throw new HttpException('WHERE AND | OR STATEMENTS MUST BE AN ARRAY AND CONTAIN MORE THAN ONE ITEM', HttpStatus.BAD_REQUEST);
               }
           } else {
               if (_.isPlainObject(value)) { // Meaning the value is { opperator: value | [values] }
                   _.forIn(value, (actval, opp) => {
                       whereList.push({field:key,opp:_.toUpper(opp),value:actval});
                      // query = this.applyWhere(query,modelMetaData,{field:key,opp:_.toUpper(opp),value:actval},options);
                   });
               } else if (!_.isString(value) && _.isArray(value)){ //MEANING ITS AN ARRAY { fieldname : [value] }
                   whereList.push({field:key,opp:"IN",value:value});
                  // query = this.applyWhere(query,modelMetaData,{field:key,opp:"IN",value:value},options);
               } else { //ITS JUST EQUALS { fieldname : value }
                   whereList.push({field:key,opp:"EQ",value:value});
                   //query = this.applyWhere(query,modelMetaData,{field:key,opp:"EQ",value:value},options);

               }
           }
       });

       return whereList;
   }

   //APPLY THE WHERE STATEMENT TO THE ACTUAL QUERY
    //TODO: GROUP OR STATEMENTS INTO A SEPERATE ()
    //EG: OR - ALL STATEMENTS MUST BE IN A SINGLE () SO WE CAN ACHIEVE A QUERY LIKE
    //
    //     [**FROM ACL*]     [*************************FROM REQUEST WHERE**************************************************]
    //WHERE (COMPANY = 1) AND (roles IN ("test") AND ( first_name LIKE %TEST% OR last_name LIKE %TEST% OR email LIKE %TEST%))
    //
   private applyWhere(query: SelectQueryBuilder<any>
                      ,modelMetaData: EntityMetadata,wherelist: WhereClause[]): SelectQueryBuilder<any>{

       let modelname = modelMetaData.name;
       let options = _.get(query, "srvoptions");
       if (!options) options = {count: 0};
       //COUNT VALUE KEEPS TRACK OF THE NUMBER OF TIMES WE ADDED A WHERE CAUSE. THIS HELPS WITH INJECTING PARAMETERS.
       if (!options.count) options.count = 0;
       let parameters = [];

       if (!wherelist || wherelist.length == 0)return query;

       let finWhre = `(`;
       //RUN THROUGH EACH WHERE AND ADD IT TO THE GROUPED WHERE
       wherelist.forEach((where)=>{

           let strWhre = ``;
           if (!_.includes(where.field,'.' )){
               strWhre += `${modelname}.${where.field} `;
           }
           else {
               const field = _.split(where.field, '.');
               //CHECK IF ITS A RELATION
               let relation = modelMetaData.findRelationWithPropertyPath(field[0]);
               if (relation){
                   //IF THERE ARE ALREADY ADDED RELATIONS
                   //let alreadyadded = _.get(query, "srvoptions.relations");
                   if (!options || !options.relations || !_.isArray(options.relations))
                       options.relations = [];
                   //CHECK IF THIS RELATION HAS NOT BEEN ADDED YET
                   if (_.indexOf(options.relations,field[0]) == -1){
                       //IF IT HAS NOT, ADD IT
                       query.innerJoin(`${modelname}.${field[0]}`, `${field[0]}${options.count}`)
                       options.relations.push(field[0]);
                       _.set(query, "srvoptions", options);
                   }
                   //ADD THE WHERE FOR IT
                   strWhre += `${where.field} `
               } else {
                   //IF ITS NOT A REALTION, FOR NOW JUST LOG IT UNTIL WE KNOW MORE TODO: FAIL IF WE FOUND THIS
                   console.log(`ERROR: FOUND A '.' IN A FIELD NAME THATS NOT A RELATION: FIELDNAME=${where.field} WHERE=`,where,'WHEREOPTIONS=',options);
                   strWhre += `${where.field} `
               }

           }
           //TODO: MOVE THIS TO A DIFFERENT FUNCTION SO IT CAN BE REUSED LATER ON.
           switch (where.opp){
               case "EQ": strWhre = strWhre + `= :${where.field}${options.count}`;
                   break;
               case "!EQ": strWhre = strWhre + `<> :${where.field}${options.count}`;
                   break;
               case "IN": strWhre = strWhre + `IN (:${where.field}${options.count})`;
                   break;
               case "!IN": strWhre = strWhre + `NOT IN (:${where.field}${options.count})`;
                   break;
               case "LIKE": strWhre = strWhre + `LIKE :${where.field}${options.count}`;
                   break;
               case "!LIKE": strWhre = strWhre + `NOT LIKE :${where.field}${options.count}`;
                   break;
               case "!GTE":
               case "LT": strWhre = strWhre + `< :${where.field}${options.count}`;
                   break;
               case "!GT":
               case "LTE": strWhre = strWhre + `<= :${where.field}${options.count}`;
                   break;
               case "!LTE":
               case "GT": strWhre = strWhre + `> :${where.field}${options.count}`;
                   break;
               case "!LT":
               case "GTE": strWhre = strWhre + `>= :${where.field}${options.count}`;
                   break;
               case "NUL": strWhre = strWhre + `IS NULL`;
                   break;
               case "!NUL": strWhre = strWhre + `IS NOT NULL`;
                   break;
               default:
                   throw new HttpException(`WHERE OPPERATOR NOT FOUND: ${JSON.stringify(where)}`, HttpStatus.BAD_REQUEST);
           }

           if ( finWhre === `(`){
               // NO WHERE ADDED YET
               finWhre += strWhre
           }
           else {
               // NO WHERE ADDED YET
               if (where.options && !where.options.isOR)
                   finWhre += ' AND ' + strWhre;
               else finWhre += ' OR ' + strWhre;
           }
           query.setParameter(`${where.field}${options.count}` ,where.value);
       });

       finWhre += ')';
       //CHECK IF A PREVIOUS WHERE STATEMENT HAS ALREADY BEEN ADDED.
       if (!options || !options.whereAdded){
           query.where(finWhre);
           options.whereAdded = true;
           _.set(query, "srvoptions", options);
       } else {
               query.andWhere(finWhre);
       }
       //SET THE VALUEs FOR THE WHERE
       options.count += 1;
       _.set(query, "srvoptions", options);
       return query;
   }

   //PHRASE THE POPULATE STATEMENT INTO THE APPROPRIATE FORMAT SO IT CAN BE EASILY APPLIED TO THE QUERY ITSELF
    /*TODO: MAKE THIS A RETURN VALUE TO ONLY RETURN THE FORMATED POPULATES
         THIS WAY WE CAN USE IT FOR SOMETHING ELSE LATER ON*/
   private phraseRelations(query: SelectQueryBuilder<any>
       ,modelMetaData: EntityMetadata ,populate: any): SelectQueryBuilder<any>{

       if(!_.isString(populate) && !_.isPlainObject(populate) && !_.isArray(populate)){
           console.log("Cannot process populate statement. Must be an Object or a String or a String[]");
           return query;
       }
       if (_.isString(populate) && !_.isArray(populate) ){//single relation
           query = this.applyPopulate(query,modelMetaData,{relation: populate});
       } else if (_.isArray(populate) && populate.length > 0 && _.isString(populate[0])){  //Array string relation
           _.forEach(populate, (singlepopulate) => {
               query =  this.applyPopulate(query,modelMetaData,{relation: singlepopulate});
           });
       } else if (_.isArray(populate) && populate.length > 0 && _.isPlainObject(populate[0]) ){ //Array PopulateCause relation
           _.forEach(populate, (singlepopulate) => {
               query =   this.applyPopulate(query,modelMetaData,singlepopulate);
           });
       } else if (_.isPlainObject(populate)) {//Single PopulateCause relation
           query = this.applyPopulate(query,modelMetaData,populate);
       } else {
           //DONT KNOW WHAT IT IS THROW AN ERROR
           console.log("Cannot process populate statement. Must be an Object or a String or a String[]");
           return query;
       }

        return query;
   }
   // APPLY A FORMATED POPULATE STATEMENT TO THE QUERY ITSELF
    /*TODO: MAKE THIS A PROMISE TO ATTACH THE FORMATTED POPULATES
         THIS WAY WE CAN USE phrasePopulate FOR SOMETHING ELSE LATER ON*/
   private applyPopulate(query: SelectQueryBuilder<any>
       ,modelMetaData: EntityMetadata ,populate: PopulateCause): SelectQueryBuilder<any>{

        //CHECK IF THE METADATA CONTAINS THE RELATION FIRST
       const relation = modelMetaData.findRelationWithPropertyPath(`${populate.relation}`)
       let options = _.get(query, "srvoptions");
       if (!options) options = {};
       if (!options.relations || !_.isArray(options.relations))
           options.relations = [];

        if (relation){
                if (_.indexOf(options.relations,populate.relation) == -1){
                    if (populate.options && populate.options.idsOnly) {
                        query.leftJoinAndSelect(`${modelMetaData.name}.${populate.relation}`, populate.relation,);
                        console.log("APPLYPOPULATE: RELATION:", populate, " ON MODEL", modelMetaData.name, "ID`s ONLY NOT IMPLEMENTED YET");
                    } else {
                        query.leftJoinAndSelect(`${modelMetaData.name}.${populate.relation}`, populate.relation);
                    }
                    options.relations.push(populate.relation);
                    _.set(query, "srvoptions.relations", options.relations);
                }
        }
        else {
           //RELATION NOT FOUND, THROW AN ERROR
           console.log("APPLYPOPULATE: RELATION:",populate,"WAS NOT FOUND ON MODEL",modelMetaData.name);
           throw new HttpException(`RELATION:${populate} WAS NOT FOUND ON MODEL ${modelMetaData.name}`, HttpStatus.BAD_REQUEST);
        }
        return query;
   }

    public phraseWhereValues(wherelist: WhereClause[],data) : WhereClause[]{
       return wherelist.map((where)=>{
            if (!_.isString(where.value) && _.isArray(where.value))
            {
                let newArray = [];
                where.value.forEach((value) => {
                    if (_.isString(value) && value.startsWith("$")){
                        let field = value.replace("$","");
                        if (_.has(data,field)){
                            let newValue = _.get(data,field);
                            if (!_.isString(newValue) && _.isArray(newValue))
                              newArray = newArray.concat(newValue);
                            else newArray.push(newValue);
                        }
                    } else newArray.push(value);
                });
                where.value = newArray;
            }
            else if (_.isString(where.value) && where.value.startsWith("$")){
                let field = where.value.replace("$","");
                if (_.has(data,field)){
                    where.value = _.get(data,field);
                }
            }
            return where;
        });

    }

    //BUILD A SELECT QUERY TO FETCH MODELS
    public buildWhere(query: SelectQueryBuilder<any>,model: string,req): SelectQueryBuilder<any> {
        //get the meta data so we can see if fields are relations, primary keys,etc

        const modelMetaData = this.connection.getMetadata(model);

        //get the where clause from the request
        const requestWhere = this.phraseWhere(this.getWhere(req));

        const populate = this.getPopulate(req);
        //console.log("POPULATE =",populate);
        //POPULATE RELATIONS FIRST
        if (populate) query = this.phraseRelations(query,modelMetaData,populate);

        //console.log("ADDED RELATIONS = ",_.get(query, "srvoptions.relations"));
        //TODO: GET ACL CRITERIA
        //TODO: MERGE ACL WHERE WITH THE REQ WHERE
            // ****MIGHT NOT NEED TO MERGE IF WHERE STATEMENTS ARE GROUPED?
            // ****JUST APPLY ACL FIRST THEN REQ, DB SHOULD HANDEL THE REST?
            //SOME RULES SHOULD APPLY WHEN MERGING,
                //1. HIGHER ORDER ACL WHERE TAKE PRECEDENCE OVER LOWER LEVEL ACL WHERE FOR SECURITY REASONS
                //2. ACL WHERE TAKES PRECEDENCE OVER REQ WHERE FOR SECURITY REASONS
        if (req.options && req.options.acl && req.options.acl.length > 0)
        {
            req.options.acl.forEach((acl)=>{
                if (acl.criteria && acl.criteria.where){
                    let where = this.phraseWhere(acl.criteria.where);
                    //TODO: REPLACE SYSTEM VALUES FOR WHERE
                    where = this.phraseWhereValues(where,{user: req.user});
                    query = this.applyWhere(query,modelMetaData,where);
                    console.log("ACL WHERE ADDED:",where);
                }
            });
        }
        //Translate the where clase from the request to an TypeORM Where clasue
        if (requestWhere) query = this.applyWhere(query,modelMetaData,requestWhere);
        console.log("REQ WHERE ADDED:",requestWhere);

        return query;
    }

}