import AppShell from '@/components/AppShell';

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return <AppShell title="Members">{children}</AppShell>;
}
