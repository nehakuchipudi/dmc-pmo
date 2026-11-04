import { projects } from "@/lib/data";
import { staticRecordIds } from "@/lib/seed";
import { ProjectDetail } from "./project-detail";

export function generateStaticParams() {
  return staticRecordIds(projects);
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
