"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";

interface WordRegistrationFormProps {
  onWordAdded?: () => void;
}

export default function WordRegistrationForm({
  onWordAdded,
}: WordRegistrationFormProps) {
  const [word, setWord] = useState("");
  const [groupNumber, setGroupNumber] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!word.trim()) {
      setError("単語を入力してください。");
      return;
    }

    const parsedGroupNumber = parseInt(groupNumber, 10);
    if (isNaN(parsedGroupNumber) || parsedGroupNumber < 1) {
      setError("グループ番号は1以上の数値を入力してください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: word.trim(),
          group_number: parsedGroupNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "単語の登録に失敗しました。");
      }

      setSuccessMessage(`「${word.trim()}」を登録しました！`);
      setWord("");
      setGroupNumber("1");
      onWordAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <h2>📝 新しい単語を登録</h2>
      <form onSubmit={handleSubmit}>
        <label>
          単語
          <input
            type="text"
            value={word}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setWord(e.target.value)
            }
            placeholder="例: Network"
            required
          />
        </label>

        <label>
          グループ番号
          <input
            type="number"
            min="1"
            value={groupNumber}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setGroupNumber(e.target.value)
            }
            placeholder="1"
          />
          <small style={{ color: "#888", fontSize: "0.8rem" }}>
            ※ 小さい番号ほど中心に配置されます
          </small>
        </label>

        {error && <p className="error-text">{error}</p>}
        {successMessage && (
          <p style={{ color: "#4caf50", fontSize: "0.9rem" }}>
            {successMessage}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "登録中…" : "登録する"}
        </button>
      </form>
    </div>
  );
}
