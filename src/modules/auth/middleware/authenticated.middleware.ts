import {ExpressMiddleware, HttpStatus, Middleware, NestMiddleware,HttpException} from "@nestjs/common";
import * as passport from 'passport';
import * as _ from "lodash";

@Middleware()
export class AuthenticatedMiddleware implements NestMiddleware {


    resolve(): (req, res, next) => void {
        return async (req, res, next) => {
           await passport.authenticate('jwt', {session: false}, (err, user, info) => {
                       if (err) {
                            if (err === "INVALID USER"){
                                const msg = _.assign({
                                    code:  'UNAUTHORIZED',
                                    message: 'Token no longer valid',
                                });
                                return res.status(HttpStatus.UNAUTHORIZED).json(msg);
                            } else {
                                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
                            }
                        }
                        if (!user) {
                            const msg = _.assign({
                                code: info && info.code || 'UNAUTHORIZED',
                                message: info && info.message || 'Missing or invalid authentication token',
                            });
                            return res.status(HttpStatus.UNAUTHORIZED).json(msg);
                        } else {
                        // INJECT USER INTO REQUEST {
                            req.user = user;
                            //console.log("REQ.USER:",req.user);
                        }
                        next();
                     })(req, res, next);
        };

    }
}