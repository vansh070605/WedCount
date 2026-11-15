import { AppHeader } from "@/app/ui/brand";

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
