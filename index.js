if (!process.argv[2]) {
    console.log('Usage: node index.js <id(s)>');
    process.exit(1);
}
const q = process.argv[2].split(',')
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
(async () => {
    await fs.promises.mkdir('apks', { recursive: true });
    const browser = await puppeteer.launch({ headless: false });
    for (const e of q) {
        const page = await browser.newPage();
        await page.goto('https://apkcombo.com/downloader/#package=' + e);
        const url = await page.evaluate(async () => {
            var r = null;
            while (r == null) {
                for (const e of Array.from(document.getElementsByTagName('a'))) {
                    if (e.href.startsWith('https://apkcombo.com/r2') || e.href.split('?')[0].endsWith('.apk')) {
                        r = e.href;
                        break;
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return r;
        });
        await page.close();
        console.log(url);
        const r = await fetch(url);
        const buffer = Buffer.from(await r.arrayBuffer());
        await fs.promises.mkdir('apks/' + e, { recursive: true });
        await fs.promises.writeFile('apks/' + e + '/' + path.basename(decodeURI(url.split('https://')[1].split('?')[0])), buffer);
    }
    await browser.close();
})();