import {
  getDatabaseName,
  getMongoClient,
  OUTPUT_COLLECTION,
  OUTPUT_DEFAULT_SORT,
  normalizeOutputDocs,
  type RawOutputDocument,
} from "@/lib/mongodb";
import type { Word } from "@/types/Word";

/**
 * Fetches all words from the MongoDB collection
 * @returns Promise<Word[]> - Array of words sorted by group_number and word
 */
export async function getWords(): Promise<Word[]> {
  try {
    const client = await getMongoClient();
    const collection = client
      .db(getDatabaseName())
      .collection<Word>(OUTPUT_COLLECTION);
    const docs = await collection.find({}).sort(OUTPUT_DEFAULT_SORT).toArray();

    return normalizeOutputDocs(docs as RawOutputDocument[]);
  } catch (error) {
    console.error("Failed to fetch words:", error);
    return [];
  }
}

/**
 * Adds a new word to the MongoDB collection
 * @param word - The word text to add
 * @param groupNumber - Optional group number (defaults to 1)
 * @returns Promise<Word | null> - The created word or null if failed
 */
export async function addWord(
  word: string,
  groupNumber: number = 1
): Promise<Word | null> {
  try {
    const client = await getMongoClient();
    const collection = client
      .db(getDatabaseName())
      .collection(OUTPUT_COLLECTION);

    const newWord = {
      word: word.trim(),
      group_number: groupNumber,
      weight: groupNumber,
    };

    const result = await collection.insertOne(newWord);

    return {
      _id: result.insertedId.toString(),
      ...newWord,
    };
  } catch (error) {
    console.error("Failed to add word:", error);
    return null;
  }
}

/**
 * Deletes a word from the MongoDB collection by ID
 * @param id - The word ID to delete
 * @returns Promise<boolean> - True if deletion was successful
 */
export async function deleteWord(id: string): Promise<boolean> {
  try {
    const { ObjectId } = await import("mongodb");
    const client = await getMongoClient();
    const collection = client
      .db(getDatabaseName())
      .collection(OUTPUT_COLLECTION);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  } catch (error) {
    console.error("Failed to delete word:", error);
    return false;
  }
}
