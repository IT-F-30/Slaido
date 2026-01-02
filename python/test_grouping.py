import os

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity

# --- Configuration ---
MODEL_CACHE_DIR = "/app/models"
MODEL_NAME = "intfloat/multilingual-e5-large"

# Set environment variables for local testing
os.environ["SENTENCE_TRANSFORMERS_HOME"] = MODEL_CACHE_DIR
os.environ["HF_HOME"] = MODEL_CACHE_DIR

class TextGrouper:
    def __init__(self, model_name: str = MODEL_NAME, distance_threshold: float = 0.3):
        self.distance_threshold = distance_threshold
        self.model = SentenceTransformer(model_name, cache_folder=MODEL_CACHE_DIR)

    def get_embeddings(self, texts: list[str]) -> np.ndarray:
        prefixed_texts = [f"query: {text}" for text in texts]
        return self.model.encode(prefixed_texts, normalize_embeddings=True)

    def group_texts_hierarchical(self, texts: list[str], threshold: float = None) -> list[list[str]]:
        if not texts: return []
        if len(texts) == 1: return [texts]

        t = threshold if threshold is not None else self.distance_threshold
        embeddings = self.get_embeddings(texts)
        clustering = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=t,
            metric="cosine",
            linkage="average",
        )
        labels = clustering.fit_predict(embeddings)
        groups = {}
        for i, label in enumerate(labels):
            if label not in groups: groups[label] = []
            groups[label].append(texts[i])
        return list(groups.values())

def test_thresholds():
    texts = ["大根", "人参", "キャベツ", "白菜", "ナス", "キュウリ", "トマト", "リンゴ" ,"レタス","とうもろこし","長ネギ","生姜","玉ねぎ","いちご","バナナ","みかん","ブルーベリー","樽","酢","チョコケーキ","チキン","チーズケーキ","パンケーキ"]

    # 果物
    fruits = {"リンゴ", "バナナ","みかん","ブルーベリー","いちご"}

    # 野菜
    vegetables = {"大根", "人参", "キャベツ", "白菜", "ナス", "キュウリ", "トマト", "レタス","とうもろこし","長ネギ","生姜","玉ねぎ"}

    # ケーキ
    cakes = {"チョコケーキ","チキン","チーズケーキ","パンケーキ"}

    # その他
    others = {"酢","樽"}

    grouper = TextGrouper()

    print(f"Testing thresholds for: {texts}")
    print("-" * 50)

    # Print similarity matrix
    embeddings = grouper.get_embeddings(texts)
    sim_matrix = cosine_similarity(embeddings)
    print("Similarity Matrix:")
    header = " " * 10
    for i in range(len(texts)):
        header += f"{i:6}"
    print(header)
    for i, text in enumerate(texts):
        row = f"{text:<8}"
        for j in range(len(texts)):
            row += f"{sim_matrix[i][j]:6.3f}"
        print(row)
    print("-" * 50)

    best_results = [] # (error, linkage, threshold, mapping)
    min_overall_error = float('inf')

    target_groups = [fruits, vegetables, cakes, others]
    target_names = ["Fruits", "Vegetables", "Cakes", "Others"]

    thresholds = list(i / 1000 for i in range(100, 300))

    # Test different linkage methods
    linkage_methods = ['average', 'complete']

    print("Optimization started...")

    print("Detailed check for specific thresholds...")
    check_thresholds = [0.132, 0.16, 0.18, 0.20]

    for t in check_thresholds:
        print(f"\n--- Threshold {t} ---")
        grouper.distance_threshold = t # Hacky update or just pass to method
        # TextGrouper class has distance_threshold, but group_texts_hierarchical argument 'threshold' (if I didn't remove it?)
        # My previous edit removed the 'threshold' arg from group_texts_hierarchical in the class?
        # No, I am editing the test script. TextGrouper definition is in the same file (lines 15-41).
        # Wait, TextGrouper in test_grouping.py defaults to using 'threshold' arg if passed.

        groups = [set(g) for g in grouper.group_texts_hierarchical(texts, threshold=t)]

        # Calculate error to compare
        current_error = 0
        for target in target_groups:
             # Find best match
             min_diff = float('inf')
             for g in groups:
                 diff = len(target.symmetric_difference(g))
                 if diff < min_diff: min_diff = diff
             current_error += min_diff

        print(f"Total Error: {current_error}")
        for i, g in enumerate(groups, 1):
            # Try to identify what this group represents
            label = "Mixed/Unknown"
            if fruits.issubset(g): label = "ALL FRUITS"
            elif vegetables.issubset(g): label = "ALL VEGETABLES"
            elif cakes.issubset(g): label = "ALL CAKES"

            print(f"  Group {i}: {g} ({label})")

if __name__ == "__main__":
    test_thresholds()
