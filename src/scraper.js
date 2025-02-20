import puppeteer from 'puppeteer';
import TurndownService from 'turndown';

export async function scrapeToMarkdown(url) {
    let browser = null;
    try {
        // Launch browser with JavaScript enabled
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Set viewport to ensure consistent rendering
        await page.setViewport({ width: 1200, height: 800 });
        
        // Navigate to URL with timeout and wait until network is idle
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for content to load
        await page.waitForSelector('body');

        // Get the main content
        const content = await page.evaluate(() => {
            // Remove unwanted elements that typically don't contribute to main content
            const elementsToRemove = [
                'script',
                'style',
                'iframe',
                'nav',
                'header',
                'footer',
                'noscript',
                'svg',
                '[role="alert"]',
                '[role="banner"]',
                '[role="dialog"]',
                '[role="alertdialog"]',
                '[role="region"][aria-label*="skip" i]',
                '[aria-modal="true"]',
                '[role="navigation"]',
                '[role="complementary"]',
                '[role="search"]',
                '[aria-hidden="true"]',
                'aside',
                '.sidebar',
                '.navigation',
                '.nav',
                '.menu',
                '.search',
                '#sidebar',
                '#navigation',
                '#menu',
                '#search'
            ];

            // Remove navigation lists that might be part of sidebars
            document.querySelectorAll('ul').forEach(ul => {
                if (ul.querySelectorAll('a').length > 5) {
                    const links = Array.from(ul.querySelectorAll('a'));
                    const navigationLinks = links.filter(link => 
                        link.textContent.toLowerCase().includes('introduction') ||
                        link.textContent.toLowerCase().includes('guide') ||
                        link.textContent.toLowerCase().includes('documentation') ||
                        link.href.includes('#')
                    );
                    if (navigationLinks.length > 3) {
                        ul.remove();
                    }
                }
            });

            elementsToRemove.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => el.remove());
            });

            // Try to get the main content area first
            const mainSelectors = [
                'main',
                '[role="main"]',
                '#main-content',
                '.main-content',
                'article',
                '.article',
                '.content',
                '#content'
            ];

            let mainContent = null;
            for (const selector of mainSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    mainContent = element;
                    break;
                }
            }

            // If no main content area found, fall back to body
            return mainContent ? mainContent.innerHTML : document.body.innerHTML;
        });

        // Convert HTML to Markdown
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '_',
            bulletListMarker: '-',
            hr: '---'
        });

        // Custom rules for better markdown conversion
        turndownService.addRule('preserveCode', {
            filter: ['pre', 'code'],
            replacement: function(content, node) {
                const language = node.getAttribute('class')?.replace('language-', '') || '';
                return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
            }
        });

        // Convert to markdown
        const markdown = turndownService.turndown(content);

            // Clean up markdown
            const cleanMarkdown = markdown
                .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
                .replace(/^\s+|\s+$/g, '') // Trim whitespace
                .replace(/On this page[\s\S]*$/, '') // Remove "On this page" section and everything after
                .replace(/\[Skip to main content\].*?\n/, '') // Remove skip to content link
                .replace(/Was this page helpful\?[\s\S]*?(?=\n\n)/, '') // Remove feedback section
                .replace(/\[(?:Previous|Next)\].*?\n/g, '') // Remove previous/next navigation
                .replace(/Copy\n\n```/g, '```') // Clean up code block formatting
                .replace(/\n\s*\[​\]\s*\n/g, '\n') // Remove empty links
                .replace(/\n{2,}#/g, '\n#') // Fix heading spacing
                .trim();

        return cleanMarkdown;

    } catch (error) {
        throw new Error(`Failed to scrape ${url}: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
