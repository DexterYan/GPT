import { saveDocs, searchDoc } from './lib/embeddings';
import { createClient, createCluster } from "redis";
import { Document, DocumentInput } from "langchain/document";
import { getAllClosedIssuesIterator, getCommentsIterator, getIssueDetails } from './lib/github';
import { summaryContext, commentAnalysis, getLabelsPrompts } from './lib/prompt';
import yargs from 'yargs';
import { createIssue, getIssue } from './lib/strapi';
const { Tiktoken } = require("tiktoken/lite");
const { load } = require("tiktoken/load");
const registry = require("tiktoken/registry.json");
const models = require("tiktoken/model_to_encoding.json");

var argv = require('yargs/yargs')(process.argv.slice(2))
  // .default({ org: 'swimlane-replicated', num: '288' })
  .argv
  ;


const client = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

async function main(): Promise<void> {
  await client.connect();
  console.log(argv.org, argv.num);
  const issue = await getIssueDetails('replicated-collab', argv.org, argv.num);
  var docs = []

  let labels = [];
  const userLabels = await getLabelsPrompts(issue.userDescription);
  const replicatedLabels = await getLabelsPrompts(issue.userDescription);

  for (const label of Object.keys(userLabels)) {
    if (userLabels[label]) {
      labels.push(label);
    }
  }

  for (const label of Object.keys(replicatedLabels)) {
    if (replicatedLabels[label] && !labels.includes(label)) {
      labels.push(label);
    }
  }

  await createIssue(
    {
      "title": issue.title,
      "description": issue.description,
      "userDescription": issue.userDescription,
      "replicatedDescription": issue.replicatedDescription,
      "commentsFullText": issue.commentsFullText,
      "labels": labels
    }
  );

  for (const comment of issue.comments) {
    const analyzer = await commentAnalysis(comment.content);
    const doc = new Document({
      metadata: {
        url: comment.url,
        ...analyzer,
      },
      pageContent: comment.content,
    });
    docs.push(doc);
  }
  await saveDocs(client, docs);

  // console.log(await searchDoc(client, "rook fail", 5))
  await client.disconnect();
  // console.log(await getIssue());
}

main().catch(console.error);
