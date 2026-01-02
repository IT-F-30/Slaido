import WordCloudDisplay from "@/components/WordCloudDisplay";
import { getWords } from "@/lib/words";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DisplayPage() {
  const words = await getWords();

  return (
    <main>
      <div className="page-header">
        <h1>Slaido</h1>
        <nav className="page-nav">
          <Link href="/" className="nav-link">
            ホーム
          </Link>
          <Link href="/register" className="nav-link">
            単語登録
          </Link>
        </nav>
      </div>
      <WordCloudDisplay initialWords={words} />
    </main>
  );
}
