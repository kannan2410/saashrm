import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create company
  const company = await prisma.company.upsert({
    where: { id: 'seed-company-acme' },
    update: { name: 'Acme Corporation', domain: 'acme.com' },
    create: {
      id: 'seed-company-acme',
      name: 'Acme Corporation',
      domain: 'acme.com',
    },
  });

  // Create admin user + employee
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      password: adminPassword,
      role: Role.ADMIN,
      companyId: company.id,
    },
  });

  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      employeeCode: 'EMP001',
      fullName: 'System Admin',
      email: 'admin@acme.com',
      department: 'Administration',
      designation: 'System Administrator',
      dateOfJoining: new Date('2024-01-01'),
      employmentType: 'FULL_TIME',
      salary: 120000,
      workLocation: 'Head Office',
      companyId: company.id,
      userId: adminUser.id,
    },
  });

  // Create HR user
  const hrPassword = await bcrypt.hash('hr1234', 12);
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@acme.com' },
    update: {},
    create: {
      email: 'hr@acme.com',
      password: hrPassword,
      role: Role.HR,
      companyId: company.id,
    },
  });

  await prisma.employee.upsert({
    where: { userId: hrUser.id },
    update: {},
    create: {
      employeeCode: 'EMP002',
      fullName: 'Jane HR',
      email: 'hr@acme.com',
      department: 'Human Resources',
      designation: 'HR Manager',
      dateOfJoining: new Date('2024-01-15'),
      employmentType: 'FULL_TIME',
      salary: 95000,
      workLocation: 'Head Office',
      companyId: company.id,
      userId: hrUser.id,
    },
  });

  // Create a sample employee
  const empPassword = await bcrypt.hash('emp123', 12);
  const empUser = await prisma.user.upsert({
    where: { email: 'john@acme.com' },
    update: {},
    create: {
      email: 'john@acme.com',
      password: empPassword,
      role: Role.EMPLOYEE,
      companyId: company.id,
    },
  });

  await prisma.employee.upsert({
    where: { userId: empUser.id },
    update: {},
    create: {
      employeeCode: 'EMP003',
      fullName: 'John Developer',
      email: 'john@acme.com',
      department: 'Engineering',
      designation: 'Software Developer',
      dateOfJoining: new Date('2024-03-01'),
      employmentType: 'FULL_TIME',
      salary: 80000,
      workLocation: 'Head Office',
      companyId: company.id,
      userId: empUser.id,
    },
  });

  // Initialize leave balances
  const year = new Date().getFullYear();
  const employees = await prisma.employee.findMany({ where: { companyId: company.id } });
  for (const emp of employees) {
    for (const leaveType of ['CASUAL', 'SICK', 'EARNED'] as const) {
      const totals = { CASUAL: 12, SICK: 10, EARNED: 15 };
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: { employeeId: emp.id, leaveType, year },
        },
        update: {},
        create: {
          employeeId: emp.id,
          leaveType,
          year,
          total: totals[leaveType],
          remaining: totals[leaveType],
        },
      });
    }
  }

  // Create a default public chat channel
  const existingChannel = await prisma.chatChannel.findFirst({
    where: { name: 'General', companyId: company.id },
  });
  if (!existingChannel) {
    await prisma.chatChannel.create({
      data: {
        name: 'General',
        description: 'General discussion for everyone',
        type: 'PUBLIC',
        companyId: company.id,
        createdById: adminUser.id,
        members: {
          create: [
            { userId: adminUser.id },
            { userId: hrUser.id },
            { userId: empUser.id },
          ],
        },
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log('  admin@acme.com / admin123');
  console.log('  hr@acme.com    / hr1234');
  console.log('  john@acme.com  / emp123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
