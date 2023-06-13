import { getAllClosedIssuesIterator, getCommentsIterator, getIssueDetails } from './lib/github';
import { getCategorizedPrompts } from './lib/prompt';
const { Tiktoken } = require("tiktoken/lite");
const { load } = require("tiktoken/load");
const registry = require("tiktoken/registry.json");
const models = require("tiktoken/model_to_encoding.json");

async function main(): Promise<void> {

  const issue = await getIssueDetails('replicated-collab', 'swimlane-replicated', 288);
  // console.log(issue.userDescription);
  const model = await load(registry[models["gpt-3.5-turbo"]]);
  const encoder = new Tiktoken(
    model.bpe_ranks,
    model.special_tokens,
    model.pat_str
  );
  const tokens = encoder.encode(issue.userDescription);
  if (tokens.length > 4096) {
    console.error("Input too long");
  } else {
    await getCategorizedPrompts(issue.userDescription);
  }
  encoder.free();
}

main().catch(console.error);
