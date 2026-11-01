import type { Metadata } from "next";
import { CustomerDetailView } from "@/components/pages/CustomerDetailView";

export const metadata: Metadata = { title: "Customer" };

export default function Page() {
  return <CustomerDetailView />;
}
