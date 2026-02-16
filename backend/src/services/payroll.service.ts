import prisma from '../config/database';
import { GeneratePayrollDto } from '../dtos/payroll.dto';
import { NotFoundError, ValidationError } from '../utils/app-error';
import PDFDocument from 'pdfkit';
import { Decimal } from '@prisma/client/runtime/library';

export class PayrollService {
  async generate(dto: GeneratePayrollDto) {
    const employee = await prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundError('Employee');

    // Check if already generated
    const existing = await prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId: dto.employeeId, month: dto.month, year: dto.year } },
    });
    if (existing) throw new ValidationError('Payroll already generated for this month');

    const salary = Number(employee.salary);
    const basicSalary = salary * 0.5;   // 50% of CTC
    const hra = salary * 0.2;           // 20% of CTC
    const allowances = dto.allowances ?? salary * 0.3; // 30% or custom
    const grossEarnings = basicSalary + hra + allowances;

    // Deductions
    const pf = basicSalary * 0.12;     // 12% of basic
    const tax = grossEarnings * 0.1;   // ~10% tax estimate
    const leaveDeduction = 0;          // Attendance doesn't affect salary
    const otherDeductions = dto.otherDeductions ?? 0;
    const totalDeductions = pf + tax + leaveDeduction + otherDeductions;
    const netSalary = grossEarnings - totalDeductions;

    return prisma.payroll.create({
      data: {
        employeeId: dto.employeeId,
        month: dto.month,
        year: dto.year,
        basicSalary: new Decimal(basicSalary.toFixed(2)),
        hra: new Decimal(hra.toFixed(2)),
        allowances: new Decimal(allowances.toFixed(2)),
        grossEarnings: new Decimal(grossEarnings.toFixed(2)),
        pf: new Decimal(pf.toFixed(2)),
        tax: new Decimal(tax.toFixed(2)),
        leaveDeduction: new Decimal(leaveDeduction.toFixed(2)),
        otherDeductions: new Decimal(otherDeductions.toFixed(2)),
        totalDeductions: new Decimal(totalDeductions.toFixed(2)),
        netSalary: new Decimal(netSalary.toFixed(2)),
      },
    });
  }

  private async calculateLeaveDeduction(
    employeeId: string,
    month: number,
    year: number,
    salary: number
  ): Promise<number> {
    // Count unpaid leave days that fall within this specific month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const unpaidLeaves = await prisma.leave.findMany({
      where: {
        employeeId,
        leaveType: 'UNPAID',
        status: 'APPROVED',
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
    });

    // Calculate only the days that overlap with this month
    let totalUnpaidDays = 0;
    for (const leave of unpaidLeaves) {
      const overlapStart = leave.startDate > monthStart ? leave.startDate : monthStart;
      const overlapEnd = leave.endDate < monthEnd ? leave.endDate : monthEnd;
      const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalUnpaidDays += Math.max(0, days);
    }

    const perDaySalary = salary / 30;
    return totalUnpaidDays * perDaySalary;
  }

  async getByEmployee(employeeId: string) {
    return prisma.payroll.findMany({
      where: { employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getSlip(payrollId: string, companyId: string) {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
            department: true,
            designation: true,
            companyId: true,
            dateOfJoining: true,
            company: { select: { name: true } },
          },
        },
      },
    });
    if (!payroll || payroll.employee.companyId !== companyId) throw new NotFoundError('Payroll record');
    return payroll;
  }

  async generatePdf(payrollId: string, companyId: string): Promise<Buffer> {
    const payroll = await this.getSlip(payrollId, companyId);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const payMonth = monthNames[payroll.month - 1] || '';
    const companyName = (payroll.employee as any).company?.name || 'Company';
    const fmt = (v: number | any) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;
      const m = 40; // margin
      const contentW = pageW - m * 2;
      const colHalf = contentW / 2;
      const darkGreen = '#064e3b';
      const lightGray = '#f7f8fa';
      const borderColor = '#d1d5db';
      const accent = '#059669';

      // ── Company Header Band ──
      doc.rect(0, 0, pageW, 80).fill(darkGreen);
      doc.fontSize(18).fillColor('#ffffff').font('Helvetica-Bold')
        .text(companyName.toUpperCase(), m, 22, { width: contentW });
      doc.fontSize(10).fillColor('#94a3b8').font('Helvetica')
        .text(`Payslip for ${payMonth} ${payroll.year}`, m, 48, { width: contentW });
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
        .text(`Ref: ${payroll.id.slice(0, 8).toUpperCase()}`, m, 48, { width: contentW, align: 'right' });

      // ── Employee Details Box ──
      let y = 95;
      doc.rect(m, y, contentW, 65).lineWidth(0.5).strokeColor(borderColor).fillAndStroke(lightGray, borderColor);

      const infoCol = contentW / 4;
      const fields = [
        { label: 'Employee Name', value: payroll.employee.fullName },
        { label: 'Employee Code', value: payroll.employee.employeeCode },
        { label: 'Department', value: payroll.employee.department },
        { label: 'Designation', value: payroll.employee.designation },
      ];
      fields.forEach((f, i) => {
        const x = m + 12 + i * infoCol;
        doc.fontSize(7).fillColor('#6b7280').font('Helvetica').text(f.label.toUpperCase(), x, y + 12, { width: infoCol - 16 });
        doc.fontSize(9).fillColor('#111827').font('Helvetica-Bold').text(f.value, x, y + 25, { width: infoCol - 16 });
      });

      // Pay period row
      y += 65;
      doc.rect(m, y, contentW, 28).lineWidth(0.5).strokeColor(borderColor).fillAndStroke('#ffffff', borderColor);
      doc.fontSize(8).fillColor('#6b7280').font('Helvetica').text('PAY PERIOD', m + 12, y + 9);
      doc.fontSize(9).fillColor('#111827').font('Helvetica-Bold').text(`${payMonth} ${payroll.year}`, m + 100, y + 9);
      doc.fontSize(8).fillColor('#6b7280').font('Helvetica').text('PAYMENT DATE', m + contentW / 2, y + 9);
      doc.fontSize(9).fillColor('#111827').font('Helvetica-Bold')
        .text(new Date(payroll.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), m + contentW / 2 + 100, y + 9);

      // ── Earnings & Deductions Side by Side ──
      y += 45;

      // Table headers
      const drawTableHeader = (x: number, w: number, title: string, color: string) => {
        doc.rect(x, y, w, 24).fill(color);
        doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold')
          .text(title, x + 12, y + 7, { width: w - 24 });
      };

      drawTableHeader(m, colHalf, 'EARNINGS', '#059669');
      drawTableHeader(m + colHalf, colHalf, 'DEDUCTIONS', '#dc2626');

      y += 24;

      // Table row helper
      const drawRow = (x: number, w: number, label: string, value: string, rowY: number, isTotal = false) => {
        const bg = isTotal ? lightGray : '#ffffff';
        doc.rect(x, rowY, w, 22).lineWidth(0.5).strokeColor(borderColor).fillAndStroke(bg, borderColor);
        const font = isTotal ? 'Helvetica-Bold' : 'Helvetica';
        const textColor = isTotal ? '#111827' : '#374151';
        doc.fontSize(8.5).fillColor(textColor).font(font).text(label, x + 12, rowY + 6, { width: w * 0.6 - 12 });
        doc.fontSize(8.5).fillColor(textColor).font(font).text(value, x + w * 0.6, rowY + 6, { width: w * 0.4 - 12, align: 'right' });
      };

      // Earnings rows
      const earnings = [
        { label: 'Basic Salary', value: fmt(payroll.basicSalary) },
        { label: 'House Rent Allowance (HRA)', value: fmt(payroll.hra) },
        { label: 'Other Allowances', value: fmt(payroll.allowances) },
      ];

      // Deductions rows
      const deductions = [
        { label: 'Provident Fund (PF)', value: fmt(payroll.pf) },
        { label: 'Income Tax (TDS)', value: fmt(payroll.tax) },
        { label: 'Leave Deduction', value: fmt(payroll.leaveDeduction) },
        { label: 'Other Deductions', value: fmt(payroll.otherDeductions) },
      ];

      const maxRows = Math.max(earnings.length, deductions.length);

      for (let i = 0; i < maxRows; i++) {
        if (i < earnings.length) {
          drawRow(m, colHalf, earnings[i].label, earnings[i].value, y);
        } else {
          doc.rect(m, y, colHalf, 22).lineWidth(0.5).strokeColor(borderColor).fillAndStroke('#ffffff', borderColor);
        }
        if (i < deductions.length) {
          drawRow(m + colHalf, colHalf, deductions[i].label, deductions[i].value, y);
        } else {
          doc.rect(m + colHalf, y, colHalf, 22).lineWidth(0.5).strokeColor(borderColor).fillAndStroke('#ffffff', borderColor);
        }
        y += 22;
      }

      // Totals row
      drawRow(m, colHalf, 'Gross Earnings', fmt(payroll.grossEarnings), y, true);
      drawRow(m + colHalf, colHalf, 'Total Deductions', fmt(payroll.totalDeductions), y, true);
      y += 22;

      // ── Net Salary Box ──
      y += 15;
      doc.rect(m, y, contentW, 50).fill(accent);
      doc.fontSize(10).fillColor('#d1fae5').font('Helvetica').text('NET PAY', m + 20, y + 10, { width: contentW - 40 });
      doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
        .text(`INR ${fmt(payroll.netSalary)}`, m + 20, y + 24, { width: contentW - 40 });
      // Amount in words placeholder
      y += 50;

      // ── Footer ──
      y += 25;
      doc.moveTo(m, y).lineTo(m + contentW, y).lineWidth(0.5).strokeColor(borderColor).stroke();
      y += 10;
      doc.fontSize(7).fillColor('#9ca3af').font('Helvetica')
        .text('This is a system-generated payslip and does not require a signature.', m, y, { width: contentW, align: 'center' });
      doc.fontSize(7).fillColor('#9ca3af').font('Helvetica')
        .text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, m, y + 12, { width: contentW, align: 'center' });

      doc.end();
    });
  }

  async getAll(companyId: string, month?: number, year?: number) {
    const where: Record<string, unknown> = { employee: { companyId } };
    if (month) where.month = month;
    if (year) where.year = year;

    return prisma.payroll.findMany({
      where,
      include: { employee: { select: { fullName: true, employeeCode: true, department: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}
