import {Component} from "@nestjs/common";
import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/of"
import {Connection, SelectQueryBuilder} from "typeorm";
import {isString, isUndefined} from "util";

@Component()
export class ModelService {

  constructor(private readonly connection: Connection) {

  }

  private getWhere(req): any{
    var DEFAULT_WHERE = null;
    var where = req.param('where') || (typeof req.body.where !== 'undefined' ? req.body.where : DEFAULT_WHERE);
    if (isString(where)) {
      try {
        where = JSON.parse(where);
      }
        // If it is not valid JSON, then fall back to interpreting it as-is.
        // (e.g. "name ASC")
      catch(e) {}
    }
    return where;
  }

  private getLimit(req): number {
    const DEFAULT_LIMIT = 50;
    var limit = req.param('limit') || (typeof req.body.limit !== 'undefined' ? req.body.limit : DEFAULT_LIMIT);
    if (limit) { limit = +limit; }
    return limit;
  }

  private getSkip(req): number{
    var DEFAULT_SKIP = 0;
    var skip = req.param('skip') || (typeof req.body.skip !== 'undefined' ? req.body.skip : DEFAULT_SKIP);
    if (skip) { skip = +skip; }
    return skip;
  }

  private getSort(req): any{
    var sort = req.param('sort') || req.body.sort;
    if (isUndefined(sort)) {return undefined;}
    // If `sort` is a string, attempt to JSON.parse() it.
    // (e.g. `{"name": 1}`)
    if (isString(sort)) {
      try {
        sort = JSON.parse(sort);
      }
        // If it is not valid JSON, then fall back to interpreting it as-is.
        // (e.g. "name ASC")
      catch(e) {}
    }
    return sort;
  }

  public findAll(model: string,req,res): Observable<any[]> {
    const findModelQuery = this.buildSelectQuery(model,req);

    return Observable.of([]);
  }

  private buildSelectQuery(model: string,req) : SelectQueryBuilder<any>{
    let modelQuery = this.connection.getRepository(model).createQueryBuilder();
    const sort = this.getSort(req);

    modelQuery = this.buildSelectWhere(modelQuery,model,req);


    modelQuery.take(this.getLimit(req));
    modelQuery.skip(this.getSkip(req));
    if (!isUndefined(sort)) modelQuery.addOrderBy(this.getSort(req));
    return modelQuery;
  }

  private buildSelectWhere(query: SelectQueryBuilder<any>,model: string,req): SelectQueryBuilder<any> {
    const modelMetaData = this.connection.getMetadata(model);
    const requestWhere = this.getWhere(req);


    return query;
  }

}