import AppShell from '@/components/AppShell';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell title="Financial Reports">{children}</AppShell>;
}
