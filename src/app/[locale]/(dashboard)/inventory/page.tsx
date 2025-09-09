import { InventoryTable } from "@/components/inventory/inventory-table";
import { getTranslations } from "next-intl/server";

export default async function InventoryPage() {
  const t = await getTranslations("inventory");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <InventoryTable />
    </div>
  );
}
