import { z } from 'zod';
import {
  validateNik,
  validateWhatsapp,
  validateNib,
  validateKodePos,
  validateTanggalLahir,
  validateNpwp,
  validateStreetAddress,
  parseAndFormatAddress,
  sanitizeWhatsapp,
  sanitizeNpwp,
} from './id-validators';

/**
 * Skema Zod Kustom untuk Validasi Identitas & Data Indonesia
 */

/**
 * Skema Zod untuk NIK (16 digit angka dengan dekode tanggal lahir)
 */
export const nikSchema = z
  .string()
  .min(1, { message: 'NIK wajib diisi.' })
  .superRefine((val, ctx) => {
    const res = validateNik(val);
    if (!res.isValid && res.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error,
      });
    }
  });

/**
 * Skema Zod NIK dengan Verifikasi Tanggal Lahir (Cross-check DOB)
 */
export const createNikWithDobSchema = (dob?: Date | string) =>
  z.string().superRefine((val, ctx) => {
    const res = validateNik(val, { dob });
    if (!res.isValid && res.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error,
      });
    }
  });

/**
 * Skema Zod untuk Nomor WhatsApp (08..., +628..., 628... dengan sanitasi otomatis)
 */
export const whatsappSchema = z
  .string()
  .min(1, { message: 'Nomor WhatsApp wajib diisi.' })
  .superRefine((val, ctx) => {
    const res = validateWhatsapp(val);
    if (!res.isValid && res.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error,
      });
    }
  })
  .transform((val) => sanitizeWhatsapp(val, '62'));

/**
 * Skema Zod untuk NIB (13 digit angka standar OSS RBA)
 */
export const nibSchema = z
  .string()
  .min(1, { message: 'NIB wajib diisi.' })
  .superRefine((val, ctx) => {
    const res = validateNib(val);
    if (!res.isValid && res.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error,
      });
    }
  });

/**
 * Skema Zod untuk Kode Pos (5 digit angka Indonesia)
 */
export const kodePosSchema = z
  .string()
  .min(1, { message: 'Kode pos wajib diisi.' })
  .superRefine((val, ctx) => {
    const res = validateKodePos(val);
    if (!res.isValid && res.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error,
      });
    }
  });

/**
 * Skema Zod untuk Tanggal Lahir
 */
export const createTanggalLahirSchema = (options?: { minAge?: number }) =>
  z.union([z.date(), z.string()]).superRefine((val, ctx) => {
    const res = validateTanggalLahir(val, { minAge: options?.minAge });
    if (!res.isValid && res.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error,
      });
    }
  });

export const tanggalLahirSchema = createTanggalLahirSchema();

/**
 * Skema Zod untuk NPWP (Lama 15 digit / Baru 16 digit terintegrasi NIK)
 */
export const createNpwpSchema = (options?: { nik?: string; allowOldFormat?: boolean }) =>
  z
    .string()
    .min(1, { message: 'NPWP wajib diisi.' })
    .superRefine((val, ctx) => {
      const res = validateNpwp(val, options);
      if (!res.isValid && res.error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: res.error,
        });
      }
    })
    .transform((val) => sanitizeNpwp(val, 'clean'));

export const npwpSchema = createNpwpSchema();

/**
 * Skema Zod untuk Alamat Jalan (Format Title Case & Standar RT/RW Indonesia)
 */
export const streetAddressSchema = z
  .string()
  .min(1, { message: 'Alamat tidak boleh kosong.' })
  .superRefine((val, ctx) => {
    const res = validateStreetAddress(val);
    if (!res.isValid && res.errors.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.errors[0],
      });
    }
  })
  .transform((val) => parseAndFormatAddress(val).formattedAddress);

/**
 * Skema Komprehensif Formulir Identitas (Contoh penggunaan gabungan)
 */
export const identityFormSchema = z
  .object({
    nik: nikSchema,
    whatsapp: whatsappSchema,
    nib: nibSchema,
    kodePos: kodePosSchema,
    tanggalLahir: tanggalLahirSchema,
    npwp: npwpSchema.optional(),
    alamatJalan: streetAddressSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // Cross check NIK & Tanggal Lahir jika keduanya valid
    if (data.nik && data.tanggalLahir) {
      const res = validateNik(data.nik, { dob: data.tanggalLahir });
      if (!res.isValid && res.error) {
        ctx.addIssue({
          path: ['nik'],
          code: z.ZodIssueCode.custom,
          message: res.error,
        });
      }
    }

    // Cross check NPWP 16 digit dengan NIK jika disuplai
    if (data.nik && data.npwp) {
      const res = validateNpwp(data.npwp, { nik: data.nik });
      if (!res.isValid && res.error) {
        ctx.addIssue({
          path: ['npwp'],
          code: z.ZodIssueCode.custom,
          message: res.error,
        });
      }
    }
  });

export type IdentityFormData = z.infer<typeof identityFormSchema>;


