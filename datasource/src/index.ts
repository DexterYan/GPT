import { Dataset, CheerioCrawler, log, LogLevel } from 'crawlee';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { getContentFromCommunityURL } from './lib/replicated';
import { getAllClosedIssuesIterator, getCommentsIterator, getIssueDetails } from './lib/github';
import { saveIssue } from './lib/model/github';

log.setLevel(LogLevel.DEBUG);

async function asyncWriteFile(filename: string, data: any) {
    try {
        await fsPromises.writeFile(join(__dirname, filename), data, {
            flag: 'w',
        });

        const contents = await fsPromises.readFile(
            join(__dirname, filename),
            'utf-8',
        );

        return contents;
    } catch (err) {
        log.debug(err);
        return 'Error writing file';
    }
}

async function main(): Promise<void> {
    var testTitleRe = /test($|ing| )/i;
    var testBodyRe = /(|vendor )test($|ing)/i;
    var descriptionRe = /Description:(.*)/gmsi;
    var description = '';
    const iterator = await getAllClosedIssuesIterator('replicated-collab', 'swimlane-support', 1);

    // await getContentFromCommunityURL([
    //     // 'https://community.replicated.com/c/how-do-i/8'
    //     'https://community.replicated.com/c/supporting-your-customers/6'
    // ]

    // for await (const { data: issues } of iterator) {
    //     for (const issue of issues) {
    //         if (issue.title?.match(testTitleRe)) {
    //             continue;
    //         }
    //         if (issue.body?.match(testBodyRe)) {
    //             continue;
    //         }
    //         if (issue.body?.match(descriptionRe)) {
    //             var description = issue.body?.match(descriptionRe)?.[0] || '';
    //             description = description.replace(/Description:/gm, '');
    //             // description = await summaryContext(description);
    //             saveIssue(issue.url, issue.title, [], description, 'replicated-collab', 'swimlane-support');
    //             console.log("Issue #%d: done", issue.number,);
    //         }

    //         const commentsIterator = await getCommentsIterator('replicated-collab', 'swimlane-support', 5, issue.number);
    //         // for await (const { data: comments } of commentsIterator) {
    //         //     for (const comment of comments) {
    //         //         console.log("Comment #%d: %s", comment.id, comment.body);
    //         //     }
    //         // }
    //     }
    // }

    const commentsIterator = await getCommentsIterator('replicated-collab', 'swimlane-replicated', 5, 288);
    for await (const { data: comments } of commentsIterator) {
        for (const comment of comments) {
            console.log("Comment #%d: %s", comment.id, comment.body);
        }
    }

    log.debug('Crawler finished.');
}

main().catch(console.error);

