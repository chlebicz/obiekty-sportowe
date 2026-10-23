import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { env } from './env';
import { FacilitiesModule } from './facilities/facilities.module';
import { Facility } from './facilities/facility.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: env('DB_HOST', 'localhost'),
      port: Number(env('DB_PORT', '5432')),
      database: env('DB_NAME', 'obiekty_sportowe'),
      username: env('DB_USER', 'postgres'),
      password: env('DB_PASSWORD', 'postgres'),
      entities: [Facility],
      synchronize: true,
      extra: {
        pool_mode: 'session',
      },
    }),
    FacilitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
  }
}
