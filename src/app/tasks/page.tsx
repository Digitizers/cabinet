import { TasksBoardV2 } from "@/components/tasks/board-v2";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ cabinet?: string }>;

/**
 * /tasks — attention-first v2 board (the only board). The legacy flat
 * list and `?board=v1` escape hatch were removed after v2 parity.
 */
export default async function TasksIndexPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  return (
    <div className="h-screen">
      <TasksBoardV2 cabinetPath={params.cabinet ?? "."} standalone />
    </div>
  );
}
