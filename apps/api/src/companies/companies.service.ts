import { Injectable, NotFoundException } from "@nestjs/common";
import { CompanyStatus, type Company, type CreateCompanyInput } from "@dmc/shared";
import { PrismaService } from "../prisma/prisma.service";

type CompanyRow = {
  id: string;
  name: string;
  status: string;
  accountManager: string | null;
  website: string | null;
  notes: string | null;
  openProjects: number;
  openTickets: number;
  createdAt: Date;
  updatedAt: Date;
};

function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    status: row.status as CompanyStatus,
    accountManager: row.accountManager,
    website: row.website,
    notes: row.notes,
    openProjects: row.openProjects,
    openTickets: row.openTickets,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Company[]> {
    const rows = await this.prisma.company.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
    return rows.map(toCompany);
  }

  async getById(id: string): Promise<Company> {
    const row = await this.prisma.company.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Company ${id} not found`);
    }
    return toCompany(row);
  }

  async create(input: CreateCompanyInput): Promise<Company> {
    const row = await this.prisma.company.create({
      data: {
        name: input.name,
        status: input.status,
        accountManager: input.accountManager ?? null,
        website: input.website ?? null,
        notes: input.notes ?? null,
      },
    });
    return toCompany(row);
  }
}
