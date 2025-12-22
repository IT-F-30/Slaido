import { MongoClient, MongoClientOptions, type WithId } from "mongodb";
import type { MongoDB } from "@/types/MongoDB";

const uri =
  process.env.MONGODB_URI ||
  "mongodb://root:password@db:27017/db_slaido?authSource=admin";

const options: MongoClientOptions = {};
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export const OUTPUT_COLLECTION = "output";
export const DEFAULT_GROUP_NUMBER = 1;
export const OUTPUT_DEFAULT_SORT = { group_number: 1, word: 1 } as const;
export type RawOutputDocument = WithId<MongoDB>;

export function coercePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const whole = Math.trunc(parsed);
  return whole > 0 ? whole : fallback;
}

export function normalizeOutputDoc(doc: RawOutputDocument): MongoDB {
  const word =
    typeof doc.word === "string" ? doc.word : String(doc.word ?? "").trim();

  const groupNumber = coercePositiveInteger(
    doc.group_number,
    DEFAULT_GROUP_NUMBER,
  );

  const rawWeight = doc.weight ?? doc.group_number;
  const weight = coercePositiveInteger(rawWeight, groupNumber);

  return {
    _id: doc._id.toString(),
    word,
    group_number: groupNumber,
    weight,
  };
}

export function normalizeOutputDocs(docs: RawOutputDocument[]): MongoDB[] {
  return docs.map(normalizeOutputDoc);
}

export async function getMongodb(): Promise<MongoDB[]> {
  try {
    const client = await getMongoClient();
    const collection = client
      .db(getDatabaseName())
      .collection<MongoDB>(OUTPUT_COLLECTION);

    const docs = await collection.find({}).sort(OUTPUT_DEFAULT_SORT).toArray();

    return normalizeOutputDocs(docs as RawOutputDocument[]);
  } catch (error) {
    console.error("Failed to fetch output documents:", error);
    return [];
  }
}

if (!process.env.MONGODB_URI) {
  console.warn(
    "MONGODB_URI is not defined in environment variables. Using default fallback.",
  );
}

const connectWithRetry = async (
  retries = 5,
  delay = 2000,
): Promise<MongoClient> => {
  try {
    const client = new MongoClient(uri, options);
    const connectedClient = await client.connect();
    console.log("Successfully connected to MongoDB");
    return connectedClient;
  } catch (err) {
    if (retries === 0) {
      console.error("Failed to connect to MongoDB after multiple attempts:", err);
      throw err;
    }

    console.warn(
      `MongoDB connection failed. Retrying in ${delay}ms... (${retries} attempts left)`,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectWithRetry(retries - 1, delay * 1.5);
  }
};

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectWithRetry();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = connectWithRetry();
}

export function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export function getDatabaseName(): string {
  return process.env.MONGODB_DB || "db_slaido";
}
