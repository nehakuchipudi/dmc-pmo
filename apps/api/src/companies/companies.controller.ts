import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
} from "@nestjs/common";
import {
  createCompanySchema,
  type Company,
  type CreateCompanyInput,
} from "@dmc/shared";
import { CompaniesService } from "./companies.service";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list(): Promise<Company[]> {
    return this.companies.list();
  }

  @Get(":id")
  getById(@Param("id") id: string): Promise<Company> {
    return this.companies.getById(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: unknown): Promise<Company> {
    const parsed = createCompanySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const input: CreateCompanyInput = parsed.data;
    return this.companies.create(input);
  }
}
