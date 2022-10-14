import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { calculateBenefit } from 'src/helpers/calculate-benefit.helper';
import { AuthUserDto } from 'src/modules/auth/dto/auth-user.dto';
import { LeaveBenefit } from 'src/modules/benefit-management/leave-benefit/leave-benefit.entity';
import { LeaveBenefitRepository } from 'src/modules/benefit-management/leave-benefit/leave-benefit.repository';
import { UserLeaveBenefitRepository } from 'src/modules/benefit-management/user-leave-benefit/user-leave-benefit.repository';
import { CreateUserDto, FilterUsersDto, UpdateUserDto } from './dto';
import { UserRepository } from './user.repository';
import { GenWorktimeStgRepository } from 'src/modules/worktime-management/general-worktime-setting/general-worktime-setting.repository';
import { DepartmentRepository } from 'src/modules/department/department.repository';
import { UserRoleRepository } from '../user-role/user-role.repository';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { User } from './user.entity';
import { UserLeaveBenefit } from 'src/modules/benefit-management/user-leave-benefit/user-leave-benefit.entity';
import { hashPassword } from 'src/helpers/encrypt.helper';

@Injectable()
export class UserService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly userRepository: UserRepository,
    private readonly leaveBenefitRepository: LeaveBenefitRepository,
    private readonly userLeaveBenefitRepository: UserLeaveBenefitRepository,
    private readonly genWorktimeStgRepository: GenWorktimeStgRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async getAll(filterUsersDto: FilterUsersDto) {
    return await this.userRepository.getAll(filterUsersDto);
  }

  async findOneByConditions(conditions: any) {
    return await this.userRepository.findOneByConditions(conditions);
  }

  async update(user: AuthUserDto, code: string, updateUserDto: UpdateUserDto) {
    const { leaveBenefitCode, worktimeCode, department } = updateUserDto;
    const existUser = await this.userRepository.findOne({
      where: { code },
    });

    if (!existUser) {
      throw new NotFoundException('User not found');
    }

    const data = { ...updateUserDto, id: existUser.id, updatedBy: user.code };

    if (leaveBenefitCode) {
      const existBenefit = await this.leaveBenefitRepository.findOne({
        where: { code: leaveBenefitCode },
      });

      if (!existBenefit) {
        throw new NotFoundException('Benefit not found');
      }

      await this.updateUserBenefit(user.code, existBenefit);
    }

    if (worktimeCode) {
      const worktime = await this.genWorktimeStgRepository.findOne({
        where: { code: worktimeCode },
      });

      if (!worktime) {
        throw new NotFoundException('Worktime not found');
      }
    }

    if (department) {
      const existDepartment = await this.departmentRepository.findOne({
        where: { code: department },
      });

      if (!existDepartment) {
        throw new NotFoundException('Department not found');
      }
    }

    return await this.userRepository.update(data);
  }

  async updateUserBenefit(userCode: string, benefit: LeaveBenefit) {
    const year = new Date().getUTCFullYear();
    const existUserBenefit = await this.userLeaveBenefitRepository.findOne({
      where: { userCode, year },
    });

    if (!existUserBenefit) {
      const userBenefit = this.userLeaveBenefitRepository.create({
        userCode,
        year,
        remainingDay: calculateBenefit(benefit.standardLeave),
        standardLeave: benefit.standardLeave,
      });

      return await userBenefit.save();
    }

    const differentDays =
      benefit.standardLeave - existUserBenefit.standardLeave;

    existUserBenefit.remainingDay =
      differentDays > 0
        ? existUserBenefit.remainingDay + differentDays
        : existUserBenefit.remainingDay;
    existUserBenefit.standardLeave = benefit.standardLeave;

    return await existUserBenefit.save();
  }

  async getOwnersInfo(code: string) {
    return await this.userRepository.getOwnersInfo(code);
  }

  async getRoles(code: string) {
    return await this.userRoleRepository.find({
      where: { userCode: code },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const {
      code,
      email,
      department,
      managerCode,
      worktimeCode,
      leaveBenefitCode,
      password,
    } = createUserDto;

    const existUser = await this.userRepository.findOne({
      where: [{ code, email }],
    });

    if (existUser) {
      throw new BadRequestException('User code or user mail already exists');
    }

    const existDepartment = await this.departmentRepository.findOne({
      where: { code: department },
    });

    if (!existDepartment) {
      throw new NotFoundException('Department not found');
    }

    const existManager = await this.userRepository.findOne({
      where: { code: managerCode },
    });

    if (!existManager) {
      throw new NotFoundException('Manager not found');
    }

    const existWorktime = await this.genWorktimeStgRepository.findOne({
      where: { code: worktimeCode },
    });

    if (!existWorktime) {
      throw new NotFoundException('Worktime not found');
    }

    const existBenefit = await this.leaveBenefitRepository.findOne({
      where: { code: leaveBenefitCode },
    });

    if (!existBenefit) {
      throw new NotFoundException('Leave benefits not found');
    }

    const hashPass = await hashPassword(password);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashPass,
    });

    const userLeaveBenefit = this.userLeaveBenefitRepository.create({
      remainingDay: calculateBenefit(existBenefit.standardLeave),
      userCode: code,
      year: new Date().getUTCFullYear(),
      standardLeave: existBenefit.standardLeave,
    });

    await this.entityManager.transaction(async (transaction) => {
      await transaction.save(User, newUser);
      await transaction.save(UserLeaveBenefit, userLeaveBenefit);
    });
  }
}
