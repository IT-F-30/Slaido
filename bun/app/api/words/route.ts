import { NextResponse } from "next/server";
import { getWords, addWord } from "@/lib/words";

/**
 * GET /api/words
 * 全ての単語を取得する
 */
export async function GET() {
  try {
    const words = await getWords();
    return NextResponse.json(words);
  } catch (error) {
    console.error("GET /api/words error:", error);
    return NextResponse.json(
      { error: "単語の取得に失敗しました" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/words
 * 新しい単語を登録する
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { word, group_number } = body ?? {};

    // バリデーション: 単語は必須
    if (!word || typeof word !== "string" || !word.trim()) {
      return NextResponse.json(
        { error: "単語を入力してください" },
        { status: 400 },
      );
    }

    // グループ番号のパース（デフォルトは1）
    let parsedGroupNumber = 1;
    if (group_number !== undefined) {
      parsedGroupNumber = Number(group_number);
      if (!Number.isFinite(parsedGroupNumber) || parsedGroupNumber < 1) {
        return NextResponse.json(
          { error: "グループ番号は1以上の数値を指定してください" },
          { status: 400 },
        );
      }
      parsedGroupNumber = Math.floor(parsedGroupNumber);
    }

    // 単語を追加
    const newWord = await addWord(word.trim(), parsedGroupNumber);

    if (!newWord) {
      return NextResponse.json(
        { error: "単語の登録に失敗しました" },
        { status: 500 },
      );
    }

    return NextResponse.json(newWord, { status: 201 });
  } catch (error) {
    console.error("POST /api/words error:", error);
    return NextResponse.json(
      { error: "単語の登録に失敗しました" },
      { status: 500 },
    );
  }
}
