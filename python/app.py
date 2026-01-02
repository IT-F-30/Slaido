"""
最低限のグループ化プログラム
main.pyの核心部分：SentenceTransformerによる類似度計算と階層的クラスタリング
"""

import os

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering

# モデルのローカルキャッシュディレクトリ（main.pyと同じ設定）
MODEL_CACHE_DIR = "/app/models"
MODEL_NAME = "intfloat/multilingual-e5-large"

# sentence-transformersとHugging Faceのキャッシュディレクトリを明示的に設定
os.environ["SENTENCE_TRANSFORMERS_HOME"] = MODEL_CACHE_DIR
os.environ["HF_HOME"] = MODEL_CACHE_DIR

# ディレクトリが存在しない場合は作成
os.makedirs(MODEL_CACHE_DIR, exist_ok=True)


class SimpleTextGrouper:
    """シンプルな類似度ベースのテキストグルーパー"""

    def __init__(self, model_name: str = MODEL_NAME,
                 distance_threshold: float = 0.168):
        """
        Args:
            model_name: 使用するモデル名
            distance_threshold: クラスタリングの距離閾値（小さいほど厳密）
        """
        self.distance_threshold = distance_threshold
        print(f"Loading model: {model_name}...")
        print(f"Model cache directory: {MODEL_CACHE_DIR}")
        self.model = SentenceTransformer(model_name, cache_folder=MODEL_CACHE_DIR)
        print("Model loaded!")

    def get_embeddings(self, texts: list[str]) -> np.ndarray:
        """テキストをembeddingsに変換"""
        # E5モデルは"query: "プレフィックスを推奨
        prefixed_texts = [f"query: {text}" for text in texts]
        return self.model.encode(prefixed_texts, normalize_embeddings=True)

    def calculate_similarity_matrix(self, texts: list[str]) -> np.ndarray:
        """文字列間の類似度マトリックスを計算"""
        from sklearn.metrics.pairwise import cosine_similarity
        embeddings = self.get_embeddings(texts)
        return cosine_similarity(embeddings)

    def print_similarity_matrix(self, texts: list[str]):
        """類似度マトリックスを表示（デバッグ用）"""
        similarity_matrix = self.calculate_similarity_matrix(texts)

        print("\n" + "=" * 50)
        print("Similarity Matrix:")
        print("-" * 50)

        # ヘッダー
        max_len = max(len(t) for t in texts)
        header = " " * (max_len + 2)
        for i in range(len(texts)):
            header += f"{i:>6}"
        print(header)

        # 各行
        for i, text in enumerate(texts):
            row = f"{text:<{max_len}}  "
            for j in range(len(texts)):
                row += f"{similarity_matrix[i][j]:>6.2f}"
            print(row)

        print("=" * 50)

    def print_distance_matrix(self, texts: list[str]):
        """距離マトリックスを表示（デバッグ用）"""
        similarity_matrix = self.calculate_similarity_matrix(texts)
        distance_matrix = 1 - similarity_matrix

        print("\n" + "=" * 50)
        print("Distance Matrix (1 - cosine_similarity):")
        print("-" * 50)

        # ヘッダー
        max_len = max(len(t) for t in texts)
        header = " " * (max_len + 2)
        for i in range(len(texts)):
            header += f"{i:>6}"
        print(header)

        # 各行
        for i, text in enumerate(texts):
            row = f"{text:<{max_len}}  "
            for j in range(len(texts)):
                row += f"{distance_matrix[i][j]:>6.3f}"
            print(row)

        print("=" * 50)
        print(f"Current distance_threshold: {self.distance_threshold}")
        print("=" * 50)

    def group_texts(self, texts: list[str]) -> list[list[str]]:
        """階層的クラスタリングでテキストをグループ化"""
        if not texts:
            return []
        if len(texts) == 1:
            return [texts]

        # embeddingsを取得
        embeddings = self.get_embeddings(texts)

        # 階層的クラスタリング
        clustering = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=self.distance_threshold,
            metric="cosine",
            linkage="average"
        )

        labels = clustering.fit_predict(embeddings)

        # グループを構築
        groups = {}
        for i, label in enumerate(labels):
            if label not in groups:
                groups[label] = []
            groups[label].append(texts[i])

        return list(groups.values())


def main():
    # サンプルデータ
    items = [
        "大根",
        "人参",
        "野菜",
        "白菜",
        "りんご",
        "キャベツ"
    ]

    # グルーパーを初期化
    # 距離マトリックスを見ると:
    # - りんごと野菜: 0.147 (最も近い)
    # - キャベツと野菜: 0.142
    # - 野菜グループ内: 0.133-0.151
    # 0.145に設定すると、りんごが分離される
    grouper = SimpleTextGrouper(distance_threshold=0.145)

    # 距離マトリックスを表示（デバッグ用）
    grouper.print_distance_matrix(items)

    # グループ化を実行
    print("\nGrouping texts...")
    groups = grouper.group_texts(items)

    # 結果を表示
    print("\nResults:")
    for i, group in enumerate(groups, 1):
        items_str = ",".join(group)
        print(f"Group {i} ({len(group)} items): [{items_str}]")


if __name__ == "__main__":
    main()
