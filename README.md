# extreme-scrap

A command-line tool to convert any webpage to markdown using a headless browser.

## Installation

```bash
npm install -g extreme-scrap
```

## Usage

```bash
npx extreme-scrap <url>
```

Example:
```bash
npx extreme-scrap https://example.com
```

## Features

- JavaScript-enabled webpage scraping
- Clean markdown output
- Code block preservation with language detection
- Automatic removal of navigation and non-content elements

## Output

The tool outputs clean markdown content to stdout, which can be redirected to a file:

```bash
npx extreme-scrap https://example.com > output.md
