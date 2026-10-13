import { getContacts } from "./actions";
import { ContactList } from "./contact-list";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    search?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function ContactsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  const { contacts, total, pages, currentPage } = await getContacts({
    search: params.search,
    type: params.type,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <p className="text-muted-foreground mt-1">
          Manage your suppliers and customers
        </p>
      </div>
      <ContactList
        contacts={contacts}
        total={total}
        pages={pages}
        currentPage={currentPage}
      />
    </div>
  );
}
