"use client";

import {
  useState,
  useEffect,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import WordCloudCanvas from "@/components/WordCloudCanvas";
import type { MongoDB } from "@/types/MongoDB";

interface MongoDBClientProps {
  initialTodos: MongoDB[];
}

export default function SlaidoClient({ initialTodos }: MongoDBClientProps) {
  const [word, setWord] = useState("");
  const [messages, setMessages] = useState<MongoDB[]>(initialTodos);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    setMessages(initialTodos);
  }, [initialTodos]);

  useEffect(() => {
    let isActive = true;
    let currentController: AbortController | null = null;

    const fetchMessages = async () => {
      currentController?.abort();
      const controller = new AbortController();
      currentController = controller;

      try {
        const response = await fetch("/api/messages", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        const data: MongoDB[] = await response.json();
        if (isActive && !controller.signal.aborted) {
          setMessages(data);
        }
      } catch (error) {
        const errorWithName = error as { name?: string };
        if (errorWithName?.name === "AbortError") {
          return;
        }
        if (isActive) {
          console.error("Failed to refresh messages", error);
        }
      }
    };

    const eventSource = new EventSource("/api/sse");

    eventSource.onmessage = () => {
      fetchMessages();
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error", err);
    };

    fetchMessages();

    return () => {
      isActive = false;
      currentController?.abort();
      eventSource.close();
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!word.trim()) {
      setError("単語を入力してください。");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/mongos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: word.trim() }),
        });
      } catch (error) {
        console.error("Failed to add word", error);
      }
    });

    setWord("");
  };

  return (
    <section className="dashboard-grid">
      <div className="word-cloud-shell">
        <WordCloudCanvas mongos={messages} />
      </div>

      <div className="form-card">
        <h2>新しい単語を追加</h2>
        <form onSubmit={handleSubmit}>
          <label>
            単語
            <input
              type="text"
              value={word}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setWord(event.target.value)
              }
              placeholder="例: Network"
              required
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" disabled={isPending}>
            {isPending ? "保存中…" : "追加する"}
          </button>
        </form>
      </div>
    </section>
  );
}
