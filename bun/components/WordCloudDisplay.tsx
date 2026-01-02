"use client";

import { useState, useEffect } from "react";
import WordCloudCanvas from "@/components/WordCloudCanvas";
import type { Word } from "@/types/Word";

interface WordCloudDisplayProps {
  initialWords: Word[];
}

/**
 * WordCloudDisplay - ワードクラウド表示用コンポーネント
 * SSEで変更を監視し、リアルタイムで更新を反映する
 */
export default function WordCloudDisplay({
  initialWords,
}: WordCloudDisplayProps) {
  const [words, setWords] = useState<Word[]>(initialWords);

  useEffect(() => {
    setWords(initialWords);
  }, [initialWords]);

  useEffect(() => {
    let isActive = true;
    let currentController: AbortController | null = null;

    const fetchWords = async () => {
      currentController?.abort();
      const controller = new AbortController();
      currentController = controller;

      try {
        const response = await fetch("/api/words", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch words: ${response.status}`);
        }
        const data: Word[] = await response.json();
        if (isActive && !controller.signal.aborted) {
          setWords(data);
        }
      } catch (error) {
        const errorWithName = error as { name?: string };
        if (errorWithName?.name === "AbortError") {
          return;
        }
        if (isActive) {
          console.error("Failed to refresh words", error);
        }
      }
    };

    // SSE接続でリアルタイム更新を監視
    const eventSource = new EventSource("/api/sse");

    eventSource.onmessage = () => {
      fetchWords();
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error", err);
    };

    // 初回読み込み
    fetchWords();

    return () => {
      isActive = false;
      currentController?.abort();
      eventSource.close();
    };
  }, []);

  return (
    <div className="word-cloud-container">
      <div className="word-cloud-shell">
        <WordCloudCanvas mongos={words} />
      </div>
    </div>
  );
}
