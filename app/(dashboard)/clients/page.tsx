import { ClientsDataTable } from "@/components/clients/clients-data-table";
import { PageHeader } from "@/components/shared/page-header";
import { getOrgContext } from "@/lib/queries/org";
import { getClientsForUser } from "@/lib/queries/clients";

export default async function ClientsPage() {
  const ctx = await getOrgContext();
  const clients = await getClientsForUser();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Clients"
        description="Manage client companies for inspections and reports."
      />
      <ClientsDataTable initialClients={clients} canEdit={ctx?.role === "admin"} />
    </div>
  );
}
