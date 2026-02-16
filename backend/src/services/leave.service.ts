import prisma from '../config/database';
import { ApplyLeaveDto, ApproveLeaveDto } from '../dtos/leave.dto';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/app-error';
import { Role } from '@prisma/client';

export class LeaveService {
  async apply(employeeId: string, dto: ApplyLeaveDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      throw new ValidationError('End date must be after start date');
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const year = startDate.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: { employeeId_leaveType_year: { employeeId, leaveType: dto.leaveType, year } },
    });

    if (dto.leaveType !== 'UNPAID' && (!balance || balance.remaining < totalDays)) {
      throw new ValidationError('Insufficient leave balance');
    }

    return prisma.leave.create({
      data: {
        employeeId,
        leaveType: dto.leaveType,
        startDate,
        endDate,
        totalDays,
        reason: dto.reason,
      },
    });
  }

  async approve(leaveId: string, approverId: string, approverRole: Role, dto: ApproveLeaveDto) {
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: { employee: { include: { manager: true } }, approvals: true },
    });

    if (!leave) throw new NotFoundError('Leave request');
    if (leave.status !== 'PENDING') throw new ValidationError('Leave is not pending');

    // Validate approval chain: Employee -> TeamLead -> Manager -> HR
    const approvalOrder: Role[] = ['TEAM_LEAD', 'MANAGER', 'HR'];
    const currentApprovals = leave.approvals.map((a) => a.role);

    const roleIndex = approvalOrder.indexOf(approverRole);
    if (roleIndex === -1 && approverRole !== 'ADMIN') {
      throw new ForbiddenError('Not authorized to approve leaves');
    }

    // Check if previous levels have approved (skip for ADMIN)
    if (approverRole !== 'ADMIN') {
      for (let i = 0; i < roleIndex; i++) {
        if (!currentApprovals.includes(approvalOrder[i])) {
          throw new ValidationError(`Waiting for ${approvalOrder[i]} approval first`);
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.leaveApproval.create({
        data: {
          leaveId,
          approverId,
          role: approverRole,
          action: dto.action,
          comment: dto.comment,
        },
      });

      // If rejected at any level, reject the leave
      if (dto.action === 'REJECTED') {
        return tx.leave.update({
          where: { id: leaveId },
          data: { status: 'REJECTED' },
        });
      }

      // If HR approved (final level) or ADMIN approved, mark as approved
      if (approverRole === 'HR' || approverRole === 'ADMIN') {
        // Deduct leave balance
        if (leave.leaveType !== 'UNPAID') {
          const year = leave.startDate.getFullYear();
          await tx.leaveBalance.update({
            where: {
              employeeId_leaveType_year: {
                employeeId: leave.employeeId,
                leaveType: leave.leaveType,
                year,
              },
            },
            data: {
              used: { increment: leave.totalDays },
              remaining: { decrement: leave.totalDays },
            },
          });
        }

        return tx.leave.update({
          where: { id: leaveId },
          data: { status: 'APPROVED' },
        });
      }

      return tx.leave.findUnique({ where: { id: leaveId } });
    });

    return result;
  }

  async getByEmployee(employeeId: string) {
    return prisma.leave.findMany({
      where: { employeeId },
      include: { approvals: { include: { approver: { select: { email: true, employee: { select: { fullName: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPending(companyId: string, approverRole: Role) {
    return prisma.leave.findMany({
      where: {
        status: 'PENDING',
        employee: { companyId },
      },
      include: {
        employee: { select: { id: true, fullName: true, department: true, employeeCode: true } },
        approvals: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBalances(employeeId: string) {
    const year = new Date().getFullYear();
    return prisma.leaveBalance.findMany({
      where: { employeeId, year },
    });
  }
}
