import prisma from '../config/database';
import { uploadBlob, deleteBlob } from '../config/azure-storage';
import { env } from '../config/env';
import { ValidationError, NotFoundError } from '../utils/app-error';
import { v4 as uuid } from 'uuid';

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export class CompanyLogoService {
  async upload(companyId: string, file: Express.Multer.File) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new ValidationError('Only PNG, JPG, and SVG files are allowed');
    }
    if (file.size > MAX_LOGO_SIZE) {
      throw new ValidationError('File size exceeds 5MB limit');
    }

    // Delete existing logo if present
    const existing = await prisma.companyLogo.findUnique({ where: { companyId } });
    if (existing) {
      await deleteBlob(env.azure.containerLogos, existing.blobName);
      await prisma.companyLogo.delete({ where: { id: existing.id } });
    }

    const ext = file.originalname.split('.').pop();
    const blobName = `${companyId}/${uuid()}.${ext}`;
    const url = await uploadBlob(env.azure.containerLogos, blobName, file.buffer, file.mimetype);

    return prisma.companyLogo.create({
      data: {
        companyId,
        url,
        blobName,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });
  }

  async get(companyId: string) {
    return prisma.companyLogo.findUnique({ where: { companyId } });
  }

  async delete(companyId: string) {
    const logo = await prisma.companyLogo.findUnique({ where: { companyId } });
    if (!logo) throw new NotFoundError('Company logo');

    await deleteBlob(env.azure.containerLogos, logo.blobName);
    await prisma.companyLogo.delete({ where: { id: logo.id } });
  }
}
