import { notFound } from "next/navigation";
import { PracticeWorkspace } from "@/components/practice/workspace";
import { practiceDemo } from "@/lib/practice/demo";
export default function Preview() {
  if (process.env.NODE_ENV === "production") notFound();
  const fixtures = practiceDemo();
  return (
    <PracticeWorkspace
      locations={fixtures[0].practices}
      previewFixtures={fixtures}
    />
  );
}
