import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-header">
        <h1> Slaido</h1>
        <p className="home-description">
          ワードクラウドで情報を視覚化するアプリケーション
        </p>
      </div>

      <div className="home-nav-cards">
        <Link href="/display" className="nav-card">
          <h2>ワードクラウドを表示</h2>
          <p>登録された単語をワードクラウドで表示します</p>
        </Link>

        <Link href="/register" className="nav-card">
          <h2>単語を登録</h2>
          <p>新しい単語を追加してワードクラウドに反映させます</p>
        </Link>
      </div>
    </main>
  );
}
