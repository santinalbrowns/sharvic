import AppShell from '@/components/AppShell';

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return <AppShell title="Expenses">{children}</AppShell>;
}
