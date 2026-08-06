import { PrismaClient, CompanyStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Idempotent seed of demo companies matching the blueprint figures
 * (Cascade Ventures and friends) for visual QA. Uses upsert on a stable
 * synthetic id so re-running on every boot does not create duplicates.
 */
const companies = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Cascade Ventures",
    status: CompanyStatus.ACTIVE,
    accountManager: "Dana Whitfield",
    website: "https://cascade.example.com",
    notes: "Flagship retainer client. Quarterly delivery reviews.",
    openProjects: 4,
    openTickets: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Northwind Analytics",
    status: CompanyStatus.ACTIVE,
    accountManager: "Priya Nair",
    website: "https://northwind.example.com",
    notes: "Warehouse modernization program.",
    openProjects: 2,
    openTickets: 5,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Harbor Point Legal",
    status: CompanyStatus.PROSPECT,
    accountManager: "Marcus Lee",
    website: "https://harborpoint.example.com",
    notes: "Discovery call complete. Proposal in progress.",
    openProjects: 0,
    openTickets: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Solstice Health",
    status: CompanyStatus.ON_HOLD,
    accountManager: "Dana Whitfield",
    website: "https://solstice.example.com",
    notes: "Engagement paused pending budget approval.",
    openProjects: 1,
    openTickets: 1,
  },
];

async function main() {
  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: company,
      create: company,
    });
  }

  await prisma.contact.upsert({
    where: { id: "00000000-0000-4000-8000-0000000000a1" },
    update: {
      companyId: "00000000-0000-4000-8000-000000000001",
      firstName: "Dana",
      lastName: "Ruiz",
      email: "dana.ruiz@cascade.example.com",
      portalAccess: true,
    },
    create: {
      id: "00000000-0000-4000-8000-0000000000a1",
      companyId: "00000000-0000-4000-8000-000000000001",
      firstName: "Dana",
      lastName: "Ruiz",
      email: "dana.ruiz@cascade.example.com",
      portalAccess: true,
    },
  });

  const total = await prisma.company.count();
  console.log(`Seed complete. ${total} companies present.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
