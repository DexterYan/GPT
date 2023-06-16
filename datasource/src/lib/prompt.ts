import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

import { StructuredOutputParser } from "langchain/output_parsers";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAI } from "langchain/llms/openai";

const { Tiktoken } = require("tiktoken/lite");
const { load } = require("tiktoken/load");
const registry = require("tiktoken/registry.json");
const models = require("tiktoken/model_to_encoding.json");


const delimiter = "^^^^^"

async function getLabelsPrompts(description: string, modelName: string = "gpt-3.5-turbo") {
  const parser = StructuredOutputParser.fromNamesAndDescriptions({
    kots: "Was it a kots issue? Or has kots been mentioned?, return true/false",
    kubernetes: "Was it a kubernetes issue? return true/false",
    upgrade: "Was it an upgrade issue, or involved some migration? return true/false",
    containerd: "Was it a containerd issue? including image pull, return true/false",
    dns: "Was it a dns issue? including coredns, nslookup, name resolution return true/false",
    network: "Was it a networking issue? including ingress, service, connection, port return true/false",
    storage: "Was it a storage issue? including pvc, pv, volume, rook, openebs, return true/false",
    certificate: "Was it a certificate issue? including tls/ssl certificate expire or invalid, return true/false",
  })

  const chat = new ChatOpenAI({ modelName, temperature: 0 });
  const formatInstructions = parser.getFormatInstructions();
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "You will be provided with customer queries to resolve the issue.\n" +
      "The issue description will be delimited with {delimiter} characters.\n" +
      "{formatInstructions}"
    ),
    HumanMessagePromptTemplate.fromTemplate("{delimiter}{description}{delimiter}"),
  ]);

  const prompt = await chatPrompt.formatPromptValue({
    delimiter: delimiter,
    description: description,
    formatInstructions: formatInstructions,
  });

  const response = await chat.generatePrompt([
    prompt,
  ]);

  if (response.generations.length > 0) {
    try {
      response.generations[0][0].text = response.generations[0][0].text.replace(',\n}', "\n}");
      const output = JSON.parse(response.generations[0][0].text);
      return output;
    } catch (e) {
      console.error("Error parsing JSON response", e);
    }
  }
}

async function commentAnalysis(comment: string, modelName: string = "gpt-3.5-turbo") {
  const model = await load(registry[models[modelName]]);
  const encoder = new Tiktoken(
    model.bpe_ranks,
    model.special_tokens,
    model.pat_str
  );
  const tokens = encoder.encode(comment);
  if (tokens.length > 3900) {
    modelName = "gpt-3.5-turbo-16k";
  } else {
    const parser = StructuredOutputParser.fromNamesAndDescriptions({
      isSummary: "Did someone try to summary the issue? return true/false",
      isClosed: "Did someone mark the issue as close? return true/false",
      isShecduled: "Did someone try to schedule a meeting or call? return true/false",
      isSupportBundle: "Did someone try to provide support bundle file? return true/false",
      logs: "Did it contain any logs? return true/false",
      bug: "Did contain or report a bug? return true/false",
      useless: "Is it only about scheduling a call, appreciating someone, request for update, checking status? return true/false",
      conclusion: "short summary of this comment within 100 tokens"
    })

    const chat = new ChatOpenAI({ modelName, temperature: 0 });
    const formatInstructions = parser.getFormatInstructions();
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        "You will be provided with comment to resolve an issue.\n" +
        "The comment will be delimited with {delimiter} characters.\n" +
        "{formatInstructions}"
      ),
      HumanMessagePromptTemplate.fromTemplate("{delimiter}{comment}{delimiter}"),
    ]);

    const prompt = await chatPrompt.formatPromptValue({
      delimiter: delimiter,
      comment: comment,
      formatInstructions: formatInstructions,
    });

    const response = await chat.generatePrompt([
      prompt,
    ]);

    if (response.generations.length > 0) {
      try {
        response.generations[0][0].text = response.generations[0][0].text.replace(',\n}', "\n}");
        const analyser = await parser.parse(response.generations[0][0].text);
        return {
          ...analyser,
        }
      } catch (e) {
        console.error("Error parsing JSON response", e);
      }
    }
  }
}

async function summaryContext(context: string) {
  const model = new OpenAI({ temperature: 0 });
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([context]);
  const chain = loadSummarizationChain(model, { type: "map_reduce" });
  const res = await chain.call({
    input_documents: docs,
  });
  console.log({ res });
}

export { getLabelsPrompts, commentAnalysis, summaryContext };
