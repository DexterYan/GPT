
import { Document, DocumentInput } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RedisVectorStore } from "langchain/vectorstores/redis";
import { RedisClientType } from "redis";


async function saveDocs(client: any, docs: any): Promise<void> {
  const vectorStore = await RedisVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings(),
    {
      redisClient: client,
      indexName: "docs",
    }
  );
  console.log(vectorStore);
}

async function searchDoc(client: any, content: string, num: number): Promise<Document[]> {
  const vectorStore = new RedisVectorStore(new OpenAIEmbeddings(), {
    redisClient: client,
    indexName: "docs",
  });

  const simpleRes = await vectorStore.similaritySearch(content, num);
  return simpleRes;
}
export { saveDocs, searchDoc };
