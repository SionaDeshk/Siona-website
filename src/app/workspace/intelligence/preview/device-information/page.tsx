import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DeviceExplainer } from "@/components/intelligence/device-explainer";

export const metadata: Metadata = {
  title: "Knee replacement, explained — Siona Device Notes",
};

export default function DeviceInformationPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DeviceExplainer />;
}
