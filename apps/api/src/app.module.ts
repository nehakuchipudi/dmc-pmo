import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { CompaniesModule } from "./companies/companies.module";

@Module({
  imports: [PrismaModule, CompaniesModule],
  controllers: [HealthController],
})
export class AppModule {}
