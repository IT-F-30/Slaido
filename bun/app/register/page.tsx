import WordRegistrationForm from "@/components/WordRegistrationForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main>
      <div className="page-header">
        <h1>単語を登録</h1>
        <nav className="page-nav">
          <Link href="/" className="nav-link">
            ホーム
          </Link>
          <Link href="/display" className="nav-link">
            表示ページへ
          </Link>
        </nav>
      </div>
      <section className="register-section">
        <WordRegistrationForm />
      </section>
    </main>
  );
}
