import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard since this is an ERP system
  redirect("/dashboard");
}
