import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Driver Dashboard - StepperGO',
  description: 'Manage your trips and earnings as a StepperGO driver',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
