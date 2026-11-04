import { companies } from "@/lib/data";
import { staticRecordIds } from "@/lib/seed";
import { CompanyDetail } from "./company-detail";

export function generateStaticParams() {
  return staticRecordIds(companies);
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompanyDetail id={id} />;
}
