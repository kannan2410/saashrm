import prisma from '../config/database';
import { CreateHolidayDto, UpdateHolidayDto } from '../dtos/holiday.dto';
import { NotFoundError, ValidationError } from '../utils/app-error';

export class HolidayService {
  async create(companyId: string, dto: CreateHolidayDto) {
    const date = new Date(dto.date);

    // Check for duplicate holiday on same date with same name
    const existing = await prisma.holiday.findUnique({
      where: { companyId_date_name: { companyId, date, name: dto.name } },
    });

    if (existing) {
      throw new ValidationError('A holiday with this name already exists on this date');
    }

    return prisma.holiday.create({
      data: {
        companyId,
        name: dto.name,
        date,
        type: dto.type || 'COMPANY',
        description: dto.description,
      },
    });
  }

  async update(holidayId: string, companyId: string, dto: UpdateHolidayDto) {
    const holiday = await prisma.holiday.findUnique({ where: { id: holidayId } });
    if (!holiday || holiday.companyId !== companyId) {
      throw new NotFoundError('Holiday');
    }

    return prisma.holiday.update({
      where: { id: holidayId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.type && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async delete(holidayId: string, companyId: string) {
    const holiday = await prisma.holiday.findUnique({ where: { id: holidayId } });
    if (!holiday || holiday.companyId !== companyId) {
      throw new NotFoundError('Holiday');
    }

    return prisma.holiday.delete({ where: { id: holidayId } });
  }

  async getByMonth(companyId: string, month: number, year: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    return prisma.holiday.findMany({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getByYear(companyId: string, year: number) {
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31));

    return prisma.holiday.findMany({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }
}
