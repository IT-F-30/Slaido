import pymongo
import time

def main():
    # MongoDBの接続情報
    mongo_uri = "mongodb://root:password@db:27017/db_slaido?authSource=admin"
    client = pymongo.MongoClient(mongo_uri)
    db = client.db_slaido

<<<<<<< HEAD
    print("Grouping process started...")
=======
    # ポーリング間隔（秒）
    POLL_INTERVAL = 5

    # MongoDB接続
    print(f"Connecting to MongoDB: {MONGO_URI}", flush=True)
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    messages_col = db[COL_MESSAGES]
    correlations_col = db[COL_CORRELATIONS]

    # グルーパーを初期化（最初に1回だけ）
    print("Initializing TextGrouper...", flush=True)
    # 0.165 is the sweet spot:
    # - Includes Cabbage (dist ~0.163 to other veggies)
    # - Excludes Apple (dist ~0.168 to veggies)
    # - 0.132 was too strict (fragmented), 0.17 starts merging different categories
    grouper = TextGrouper(distance_threshold=0.168)

    # 前回処理したメッセージ数を記録（変更検出用）
    last_message_count = -1
    last_message_hash = None

    print(f"\nStarting infinite loop (polling every {POLL_INTERVAL}s)...", flush=True)
    print("=" * 50, flush=True)
>>>>>>> e322cfa0612abc8cdf932668e91de8c25c34253a

    while True:
        try:
            # inputコレクションから全てのデータを取得
            input_items = list(db.input.find())

            if input_items:
                output_docs = []
                # データを二個ずつ（ペア）にして処理
                for i in range(0, len(input_items), 2):
                    chunk = input_items[i : i + 2]
                    
                    # ペアの最初の要素を取得
                    first_item = chunk[0]
                    # グループ番号を設定 (1, 2, 3...)
                    group_number = (i // 2) + 1

                    output_docs.append({
                        "word": first_item["word"],
                        "group_number": int(group_number)
                    })

                if output_docs:
                    # outputコレクションを一旦お掃除してから新しいデータを挿入
                    db.output.delete_many({})
                    db.output.insert_many(output_docs)
            else:
                # 入力データが空の場合は出力をクリアしておく
                db.output.delete_many({})

        except Exception as e:
            print(f"Error during processing: {e}")

        # 常に最新の状態を反映させるため、短い間隔でループ
        time.sleep(1)

if __name__ == "__main__":
    main()
