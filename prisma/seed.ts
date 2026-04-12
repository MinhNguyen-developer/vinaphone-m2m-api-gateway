import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

// ─── Bootstrap client ───────────────────────────────────────────────────────

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

// ─── Seed data ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding database...\n');

  // ── 1. Clear existing data (order matters: FK children first) ──────────────
  await prisma.alertCheck.deleteMany();
  await prisma.alertConfig.deleteMany();
  await prisma.usageHistory.deleteMany();
  await prisma.simGroup.deleteMany();
  await prisma.sim.deleteMany();
  await prisma.masterSim.deleteMany();
  await prisma.group.deleteMany();
  console.log('  ✓ Cleared existing data');

  // ── 2. Master SIMs ──────────────────────────────────────────────────────────
  const m2m1 = await prisma.masterSim.create({
    data: {
      code: 'm2m1',
      phoneNumber: '0901900001',
      packageName: 'Gói M2M Lite 10GB',
      packageCapacityMB: 10240,
      usedMB: 1536,
      description: 'SIM chủ cho nhóm thiết bị IoT nhỏ',
    },
  });

  const m2m2 = await prisma.masterSim.create({
    data: {
      code: 'm2m2',
      phoneNumber: '0901900002',
      packageName: 'Gói M2M Standard 30GB',
      packageCapacityMB: 30720,
      usedMB: 8704,
      description: 'SIM chủ cho nhóm giám sát công nghiệp',
    },
  });

  const m2m3 = await prisma.masterSim.create({
    data: {
      code: 'm2m3',
      phoneNumber: '0901900003',
      packageName: 'Gói M2M Business 50GB',
      packageCapacityMB: 51200,
      usedMB: 3660,
      description: 'SIM chủ cho nhóm doanh nghiệp',
    },
  });

  console.log('  ✓ Created 3 MasterSims');

  // ── 3. Groups ───────────────────────────────────────────────────────────────
  const groupIoT = await prisma.group.create({
    data: {
      name: 'Thiết bị IoT',
      description: 'Các thiết bị cảm biến và theo dõi từ xa',
    },
  });

  const groupEnterprise = await prisma.group.create({
    data: {
      name: 'Khách hàng doanh nghiệp',
      description: 'SIM dùng cho máy POS, máy in hóa đơn, kiosk',
    },
  });

  console.log('  ✓ Created 2 Groups');

  // ── 4. SIMs ─────────────────────────────────────────────────────────────────

  // SIMs chưa hoạt động (Mới)
  const sim1 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000001',
      imsi: '452040901000001',
      contractCode: 'HDK-2026-0001',
      productCode: 'vina1200',
      masterSimCode: m2m1.code,
      systemStatus: 'ACTIVE',
      status: 'Mới',
      usedMB: 0,
      createdAt: new Date('2026-01-10'),
    },
  });

  const sim2 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000002',
      imsi: '452040901000002',
      contractCode: 'HDK-2026-0002',
      productCode: 'vina1200',
      masterSimCode: m2m1.code,
      systemStatus: 'PENDING',
      status: 'Mới',
      usedMB: 0,
      createdAt: new Date('2026-01-12'),
    },
  });

  // SIMs đang hoạt động (Đã hoạt động)
  const sim3 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000003',
      imsi: '452040901000003',
      contractCode: 'HDK-2026-0003',
      productCode: 'vina2400',
      masterSimCode: m2m2.code,
      systemStatus: 'ACTIVE',
      status: 'Đã hoạt động',
      usedMB: 512,
      firstUsedAt: new Date('2026-02-01T08:00:00Z'),
      createdAt: new Date('2026-01-15'),
    },
  });

  const sim4 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000004',
      imsi: '452040901000004',
      contractCode: 'HDK-2026-0004',
      productCode: 'vina2400',
      masterSimCode: m2m2.code,
      systemStatus: 'ACTIVE',
      status: 'Đã hoạt động',
      usedMB: 1100,
      firstUsedAt: new Date('2026-02-05T09:30:00Z'),
      createdAt: new Date('2026-01-15'),
      note: 'Thiết bị giám sát kho hàng',
    },
  });

  const sim5 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000005',
      imsi: '452040901000005',
      contractCode: 'HDK-2026-0005',
      productCode: 'vina2400',
      masterSimCode: m2m2.code,
      systemStatus: 'ACTIVE',
      status: 'Đã hoạt động',
      usedMB: 2200,
      firstUsedAt: new Date('2026-01-20T10:00:00Z'),
      createdAt: new Date('2026-01-10'),
    },
  });

  // SIMs đã xác nhận (Đã xác nhận)
  const sim6 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000006',
      imsi: '452040901000006',
      contractCode: 'HDK-2025-0001',
      productCode: 'vina1200',
      masterSimCode: m2m3.code,
      systemStatus: 'ACTIVE',
      status: 'Đã xác nhận',
      usedMB: 3200,
      firstUsedAt: new Date('2025-03-01T08:00:00Z'),
      confirmedAt: new Date('2025-03-02T10:00:00Z'),
      createdAt: new Date('2025-02-20'),
    },
  });

  const sim7 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000007',
      imsi: '452040901000007',
      contractCode: 'HDK-2025-0002',
      productCode: 'vina1200',
      masterSimCode: m2m3.code,
      systemStatus: 'ACTIVE',
      status: 'Đã xác nhận',
      usedMB: 460,
      firstUsedAt: new Date('2025-04-10T07:00:00Z'),
      confirmedAt: new Date('2025-04-11T09:15:00Z'),
      createdAt: new Date('2025-03-01'),
    },
  });

  const sim8 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000008',
      imsi: '452040901000008',
      contractCode: 'HDK-2025-0003',
      productCode: 'vina4800',
      masterSimCode: m2m3.code,
      systemStatus: 'SUSPENDED',
      status: 'Đã xác nhận',
      usedMB: 0,
      firstUsedAt: new Date('2025-06-01T08:00:00Z'),
      confirmedAt: new Date('2025-06-01T14:00:00Z'),
      createdAt: new Date('2025-05-15'),
      note: 'SIM tạm khóa do chưa thanh toán',
    },
  });

  const sim9 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000009',
      imsi: '452040901000009',
      contractCode: 'HDK-2026-0009',
      productCode: 'vina4800',
      masterSimCode: m2m3.code,
      systemStatus: 'ACTIVE',
      status: 'Đã hoạt động',
      usedMB: 4800,
      firstUsedAt: new Date('2026-01-05T08:00:00Z'),
      createdAt: new Date('2025-12-20'),
    },
  });

  const sim10 = await prisma.sim.create({
    data: {
      phoneNumber: '0901000010',
      imsi: '452040901000010',
      contractCode: 'HDK-2026-0010',
      productCode: 'vina2400',
      masterSimCode: m2m1.code,
      systemStatus: 'INACTIVE',
      status: 'Mới',
      usedMB: 0,
      createdAt: new Date('2026-02-01'),
    },
  });

  console.log('  ✓ Created 10 SIMs');

  // ── 5. SimGroup memberships ─────────────────────────────────────────────────
  await prisma.simGroup.createMany({
    data: [
      { simId: sim1.id, groupId: groupIoT.id },
      { simId: sim2.id, groupId: groupIoT.id },
      { simId: sim3.id, groupId: groupIoT.id },
      { simId: sim6.id, groupId: groupEnterprise.id },
      { simId: sim7.id, groupId: groupEnterprise.id },
      { simId: sim8.id, groupId: groupEnterprise.id },
      { simId: sim9.id, groupId: groupEnterprise.id },
    ],
  });

  console.log('  ✓ Created SimGroup memberships');

  // ── 6. Usage history ────────────────────────────────────────────────────────
  const usageRecords = [
    // sim3
    { simId: sim3.id, month: '2026-02', usedMB: 200 },
    { simId: sim3.id, month: '2026-03', usedMB: 312 },
    // sim4 – vượt ngưỡng 1GB
    { simId: sim4.id, month: '2026-02', usedMB: 400 },
    { simId: sim4.id, month: '2026-03', usedMB: 700 },
    // sim5 – vượt ngưỡng 2GB
    { simId: sim5.id, month: '2026-01', usedMB: 850 },
    { simId: sim5.id, month: '2026-02', usedMB: 1100 },
    { simId: sim5.id, month: '2026-03', usedMB: 250 },
    // sim6
    { simId: sim6.id, month: '2025-03', usedMB: 512 },
    { simId: sim6.id, month: '2025-04', usedMB: 1024 },
    { simId: sim6.id, month: '2025-05', usedMB: 800 },
    { simId: sim6.id, month: '2025-06', usedMB: 864 },
    // sim7
    { simId: sim7.id, month: '2025-04', usedMB: 48 },
    { simId: sim7.id, month: '2025-05', usedMB: 412 },
    // sim9 – vượt ngưỡng 4GB
    { simId: sim9.id, month: '2026-01', usedMB: 2000 },
    { simId: sim9.id, month: '2026-02', usedMB: 1800 },
    { simId: sim9.id, month: '2026-03', usedMB: 1000 },
  ];

  await prisma.usageHistory.createMany({ data: usageRecords });
  console.log(`  ✓ Created ${usageRecords.length} usage history records`);

  // ── 7. Alert configs ────────────────────────────────────────────────────────
  const alertLow = await prisma.alertConfig.create({
    data: {
      label: 'Cảnh báo 1GB',
      thresholdMB: 1024,
      productCode: 'vina2400',
      active: true,
    },
  });

  const alertHigh = await prisma.alertConfig.create({
    data: {
      label: 'Cảnh báo 2GB',
      thresholdMB: 2048,
      productCode: 'vina2400',
      active: true,
    },
  });

  const alertGroup = await prisma.alertConfig.create({
    data: {
      label: 'Cảnh báo nhóm doanh nghiệp 4GB',
      thresholdMB: 4096,
      groupId: groupEnterprise.id,
      active: true,
    },
  });

  const alertInactive = await prisma.alertConfig.create({
    data: {
      label: 'Cảnh báo vina4800 3GB (tắt)',
      thresholdMB: 3072,
      productCode: 'vina4800',
      active: false,
    },
  });

  console.log('  ✓ Created 4 AlertConfigs (3 active, 1 inactive)');

  // ── 8. Alert checks (một số đã được duyệt) ──────────────────────────────────
  await prisma.alertCheck.createMany({
    data: [
      // sim4 vượt alertLow (1GB) – đã kiểm tra
      {
        simId: sim4.id,
        alertId: alertLow.id,
        checked: true,
        checkedAt: new Date('2026-03-15T09:00:00Z'),
        checkedBy: 'admin',
      },
      // sim5 vượt alertLow (1GB) – chưa kiểm tra
      {
        simId: sim5.id,
        alertId: alertLow.id,
        checked: false,
      },
      // sim5 vượt alertHigh (2GB) – chưa kiểm tra
      {
        simId: sim5.id,
        alertId: alertHigh.id,
        checked: false,
      },
    ],
  });

  console.log('  ✓ Created AlertChecks');

  // ── Summary ─────────────────────────────────────────────────────────────────
  const counts = await prisma.$transaction([
    prisma.masterSim.count(),
    prisma.group.count(),
    prisma.sim.count(),
    prisma.usageHistory.count(),
    prisma.alertConfig.count(),
    prisma.alertCheck.count(),
  ]);

  console.log('\n✅  Seed complete!\n');
  console.log('  master_sims   :', counts[0]);
  console.log('  groups        :', counts[1]);
  console.log('  sims          :', counts[2]);
  console.log('  usage_history :', counts[3]);
  console.log('  alert_configs :', counts[4]);
  console.log('  alert_checks  :', counts[5]);
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
