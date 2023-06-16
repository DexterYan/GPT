import { Octokit, App } from "octokit";
import 'dotenv/config'
require('dotenv').config()

const octokit = new Octokit({ auth: process.env.GITHUB_API_TOKEN });

async function getAllClosedIssuesIterator(owner: string, repo: string, per_page: number) {
    const iterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
        owner: owner,
        repo: repo,
        per_page: per_page,
        state: "closed",
        sort: "created",
        order: "desc",
        limit: 1,
    });

    return iterator;
}

async function getCommentsIterator(owner: string, repo: string, per_page: number, issue_number: number) {
    const iterator = octokit.paginate.iterator(octokit.rest.issues.listComments, {
        owner: owner,
        repo: repo,
        issue_number: issue_number,
        per_page: per_page,
    });

    return iterator;
}

async function getIssueDetails(owner: string, repo: string, issue_number: number) {
    var descriptionRe = /Description:(.*)/gmsi;
    var description = '';
    var userDescription = description;
    var replicatedDescription = description;
    var replicatedGithubUsers = process.env.REPLICATED_GITHUB_USERS?.split(',') || [];
    var githubComments = [];

    const issue = await octokit.rest.issues.get({
        owner: owner,
        repo: repo,
        issue_number: issue_number,
    });

    if (issue.data.body?.match(descriptionRe)) {
        var description = issue.data.body?.match(descriptionRe)?.[0] || '';
        description = description.replace(/Description:/gm, '');
    }

    const commentsIterator = await getCommentsIterator(owner, repo, 5, issue_number);
    var issueCommentsFullText = "";

    for await (const { data: comments } of commentsIterator) {
        for (const comment of comments) {
            if (comment.user != null) {
                if (comment.user.login == 'replicated-collab[bot]') {
                    continue;
                }
                if (replicatedGithubUsers.includes(comment.user.login)) {
                    replicatedDescription += `${comment.body?.trim()}\n`
                } else {
                    userDescription += `${comment.body?.trim()}\n`
                }
            }
            comment.body = comment.body?.replace(/\/(pending)/gm, '');
            issueCommentsFullText += `Comment #${comment.user?.login} ${comment.created_at}:\n${comment.body?.trim()}\n===========`;
            githubComments.push({
                url: comment.html_url,
                content: `Comment #${comment.user?.login} ${comment.created_at}:\n${comment.body?.trim()}\n`
            });
        }
    }

    return {
        title: issue.data.title,
        description: description,
        userDescription: userDescription,
        replicatedDescription: replicatedDescription,
        commentsFullText: issueCommentsFullText,
        comments: githubComments
    };
}

export { getAllClosedIssuesIterator, getCommentsIterator, getIssueDetails };
