import { SalesTable } from "@/components/sales/sales-table";
import { getTranslations } from "next-intl/server";

export default async function SalesPage() {
  const t = await getTranslations("sales");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <SalesTable />
    </div>
  );
}
