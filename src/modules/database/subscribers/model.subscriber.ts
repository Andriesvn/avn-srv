import {EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent} from "typeorm";
import * as _ from "lodash";

//THIS CLASS IS WHERE CHANGE TRACKING AND LOGGING WOULD OCCUR


@EventSubscriber()
export class ModelSubscriber implements EntitySubscriberInterface {

    /**
     * Called after ANY entity insertion.
     */
    async afterInsert(event: InsertEvent<any>): Promise<any>{
        // GET THE CLASS NAME OF THE ENTITY
        const modelname = event.entity.constructor.name;
        const modelRes = event.manager.getRepository(modelname);
        const modelMeta = modelRes.metadata;
        // THIS IS WHERE INJECTED DATA WILL LIVE IF WE HAVE INJECTED IT
        const eventData = event.manager.queryRunner.data;
        console.log(`MODEL SUBSCRIBER: AFTER ${_.toUpper(modelname)} INSERTED - EVENTDATA:`/*,eventData*/);
    }

    /**
     * Called after ANY entity update.
     */
    afterUpdate(event: UpdateEvent<any>){
        // GET THE CLASS NAME OF THE ENTITY
        const modelname = event.entity.constructor.name;
        const modelRes = event.manager.getRepository(modelname);
        const modelMeta = modelRes.metadata;
        // THIS IS WHERE INJECTED DATA WILL LIVE IF WE HAVE INJECTED IT
        const eventData = event.manager.queryRunner.data;
        console.log(`MODEL SUBSCRIBER: AFTER ${_.toUpper(modelname)} UPDATED - EVENTDATA:`/*,eventData*/);
    }

    /**
     * Called after ANY entity Removal.
     */
    afterRemove(event: UpdateEvent<any>){
        // GET THE CLASS NAME OF THE ENTITY
        const modelname = event.entity.constructor.name;
        const modelRes = event.manager.getRepository(modelname);
        const modelMeta = modelRes.metadata;
        // THIS IS WHERE INJECTED DATA WILL LIVE IF WE HAVE INJECTED IT
        const eventData = event.manager.queryRunner.data;
        console.log(`MODEL SUBSCRIBER: AFTER ${_.toUpper(modelname)} REMOVED - EVENTDATA:`/*,eventData*/);
    }

}