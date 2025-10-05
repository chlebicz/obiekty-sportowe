import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service'
import { FacilitiesModule } from './facilities/facilities.module';
import { postgresql } from 'config.json';
import { Facility } from './facilities/facility.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: postgresql.host,
      port: postgresql.port,
      database: postgresql.database,
      username: postgresql.username,
      password: postgresql.password,
      entities: [Facility],
      synchronize: true,
      extra: {
        pool_mode: 'session'
      },
    }),
    FacilitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
