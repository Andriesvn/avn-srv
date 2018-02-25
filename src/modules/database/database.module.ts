import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Connection, ConnectionOptions} from "typeorm";


const connectionOptions: ConnectionOptions = {
  type: 'sqlite',
  database: 'data/test.db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
}

@Module({
  imports: [TypeOrmModule.forRoot(connectionOptions)],
})
export class DatabaseModule {
  constructor(private readonly connection: Connection) {
    console.log(connection.getMetadata("user"));
  }
}