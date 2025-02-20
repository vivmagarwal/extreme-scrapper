#!/usr/bin/env node

import { Command } from 'commander';
import { scrapeToMarkdown } from './scraper.js';

const program = new Command();

program
    .name('extreme-scrap')
    .description('Convert any webpage to markdown')
    .argument('<url>', 'URL to scrape')
    .action(async (url) => {
        try {
            console.log(`Scraping ${url}...`);
            const markdown = await scrapeToMarkdown(url);
            console.log(markdown);
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    });

program.parse();
