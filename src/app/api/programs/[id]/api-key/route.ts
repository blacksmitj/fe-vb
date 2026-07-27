import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function generateApiKey(): string {
  return `vb_live_${crypto.randomBytes(24).toString('hex')}`;
}

// GET /api/programs/[id]/api-key
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;

    const apiKeyRecord = await db.programApiKey.findUnique({
      where: { programId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!apiKeyRecord) {
      return NextResponse.json({
        hasKey: false,
        apiKey: null,
      });
    }

    return NextResponse.json({
      hasKey: true,
      apiKey: {
        id: apiKeyRecord.id,
        key: apiKeyRecord.key,
        name: apiKeyRecord.name,
        status: apiKeyRecord.status,
        usageCount: apiKeyRecord.usageCount,
        lastUsedAt: apiKeyRecord.lastUsedAt,
        createdAt: apiKeyRecord.createdAt,
        logs: apiKeyRecord.logs,
      },
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data API key' },
      { status: 500 }
    );
  }
}

// POST /api/programs/[id]/api-key (Generate / Regenerate)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;

    const program = await db.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program tidak ditemukan' },
        { status: 404 }
      );
    }

    const newKey = generateApiKey();

    const apiKeyRecord = await db.programApiKey.upsert({
      where: { programId },
      create: {
        programId,
        key: newKey,
        status: 'ACTIVE',
      },
      update: {
        key: newKey,
        status: 'ACTIVE',
        usageCount: 0,
        lastUsedAt: null,
      },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'API Key berhasil dibuat',
      apiKey: {
        id: apiKeyRecord.id,
        key: apiKeyRecord.key,
        name: apiKeyRecord.name,
        status: apiKeyRecord.status,
        usageCount: apiKeyRecord.usageCount,
        lastUsedAt: apiKeyRecord.lastUsedAt,
        createdAt: apiKeyRecord.createdAt,
        logs: apiKeyRecord.logs,
      },
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json(
      { error: 'Gagal membuat API key' },
      { status: 500 }
    );
  }
}

// PATCH /api/programs/[id]/api-key (Toggle Pause/Active)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['ACTIVE', 'PAUSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid. Gunakan ACTIVE atau PAUSED' },
        { status: 400 }
      );
    }

    const apiKeyRecord = await db.programApiKey.update({
      where: { programId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: `Status API Key berhasil diubah menjadi ${status}`,
      apiKey: {
        id: apiKeyRecord.id,
        status: apiKeyRecord.status,
      },
    });
  } catch (error) {
    console.error('Error updating API key status:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui status API key' },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/[id]/api-key (Hapus / Revoke API Key)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;

    await db.programApiKey.delete({
      where: { programId },
    });

    return NextResponse.json({
      success: true,
      message: 'API Key berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus API key' },
      { status: 500 }
    );
  }
}
