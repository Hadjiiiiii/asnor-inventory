import { getTransactions } from "./actions";
import { TransactionList } from "./transaction-list";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    search?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  const { transactions, total, pages, currentPage } = await getTransactions({
    search: params.search,
    type: params.type,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          Track purchases and sales
        </p>
      </div>
      <TransactionList
        transactions={transactions}
        total={total}
        pages={pages}
        currentPage={currentPage}
      />
    </div>
  );
}
