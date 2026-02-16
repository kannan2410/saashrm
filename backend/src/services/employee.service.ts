import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dtos/employee.dto';
import { NotFoundError, ValidationError } from '../utils/app-error';
import { uploadBlob, deleteBlob } from '../config/azure-storage';

export class EmployeeService {
  async getAll(companyId: string, filters?: { department?: string; status?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (filters?.department) where.department = filters.department;
    if (filters?.status) where.status = filters.status;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          manager: { select: { id: true, fullName: true } },
          user: { select: { role: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total, page, limit };
  }

  async getById(id: string, companyId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, fullName: true } },
        user: { select: { id: true, email: true, role: true } },
      },
    });
    if (!employee || employee.companyId !== companyId) throw new NotFoundError('Employee');
    return employee;
  }

  async getByUserId(userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        manager: { select: { id: true, fullName: true } },
        user: { select: { id: true, email: true, role: true } },
      },
    });
    if (!employee) throw new NotFoundError('Employee');
    return employee;
  }

  async updateOwnProfile(userId: string, data: { fullName?: string; phone?: string; workLocation?: string }) {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundError('Employee');

    const updateData: Record<string, unknown> = {};
    if (data.fullName && data.fullName.trim()) updateData.fullName = data.fullName.trim();
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.workLocation && data.workLocation.trim()) updateData.workLocation = data.workLocation.trim();

    return prisma.employee.update({
      where: { id: employee.id },
      data: updateData,
      include: {
        manager: { select: { id: true, fullName: true } },
        user: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async create(dto: CreateEmployeeDto, companyId: string) {
    const existing = await prisma.employee.findFirst({
      where: { OR: [{ employeeCode: dto.employeeCode }, { email: dto.email }] },
    });
    if (existing) throw new ValidationError('Employee code or email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: dto.role || 'EMPLOYEE',
          companyId,
        },
      });

      const employee = await tx.employee.create({
        data: {
          employeeCode: dto.employeeCode,
          fullName: dto.fullName,
          email: dto.email,
          department: dto.department,
          designation: dto.designation,
          managerId: dto.managerId || null,
          dateOfJoining: new Date(dto.dateOfJoining),
          employmentType: dto.employmentType,
          salary: dto.salary,
          workLocation: dto.workLocation,
          companyId,
          userId: user.id,
        },
      });

      // Initialize leave balances for current year
      const year = new Date().getFullYear();
      await tx.leaveBalance.createMany({
        data: [
          { employeeId: employee.id, leaveType: 'CASUAL', year, total: 12, remaining: 12 },
          { employeeId: employee.id, leaveType: 'SICK', year, total: 10, remaining: 10 },
          { employeeId: employee.id, leaveType: 'EARNED', year, total: 15, remaining: 15 },
        ],
      });

      return employee;
    });

    return result;
  }

  async update(id: string, dto: UpdateEmployeeDto, companyId: string) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee || employee.companyId !== companyId) throw new NotFoundError('Employee');

    return prisma.employee.update({ where: { id }, data: dto });
  }

  async getOrgTree(companyId: string) {
    return prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        department: true,
        designation: true,
        managerId: true,
        user: { select: { role: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async uploadPhoto(userId: string, file: { buffer: Buffer; mimetype: string; originalname: string }) {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundError('Employee');

    // Delete old photo if exists
    if (employee.profilePhoto) {
      const oldBlobName = employee.profilePhoto.split('/').pop() || '';
      await deleteBlob('profile-photos', oldBlobName).catch(() => {});
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const blobName = `${employee.id}-${Date.now()}.${ext}`;
    const url = await uploadBlob('profile-photos', blobName, file.buffer, file.mimetype);

    return prisma.employee.update({
      where: { id: employee.id },
      data: { profilePhoto: url },
      select: { id: true, profilePhoto: true },
    });
  }

  async deletePhoto(userId: string) {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundError('Employee');
    if (!employee.profilePhoto) return { id: employee.id, profilePhoto: null };

    const blobName = employee.profilePhoto.split('/').pop() || '';
    await deleteBlob('profile-photos', blobName).catch(() => {});

    return prisma.employee.update({
      where: { id: employee.id },
      data: { profilePhoto: null },
      select: { id: true, profilePhoto: true },
    });
  }

  async getDepartments(companyId: string) {
    const departments = await prisma.employee.findMany({
      where: { companyId },
      select: { department: true },
      distinct: ['department'],
    });
    return departments.map((d) => d.department);
  }
}
