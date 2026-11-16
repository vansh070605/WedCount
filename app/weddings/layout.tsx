import { AppHeader } from "@/app/ui/brand";
import { PageTransition } from "@/app/ui/motion";

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
