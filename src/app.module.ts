import { Module } from '@nestjs/common';
import { DataBaseModule } from './database/database.module';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { typeOrmConfig } from './database/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { LeaveBenefitModule } from './modules/benefit-management/leave-benefit/leave-benefit.module';
import { DepartmentModule } from './modules/department/department.module';
import { ProjectModule } from './modules/project-management/project/project.module';
import { RequestModule } from './modules/request-management/request/request.module';
import { UserModule } from './modules/user-management/user/user.module';
import { GenWorktimeStgModule } from './modules/worktime-management/general-worktime-setting/general-worktime-setting.module';
import { SharedModule } from './shared/shared.module';
import { CronModule } from './cron/cron.module';
import { TimecheckModule } from './modules/timecheck/timecheck.module';
import { TimelogModule } from './modules/timelog/timelog.module';
import { OtManagerModule } from './modules/ot-management/ot-manager.module';
import { PolicyManagerModule } from './modules/policy-management/policy-manager.module';
import { RabitmqModule } from './rabbitmq/rabbitmq.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DefaultIfEmptyInterceptor } from './middleware/default-intercepter.middleware';

@Module({
  imports: [
    // TypeOrmModule.forRoot(typeOrmConfig),
    DataBaseModule,
    SharedModule,
    AuthModule,
    UserModule,
    DepartmentModule,
    ProjectModule,
    RequestModule,
    GenWorktimeStgModule,
    LeaveBenefitModule,
    CronModule,
    TimecheckModule,
    TimelogModule,
    OtManagerModule,
    PolicyManagerModule,
    RabitmqModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DefaultIfEmptyInterceptor,
    },
  ],
})
export class AppModule {}
