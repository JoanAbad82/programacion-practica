import { BlockStudyIndex } from "@/components/study/block-study-index";
import { getBlock1Manifest, getBlock1Units } from "@/lib/content/study-content";

export default async function Block1StudyPage() {
  const [manifest, units] = await Promise.all([
    getBlock1Manifest(),
    getBlock1Units(),
  ]);

  return <BlockStudyIndex blockId="B1" manifest={manifest} units={units} />;
}
