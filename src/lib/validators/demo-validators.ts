import {
  validateNik,
  validateWhatsapp,
  validateNib,
  validateKodePos,
  validateTanggalLahir,
  validateNpwp,
  sanitizeWhatsapp,
  sanitizeNpwp,
} from './id-validators';
import { identityFormSchema } from './zod-schemas';

function runDemo() {
  console.log('=== TEST DEMO VALIDATOR IDENTITAS INDONESIA ===\n');

  // 1. TEST NIK
  console.log('--- 1. TEST NIK ---');
  const testNiks = [
    { nik: '3171011508950001', desc: 'Valid NIK Laki-laki (15 Ags 1995)' },
    { nik: '3171015508950001', desc: 'Valid NIK Perempuan (15 Ags 1995 -> 15+40=55)' },
    { nik: '3171013208950001', desc: 'Invalid Tanggal Lahir (32 Ags 1995)' },
    { nik: '3171011513950001', desc: 'Invalid Bulan Lahir (Bulan 13)' },
    { nik: '12345', desc: 'Invalid Panjang (< 16 digit)' },
    { nik: '0071011508950001', desc: 'Invalid Kode Wilayah (Prov 00)' },
  ];

  testNiks.forEach(({ nik, desc }) => {
    const res = validateNik(nik);
    console.log(`[${res.isValid ? 'PASS' : 'FAIL'}] ${desc} (${nik}):`);
    if (res.isValid) {
      console.log('   Details:', res.details);
    } else {
      console.log('   Error:', res.error);
    }
  });

  // Test NIK dengan Cross Check DOB
  console.log('\n--- Test NIK Mismatch Tanggal Lahir ---');
  const crossCheckRes = validateNik('3171011508950001', { dob: '1995-08-20' });
  console.log(`[${crossCheckRes.isValid ? 'PASS' : 'FAIL'}] NIK vs DOB 20 Ags 1995:`, crossCheckRes.error);

  // 2. TEST WHATSAPP
  console.log('\n--- 2. TEST WHATSAPP ---');
  const testPhones = ['081234567890', '+62 812-3456-7890', '6281234567890', '021123456', '123'];
  testPhones.forEach((phone) => {
    const res = validateWhatsapp(phone);
    console.log(`[${res.isValid ? 'PASS' : 'FAIL'}] "${phone}":`);
    if (res.isValid) {
      console.log(`   Normalized: ${res.value} | Local: ${sanitizeWhatsapp(phone, '0')}`);
    } else {
      console.log('   Error:', res.error);
    }
  });

  // 3. TEST NIB
  console.log('\n--- 3. TEST NIB ---');
  const testNibs = ['1234567890123', '12345', '123456789012345'];
  testNibs.forEach((nib) => {
    const res = validateNib(nib);
    console.log(`[${res.isValid ? 'PASS' : 'FAIL'}] "${nib}":`, res.isValid ? 'Valid' : res.error);
  });

  // 4. TEST KODE POS
  console.log('\n--- 4. TEST KODE POS ---');
  const testKodePos = ['40123', '01234', '1234', '123456'];
  testKodePos.forEach((kp) => {
    const res = validateKodePos(kp);
    console.log(`[${res.isValid ? 'PASS' : 'FAIL'}] "${kp}":`, res.isValid ? 'Valid' : res.error);
  });

  // 5. TEST TANGGAL LAHIR
  console.log('\n--- 5. TEST TANGGAL LAHIR ---');
  const testDobs = [
    { input: '1998-05-20', desc: 'Valid Past Date' },
    { input: '2099-01-01', desc: 'Future Date' },
    { input: 'invalid-date', desc: 'Invalid Format' },
  ];
  testDobs.forEach(({ input, desc }) => {
    const res = validateTanggalLahir(input);
    console.log(`[${res.isValid ? 'PASS' : 'FAIL'}] ${desc} ("${input}"):`, res.isValid ? res.value : res.error);
  });

  // 6. TEST NPWP (LAMA & BARU/NIK)
  console.log('\n--- 6. TEST NPWP (LAMA & BARU TERKONEKSI NIK) ---');
  const testNpwps = [
    { npwp: '01.385.452.4-013.000', desc: 'Valid NPWP 15 Digit (Formatted)' },
    { npwp: '013854524013000', desc: 'Valid NPWP 15 Digit (Clean)' },
    { npwp: '013854529013000', desc: 'Invalid Checksum NPWP 15 Digit' },
    { npwp: '3171011508950001', desc: 'Valid NPWP 16 Digit Baru (Sama dengan NIK 3171011508950001)' },
    { npwp: '1234567890', desc: 'Invalid Length NPWP' },
  ];

  testNpwps.forEach(({ npwp, desc }) => {
    const res = validateNpwp(npwp);
    console.log(`[${res.isValid ? 'PASS' : 'FAIL'}] ${desc} ("${npwp}"):`);
    if (res.isValid) {
      console.log(`   Formatted: ${sanitizeNpwp(npwp, 'pretty')} | Details:`, res.details);
    } else {
      console.log('   Error:', res.error);
    }
  });

  // Test NPWP 16 Digit Mismatch dengan NIK input
  console.log('\n--- Test NPWP 16 Digit vs NIK Mismatch ---');
  const npwpNikMismatchRes = validateNpwp('3171011508950001', { nik: '3171011508950002' });
  console.log(`[${npwpNikMismatchRes.isValid ? 'PASS' : 'FAIL'}] NPWP 16 digit vs NIK beda:`, npwpNikMismatchRes.error);

  // 7. TEST ZOD SCHEMA
  console.log('\n--- 7. TEST ZOD FORM SCHEMA ---');
  const sampleValidData = {
    nik: '3171011508950001',
    whatsapp: '081234567890',
    nib: '1234567890123',
    kodePos: '40123',
    tanggalLahir: '1995-08-15',
    npwp: '3171011508950001', // NPWP 16 digit cocok dengan NIK
  };

  const zodRes = identityFormSchema.safeParse(sampleValidData);
  console.log(`Zod Form Parse (Valid Payload):`, zodRes.success ? 'SUCCESS ✅' : zodRes.error.format());

  const sampleInvalidData = {
    nik: '3171011508950001',
    whatsapp: '1234',
    nib: '999',
    kodePos: '00000',
    tanggalLahir: '2030-01-01',
    npwp: '3171011508950009', // NPWP 16 digit tidak cocok NIK
  };
  const zodInvalidRes = identityFormSchema.safeParse(sampleInvalidData);
  if (!zodInvalidRes.success) {
    console.log('\nZod Form Parse (Invalid Payload) Error Issues:');
    console.log(JSON.stringify(zodInvalidRes.error.flatten().fieldErrors, null, 2));
  }
}

runDemo();

