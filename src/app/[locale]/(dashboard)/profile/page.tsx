import { ProfileCard } from "@/components/profile/profile-card";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
  const t = await getTranslations("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <ProfileCard />
    </div>
  );
}
