import { UsersTable } from "@/components/users/users-table";
import { getTranslations } from "next-intl/server";

export default async function UsersPage() {
  const t = await getTranslations("users");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <UsersTable />
    </div>
  );
}
