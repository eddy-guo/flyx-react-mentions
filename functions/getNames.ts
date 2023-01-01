import { Client as ElasticClient } from "@elastic/elasticsearch";

// Setup ElasticSearch
const elastic = new ElasticClient({
    cloud: {
        id: process.env.ELASTIC_CLOUD_ID ?? "",
    },
    auth: {
        username: process.env.ELASTIC_USER ?? "",
        password: process.env.ELASTIC_PASSWORD ?? "",
    },
});

export type Person = {
    firstName: string;
    lastName: string;
    email: string;
};

/**
 * Collects all documents for index
 * @param {string} index to collect
 */
export async function getAllDataByIndex(index: string): Promise<Person[]> {
    // Collect result
    const result = await elastic.search({
        index,
        query: {
            match_all: {},
        },
        // 12 + 13 = 25 records, pull 15 as safe-measure
        size: 15,
    });

    // Parse documents
    return result.hits.hits.map((h) => h._source) as Person[];
}
