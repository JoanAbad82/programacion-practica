import { BlockStudyIndex } from "@/components/study/block-study-index";
import { getBlockManifest, getBlockUnits } from "@/lib/content/study-content";

export default async function Block2StudyPage() {
  const [manifest, units] = await Promise.all([
    getBlockManifest("B2"),
    getBlockUnits("B2"),
  ]);

  return <BlockStudyIndex blockId="B2" manifest={manifest} units={units} />;
}
