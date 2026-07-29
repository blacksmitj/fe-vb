import { Field, ValidationRule } from "@/components/profile-builder/types";
import {
  validateNik,
  validateWhatsapp,
  validateNib,
  validateKodePos,
  validateTanggalLahir,
  validateNpwp,
  validateStreetAddress,
} from "./id-validators";

export interface FieldValidationStatus {
  isValid: boolean;
  error?: string | null;
  warning?: string | null;
}

/**
 * Memvalidasi nilai input pada Profile Builder Field berdasarkan validationRule atau field.type.
 */
export function validateProfileFieldValue(
  field: Field,
  value: string | undefined | null,
  allFormValues?: Record<string, any>,
  allFields?: Field[]
): FieldValidationStatus {
  const val = value !== undefined && value !== null ? String(value).trim() : "";

  // 1. Cek Required
  if (field.isRequired && !val) {
    return {
      isValid: false,
      error: `${field.label} wajib diisi.`,
    };
  }

  if (!val) {
    return { isValid: true, error: null, warning: null };
  }

  // 1.5 Cek Validasi Dropdown / Select (Nilai wajib ada dalam pilihan options)
  if (((field.type as string) === "dropdown" || (field.type as string) === "select") && field.options && field.options.length > 0) {
    const isMatch = field.options.some((opt) => opt.toLowerCase() === val.toLowerCase());
    if (!isMatch) {
      return {
        isValid: false,
        error: `${field.label} tidak valid / tidak ada dalam pilihan.`,
      };
    }
  }

  // 2. Tentukan Rule Validasi (Murni dari pilihan eksplisit user atau tipe field bawaan)
  const effectiveRule: ValidationRule =
    field.validationRule ||
    (field.type === "date"
      ? "tanggal-lahir"
      : field.type === "street-address"
      ? "street-address"
      : "none");

  switch (effectiveRule) {
    case "nik": {
      // Validasi struktur NIK saja (16 digit, kode wilayah, tanggal terenkode)
      const res = validateNik(val);
      return {
        isValid: res.isValid,
        error: res.error,
        warning: res.warning,
      };
    }

    case "whatsapp": {
      const res = validateWhatsapp(val);
      return {
        isValid: res.isValid,
        error: res.error,
        warning: res.warning,
      };
    }

    case "npwp": {
      // Cross check NPWP 16 digit dengan NIK jika tersedia
      let nikVal: string | undefined = undefined;
      if (allFields && allFields.length > 0) {
        const nikField = allFields.find(
          (f) => f.validationRule === "nik" || (f.type as string) === "nik"
        );
        if (nikField && allFormValues) {
          const rawVal = allFormValues[nikField.label] || allFormValues[nikField.id];
          if (rawVal && typeof rawVal === "string") nikVal = rawVal.trim();
        }
      }
      if (!nikVal && allFormValues) {
        nikVal = allFormValues["nik"] || allFormValues["NIK"] || allFormValues["no_ktp"];
      }

      const res = validateNpwp(val, { nik: nikVal });
      return {
        isValid: res.isValid,
        error: res.error,
        warning: res.warning,
      };
    }

    case "nib": {
      const res = validateNib(val);
      return {
        isValid: res.isValid,
        error: res.error,
        warning: res.warning,
      };
    }

    case "kode-pos": {
      const res = validateKodePos(val);
      return {
        isValid: res.isValid,
        error: res.error,
        warning: res.warning,
      };
    }

    case "tanggal-lahir": {
      const res = validateTanggalLahir(val);
      let err = res.error;
      let warning = res.warning;

      // Cross-check dengan NIK: jika Tanggal Lahir diisi tapi tidak cocok dengan NIK, tampilkan warning/atensi (bukan error pembatas submit)
      if (!err && val && allFormValues) {
        let nikVal: string | undefined = undefined;

        // 1. Cari NIK dari daftar allFields yang secara eksplisit diset validationRule === 'nik'
        if (allFields && allFields.length > 0) {
          const nikField = allFields.find(
            (f) => f.validationRule === "nik" || (f.type as string) === "nik"
          );
          if (nikField) {
            const rawVal = allFormValues[nikField.label] || allFormValues[nikField.id];
            if (rawVal && typeof rawVal === "string" && rawVal.trim()) {
              nikVal = rawVal.trim();
            }
          }
        }

        // 2. Fallback jika allFields tidak dipassing: cari key NIK murni (bukan media/foto/upload)
        if (!nikVal) {
          for (const key of Object.keys(allFormValues)) {
            const isMediaKey = /foto|file|upload|gambar|image|pdf|ktp_file/i.test(key);
            if (!isMediaKey && /\bnik\b/i.test(key)) {
              const possibleVal = allFormValues[key];
              if (possibleVal && typeof possibleVal === "string" && possibleVal.trim()) {
                nikVal = possibleVal.trim();
                break;
              }
            }
          }
        }

        if (nikVal) {
          const cleanNik = nikVal.replace(/\D/g, "");
          if (cleanNik.length === 16) {
            const nikRes = validateNik(cleanNik, { dob: val });
            if (!nikRes.isValid && nikRes.error) {
              warning = nikRes.error;
            }
          }
        }
      }

      return {
        isValid: !err,
        error: err,
        warning: warning,
      };
    }

    case "street-address": {
      const res = validateStreetAddress(val);
      return {
        isValid: res.isValid,
        error: res.errors.length > 0 ? res.errors[0] : null,
      };
    }

    default:
      return { isValid: true, error: null, warning: null };
  }
}

