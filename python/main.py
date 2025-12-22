import pymongo
import time

def main():
    # MongoDBの接続情報
    mongo_uri = "mongodb://root:password@db:27017/db_slaido?authSource=admin"
    client = pymongo.MongoClient(mongo_uri)
    db = client.db_slaido

    print("Grouping process started...")

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
