import { redirect } from "next/navigation";
import { getServerSession } from "@/server/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/sign-in");
  }
  return <>{children}</>;
}
