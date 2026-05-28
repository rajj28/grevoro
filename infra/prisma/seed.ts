import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function computeHash(prevHash: string, payload: object): string {
  return sha256(prevHash + JSON.stringify(payload));
}

function buildMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return sha256('EMPTY');
  let layer = [...hashes];
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] || left;
      next.push(sha256(left + right));
    }
    layer = next;
  }
  return layer[0];
}

function grvId(suffix: string): string {
  return `GRV-${suffix}`;
}

const HERO_SHORTCODE = 'K7M2QX';

const DELHI_ZONES = [
  { name: 'Dharavi', lat: 28.6562, lng: 77.2289 },
  { name: 'Bhalswa', lat: 28.7378, lng: 77.1704 },
  { name: 'Okhla', lat: 28.5355, lng: 77.2692 },
  { name: 'Seemapuri', lat: 28.6787, lng: 77.3117 },
  { name: 'Ghazipur', lat: 28.6271, lng: 77.3246 },
  { name: 'Najafgarh', lat: 28.6096, lng: 76.9797 },
];

const MATERIAL_TYPES = [
  'PET_PLASTIC', 'HDPE_PLASTIC', 'MIXED_PLASTIC',
  'PAPER', 'CARDBOARD', 'METAL_FERROUS',
  'METAL_NON_FERROUS', 'GLASS', 'ORGANIC', 'MIXED',
] as const;

const QUALITY_GRADES = ['A', 'B', 'C'] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(base: number, delta: number): number {
  return base + (Math.random() - 0.5) * delta * 2;
}

async function main() {
  console.log('🌱 Seeding GREVORO Delhi demo dataset...');
  await prisma.$transaction([
    prisma.impactLedger.deleteMany(),
    prisma.custodyEvent.deleteMany(),
    prisma.wasteBatch.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.merkleAnchor.deleteMany(),
    prisma.demandPost.deleteMany(),
    prisma.route.deleteMany(),
    prisma.priceQuote.deleteMany(),
    prisma.job.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('  ✓ Cleared existing data');

  const pinHash = await bcrypt.hash('1234', 10);

  const households = await Promise.all(
    Array.from({ length: 20 }, (_, i) => {
      const zone = DELHI_ZONES[i % DELHI_ZONES.length];
      return prisma.user.create({
        data: {
          phone: `9810000${String(i).padStart(3, '0')}`,
          name: `Household ${i + 1} - ${zone.name}`,
          pinHash,
          role: 'HOUSEHOLD',
          langPref: i % 3 === 0 ? 'hi' : 'en',
          address: `${i + 1} Gali, ${zone.name}, Delhi`,
          gpsLat: jitter(zone.lat, 0.01),
          gpsLng: jitter(zone.lng, 0.01),
        },
      });
    })
  );

  const ragpickers = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const zone = DELHI_ZONES[i % DELHI_ZONES.length];
      return prisma.user.create({
        data: {
          phone: `9811000${String(i).padStart(3, '0')}`,
          name: `Ragpicker ${i + 1} - ${zone.name}`,
          pinHash,
          role: 'RAGPICKER',
          langPref: 'hi',
          address: `Near ${zone.name} Colony, Delhi`,
          gpsLat: jitter(zone.lat, 0.005),
          gpsLng: jitter(zone.lng, 0.005),
          reputationScore: 4.0 + Math.random(),
        },
      });
    })
  );

  const kabadiwalas = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const zone = DELHI_ZONES[i];
      return prisma.user.create({
        data: {
          phone: `9812000${String(i).padStart(3, '0')}`,
          name: `Kabadiwala ${i + 1} - ${zone.name}`,
          pinHash,
          role: 'KABADIWALA',
          langPref: 'hi',
          address: `${zone.name} Scrap Yard, Delhi`,
          gpsLat: zone.lat,
          gpsLng: zone.lng,
          walletBalance: 5000 + Math.random() * 10000,
          reputationScore: 4.2 + Math.random() * 0.7,
        },
      });
    })
  );

  const recyclers = await Promise.all(
    Array.from({ length: 4 }, (_, i) => {
      return prisma.user.create({
        data: {
          phone: `9813000${String(i).padStart(3, '0')}`,
          name: `EcoRecycle Delhi ${i + 1}`,
          pinHash,
          role: 'RECYCLER',
          langPref: 'en',
          address: `Industrial Area ${i + 1}, Okhla, Delhi`,
          gpsLat: jitter(28.535, 0.02),
          gpsLng: jitter(77.269, 0.02),
          walletBalance: 50000 + Math.random() * 100000,
          reputationScore: 4.8,
        },
      });
    })
  );

  const admin = await prisma.user.create({
    data: {
      phone: '9999999999',
      name: 'GREVORO Admin',
      pinHash,
      role: 'ADMIN',
      langPref: 'en',
      address: 'GREVORO HQ, New Delhi',
      gpsLat: 28.6139,
      gpsLng: 77.209,
    },
  });

  console.log(`  ✓ Created ${households.length} households, ${ragpickers.length} ragpickers, ${kabadiwalas.length} kabadiwalas, ${recyclers.length} recyclers, 1 admin`);

  const priceQuotes = await Promise.all(
    MATERIAL_TYPES.map((mat) => {
      const prices: Record<string, number> = {
        PET_PLASTIC: 12, HDPE_PLASTIC: 10, MIXED_PLASTIC: 6,
        PAPER: 8, CARDBOARD: 5, METAL_FERROUS: 22,
        METAL_NON_FERROUS: 180, GLASS: 2, ORGANIC: 1, MIXED: 4,
      };
      return prisma.priceQuote.create({
        data: {
          materialType: mat as any,
          ratePerKg: prices[mat] * (0.9 + Math.random() * 0.2),
          validFrom: new Date('2025-01-01'),
          validTo: new Date('2026-12-31'),
        },
      });
    })
  );
  console.log(`  ✓ Created ${priceQuotes.length} price quotes`);

  const allBatches: any[] = [];
  const allEvents: any[] = [];
  const TOTAL_BATCHES = 60;

  for (let b = 0; b < TOTAL_BATCHES; b++) {
    const isHero = b === 0;
    const shortcode = isHero ? HERO_SHORTCODE : crypto.randomBytes(3).toString('hex').toUpperCase();
    const household = households[b % households.length];
    const ragpicker = ragpickers[b % ragpickers.length];
    const kabadiwala = kabadiwalas[b % kabadiwalas.length];
    const recycler = recyclers[b % recyclers.length];
    const zone = DELHI_ZONES[b % DELHI_ZONES.length];
    const materialType = isHero ? 'PET_PLASTIC' : pick(MATERIAL_TYPES);
    const weightKg = 5 + Math.random() * 45;
    const createdDaysAgo = isHero ? 30 : Math.floor(Math.random() * 60) + 1;
    const createdAt = new Date(Date.now() - createdDaysAgo * 86400_000);

    const qrPayload = `http://localhost:3000/trust/${grvId(shortcode)}`;

    const batch = await prisma.wasteBatch.create({
      data: {
        shortcode: grvId(shortcode),
        qrPayload,
        materialType: materialType as any,
        status: 'RECYCLED',
        weightKg: parseFloat(weightKg.toFixed(2)),
        qualityGrade: pick(QUALITY_GRADES) as any,
        contaminationPct: parseFloat((Math.random() * 12).toFixed(2)),
        description: isHero
          ? 'Hero demo batch — PET bottles collected from Dharavi households'
          : `${materialType} waste from ${zone.name}`,
        originUserId: household.id,
        currentCustodianId: recycler.id,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 7 * 86400_000),
      },
    });

    allBatches.push(batch);

    let prevHash = sha256(`GENESIS:${batch.id}`);
    const eventHashes: string[] = [];

    const steps = [
      {
        fromUserId: household.id,
        toUserId: ragpicker.id,
        eventType: 'CREATED',
        gpsLat: jitter(zone.lat, 0.003),
        gpsLng: jitter(zone.lng, 0.003),
        weightKg,
        daysOffset: 0,
      },
      {
        fromUserId: ragpicker.id,
        toUserId: kabadiwala.id,
        eventType: 'HANDOFF',
        gpsLat: jitter(zone.lat, 0.003),
        gpsLng: jitter(zone.lng, 0.003),
        weightKg: weightKg * 0.98,
        daysOffset: 1,
      },
      {
        fromUserId: kabadiwala.id,
        toUserId: kabadiwala.id,
        eventType: 'QUALITY_GRADED',
        gpsLat: zone.lat,
        gpsLng: zone.lng,
        weightKg: weightKg * 0.97,
        daysOffset: 2,
      },
      {
        fromUserId: kabadiwala.id,
        toUserId: recycler.id,
        eventType: 'DISPATCHED',
        gpsLat: jitter(zone.lat, 0.005),
        gpsLng: jitter(zone.lng, 0.005),
        weightKg: weightKg * 0.97,
        daysOffset: 3,
      },
      {
        fromUserId: recycler.id,
        toUserId: recycler.id,
        eventType: 'RECEIVED',
        gpsLat: jitter(28.535, 0.01),
        gpsLng: jitter(77.269, 0.01),
        weightKg: weightKg * 0.95,
        daysOffset: 4,
      },
      {
        fromUserId: recycler.id,
        toUserId: recycler.id,
        eventType: 'RECYCLED',
        gpsLat: jitter(28.535, 0.01),
        gpsLng: jitter(77.269, 0.01),
        weightKg: weightKg * 0.93,
        daysOffset: 7,
      },
    ];

    for (const step of steps) {
      const payload = {
        batchId: batch.id,
        eventType: step.eventType,
        fromUserId: step.fromUserId,
        toUserId: step.toUserId,
        gpsLat: step.gpsLat,
        gpsLng: step.gpsLng,
        weightKg: step.weightKg,
      };
      const hash = computeHash(prevHash, payload);
      eventHashes.push(hash);

      await prisma.custodyEvent.create({
        data: {
          batchId: batch.id,
          fromUserId: step.fromUserId,
          toUserId: step.toUserId === step.fromUserId ? undefined : step.toUserId,
          eventType: step.eventType as any,
          gpsLat: parseFloat(step.gpsLat.toFixed(6)),
          gpsLng: parseFloat(step.gpsLng.toFixed(6)),
          weightKg: parseFloat(step.weightKg.toFixed(2)),
          qualityGrade: step.eventType === 'QUALITY_GRADED' ? pick(QUALITY_GRADES) as any : undefined,
          prevHash,
          hash,
          createdAt: new Date(createdAt.getTime() + step.daysOffset * 86400_000),
        },
      });

      prevHash = hash;
      allEvents.push({ hash, batchId: batch.id });
    }
  }

  console.log(`  ✓ Created ${allBatches.length} batches with ${allEvents.length} custody events`);

  const eventHashes = allEvents.map((e: any) => e.hash);
  const chunkSize = 50;
  for (let i = 0; i < eventHashes.length; i += chunkSize) {
    const chunk = eventHashes.slice(i, i + chunkSize);
    const rootHash = buildMerkleRoot(chunk);

    const firstEvent = await prisma.custodyEvent.findFirst({
      where: { hash: { in: chunk } },
      orderBy: { createdAt: 'asc' },
    });
    const lastEvent = await prisma.custodyEvent.findFirst({
      where: { hash: { in: chunk } },
      orderBy: { createdAt: 'desc' },
    });

    const anchor = await prisma.merkleAnchor.create({
      data: {
        rootHash,
        leafCount: chunk.length,
        periodStart: firstEvent?.createdAt || new Date(),
        periodEnd: lastEvent?.createdAt || new Date(),
        anchoredAt: new Date(Date.now() - Math.random() * 86400_000 * 7),
      },
    });

    await prisma.custodyEvent.updateMany({
      where: { hash: { in: chunk } },
      data: { anchorId: anchor.id },
    });
  }

  console.log(`  ✓ Created Merkle anchors (${Math.ceil(eventHashes.length / chunkSize)} anchor roots)`);

  const CO2_FACTORS: Record<string, number> = {
    PET_PLASTIC: 2.53, HDPE_PLASTIC: 1.93, MIXED_PLASTIC: 1.8,
    PAPER: 1.06, CARDBOARD: 0.9, METAL_FERROUS: 1.46,
    METAL_NON_FERROUS: 9.2, GLASS: 0.31, E_WASTE: 0.0, ORGANIC: 0.58, MIXED: 1.2,
  };

  const BASE_PRICE: Record<string, number> = {
    PET_PLASTIC: 12, HDPE_PLASTIC: 10, MIXED_PLASTIC: 6,
    PAPER: 8, CARDBOARD: 5, METAL_FERROUS: 22,
    METAL_NON_FERROUS: 180, GLASS: 2, E_WASTE: 50, ORGANIC: 1, MIXED: 4,
  };

  for (const batch of allBatches) {
    const factor = CO2_FACTORS[batch.materialType] || 1.0;
    const pricePerKg = BASE_PRICE[batch.materialType] || 5;
    const workerPayout = batch.weightKg * pricePerKg * 0.65;

    await prisma.impactLedger.create({
      data: {
        batchId: batch.id,
        kgDiverted: batch.weightKg,
        co2eSavedKg: parseFloat((batch.weightKg * factor).toFixed(3)),
        workerPayoutInr: parseFloat(workerPayout.toFixed(2)),
        materialType: batch.materialType,
        recordedAt: batch.updatedAt,
      },
    });
  }

  console.log(`  ✓ Created ${allBatches.length} impact ledger records`);

  for (const recycler of recyclers) {
    for (const mat of ['PET_PLASTIC', 'PAPER', 'METAL_FERROUS'] as const) {
      await prisma.demandPost.create({
        data: {
          recyclerId: recycler.id,
          materialType: mat as any,
          minQtyKg: 100 + Math.random() * 400,
          maxPricePerKg: (BASE_PRICE[mat] || 10) * 1.15,
          locationLabel: 'Okhla Industrial Area, Delhi',
          locationGeohash: 'ttnjg',
          deadline: new Date(Date.now() + 30 * 86400_000),
          qualityRequired: 'B',
        },
      });
    }
  }

  console.log(`  ✓ Created demand posts`);

  const heroBatch = allBatches[0];
  console.log(`\n🦸 Hero batch: GRV-${HERO_SHORTCODE} (id: ${heroBatch.id})`);
  console.log(`   Trust URL: http://localhost:3000/trust/GRV-${HERO_SHORTCODE}`);

  const totals = allBatches.reduce(
    (acc, b) => {
      acc.kg += b.weightKg;
      acc.co2 += b.weightKg * (CO2_FACTORS[b.materialType] || 1);
      return acc;
    },
    { kg: 0, co2: 0 }
  );

  console.log(`\n📊 Seed summary:`);
  console.log(`   Total batches  : ${allBatches.length}`);
  console.log(`   Total events   : ${allEvents.length}`);
  console.log(`   Total kg       : ${totals.kg.toFixed(1)}`);
  console.log(`   CO2e saved     : ${totals.co2.toFixed(1)} kg`);
  console.log(`   Users          : ${households.length + ragpickers.length + kabadiwalas.length + recyclers.length + 1}`);
  console.log('\n✅ Seed complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
