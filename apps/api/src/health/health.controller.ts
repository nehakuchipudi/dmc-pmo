import { Controller, Get } from "@nestjs/common";
import { HEALTH_OK, type HealthResponse } from "@dmc/shared";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthResponse & { database: string }> {
    let database = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }

    return {
      status: HEALTH_OK,
      service: "dmc-pmo-api",
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
