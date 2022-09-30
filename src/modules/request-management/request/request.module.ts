import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayBenefitRepository } from 'src/modules/benefit-management/holiday-benefit/holiday-benefit.repository';
import { PolicyRepository } from 'src/modules/policy-management/policy/policy.repository';
import { GenWorktimeStgRepository } from 'src/modules/worktime-management/general-worktime-setting/general-worktime-setting.repository';
import { RequestController } from './request.controller';
import { TimeRequest } from './request.entity';
import { RequestRepository } from './request.repository';
import { RequestService } from './request.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimeRequest])],
  controllers: [RequestController],
  providers: [
    RequestService,
    RequestRepository,
    PolicyRepository,
    GenWorktimeStgRepository,
    HolidayBenefitRepository,
  ],
  exports: [],
})
export class RequestModule {}
