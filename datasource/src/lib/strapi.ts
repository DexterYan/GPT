import 'dotenv/config'
import axios, { AxiosResponse } from 'axios';
require('dotenv').config()

type Issue = {
  title: string;
  description: string;
  userDescription: string;
  replicatedDescription: string;
  commentsFullText: string;
  labels: string[];
};

type GetIssuesResponse = {
  data: Issue[];
};

type CreateIssueResponse = {
  data: Issue;
};


const config = {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`
  }
};

async function getIssue(): Promise<Issue[]> {
  let response: AxiosResponse;
  try {
    const { data, status } = await axios.get<GetIssuesResponse>('http://127.0.0.1:1337/api/issues', config);

    if (status !== 200) {
      throw new Error(`Unable to fetch issues: ${status}`);
    }

    return data.data;
  } catch (error) {
    console.error(`Error fetching issues: ${error}`);
    throw error;
  }
}

async function createIssue(issue: Issue): Promise<void> {
  try {
    const { data, status } = await axios.post('http://127.0.0.1:1337/api/issues', {
      data: issue
    }, config);
  } catch (error) {
    console.error(`Error creating issues: ${error}`);
  }
}

export { getIssue, createIssue };
