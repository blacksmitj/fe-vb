import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  return 'Unknown IP';
}

export async function GET(request: Request) {
  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown Client';

  try {
    // 1. Extract API Key from headers (x-api-key or Authorization Bearer)
    const apiKey =
      request.headers.get('x-api-key') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'API Key tidak ditemukan. Sertakan header x-api-key atau Authorization Bearer.',
        },
        { status: 401 }
      );
    }

    // 2. Validate API Key
    const keyRecord = await db.programApiKey.findUnique({
      where: { key: apiKey },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            uniqueKeyColumn: true,
            headers: true,
            status: true,
          },
        },
      },
    });

    if (!keyRecord) {
      return NextResponse.json(
        {
          success: false,
          message: 'API Key tidak valid.',
        },
        { status: 401 }
      );
    }

    if (keyRecord.status === 'PAUSED') {
      // Log paused attempt
      await db.programApiKeyLog.create({
        data: {
          apiKeyId: keyRecord.id,
          ipAddress,
          userAgent,
          status: 403,
          message: 'Percobaan akses saat API Key di-pause',
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Integrasi API untuk program ini sedang di-pause.',
        },
        { status: 403 }
      );
    }

    // 3. Update lastUsedAt, increment usageCount, and log successful request
    await db.programApiKey.update({
      where: { id: keyRecord.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });

    await db.programApiKeyLog.create({
      data: {
        apiKeyId: keyRecord.id,
        ipAddress,
        userAgent,
        status: 200,
        message: 'Akses sukses',
      },
    });

    // 4. Fetch all participants for the program
    const participants = await db.participant.findMany({
      where: { programId: keyRecord.programId },
      orderBy: { rowIndex: 'asc' },
      select: {
        id: true,
        rowIndex: true,
        uniqueKey: true,
        data: true,
        evalStatus: true,
        evalDescription: true,
        evalByUserName: true,
        evalAt: true,
        importedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      program: {
        id: keyRecord.program.id,
        name: keyRecord.program.name,
        uniqueKeyColumn: keyRecord.program.uniqueKeyColumn,
        headers: keyRecord.program.headers,
      },
      total: participants.length,
      data: participants,
    });
  } catch (error) {
    console.error('Error exporting participants via API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
