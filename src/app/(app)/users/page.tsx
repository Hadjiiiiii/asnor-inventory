import { auth } from "@/lib/auth";
import { getUsers } from "./actions";
import { UserList } from "./user-list";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1") || 1);

  const [{ users, total, pages, currentPage }, session] = await Promise.all([getUsers({ page }), auth()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage team accounts and roles
        </p>
      </div>
      <UserList
        users={users}
        total={total}
        pages={pages}
        currentPage={currentPage}
        currentUserId={session?.user.id ?? ""}
      />
    </div>
  );
}
