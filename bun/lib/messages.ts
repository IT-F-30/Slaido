import {
    getDatabaseName,
    getMongoClient,
    OUTPUT_COLLECTION,
    OUTPUT_DEFAULT_SORT,
    normalizeOutputDocs,
    type RawOutputDocument,
} from '@/lib/mongodb';
import type { MongoDB } from '@/types/MongoDB';

export type Message = MongoDB;

export async function getMessages(): Promise<Message[]> {
    try {
        const client = await getMongoClient();
        const collection = client
            .db(getDatabaseName())
            .collection<MongoDB>(OUTPUT_COLLECTION);
        const docs = await collection.find({}).sort(OUTPUT_DEFAULT_SORT).toArray();

        return normalizeOutputDocs(docs as RawOutputDocument[]);
    } catch (error) {
        console.error('Failed to fetch output messages:', error);
        return [];
    }
}
