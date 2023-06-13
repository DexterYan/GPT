import { enqueueLinks, PlaywrightCrawler, sleep } from 'crawlee';
import { saveDoc } from './model/doc';
import * as _ from "lodash";

let results: any[] = [];

async function getContentFromCommunityURL(urls: string[]): Promise<void> {
    const crawler = new PlaywrightCrawler({
        launchContext: {
            // Here you can set options that are passed to the playwright .launch() function.
            launchOptions: {
                headless: true,
            },
        },
        requestHandler: async ({ page, parseWithCheerio, request, enqueueLinks }) => {
            // Wait for the actor cards to render.
            if (request.label !== 'detail') {

                let baseUrl = new URL(page.url()).origin;
                let init_height = await page.evaluate('(document.body.scrollHeight)') as number;
                async function scrollDown(height: number) {
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                    await sleep(1000);
                    let curr_height = await page.evaluate('(document.body.scrollHeight)') as number;

                    if (curr_height > height) {
                        await scrollDown(curr_height);
                    }
                }
                await scrollDown(init_height);
                await page.waitForSelector('.footer-message');
                // Execute a function in the browser which targets
                // the actor card elements and allows their manipulation.
                const $ = await parseWithCheerio();
                $('.main-link').each((_, el) => {
                    const text = $(el).find('.link-top-line').text();
                    const url = $(el).find('.link-top-line a').attr('href');
                    let tags: string | any[] = [];
                    let tags_content = $(el).find('.link-bottom-line .discourse-tags').text().trim();
                    if (tags_content != '') {
                        tags = tags_content.split(' ')
                    }
                    console.log(`${baseUrl}${url}: ${text}\n`);
                    console.log(`Tags: ${tags} ${tags.length}\n`);
                    results.push({
                        url: `${baseUrl}${url}`,
                        title: text.trim(),
                        content: '',
                        tags: tags,
                    });
                });

                await enqueueLinks({
                    urls: results.map((r) => r.url),
                    label: 'detail',
                });
            } else {
                await page.waitForSelector('.regular .contents');
                const $ = await parseWithCheerio();
                const content = $('.regular .contents').text().trim();
                let res = _.find(results, { "url": request.url });
                res.content = content;
                await saveDoc(res.url, res.title, res.tags, res.content, '');
            }

        },
    });

    await crawler.run(urls);
}

export { getContentFromCommunityURL };