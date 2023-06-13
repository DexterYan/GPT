import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

import { ChatOpenAI } from "langchain/chat_models/openai";


const delimiter = "^^^^^"
const categories = [
  "kots", "fannel", "kubernetes", "containerd", "docker",
  "velero", "rook", "longhorn", "minio", "registry",
  "ekco", "sonobuoy", "kurl", "support-bundle", "longhorn",
  "openebs",
]

async function getCategorizedPrompts(description: string) {
  const chat = new ChatOpenAI({ temperature: 0 });
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "You will be provided with customer queries to resolve the issue" +
      "The issue description will be delimited with {delimiter} characters" +
      "Classify each query into multiple categories. Provide your output in json format with the keys: category and true/false value" +
      "categories: {categories}",
    ),
    HumanMessagePromptTemplate.fromTemplate("{delimiter}{description}{delimiter}"),
  ]);

  const prompt = await chatPrompt.formatPromptValue({
    delimiter: delimiter,
    description: description,
    categories: categories.join(","),
  });

  const response = await chat.generatePrompt([
    prompt,
  ]);

  console.log(response.generations[0][0].text);
}

export { getCategorizedPrompts };
