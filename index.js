if (!process.argv[2]) {
    console.log('Usage: node index.js <id(s)>');
    process.exit(1);
}
const q = process.argv[2].split(',')
const puppeteer = require('puppeteer-extra')
puppeteer.use(require('puppeteer-extra-plugin-user-preferences')({
    userPrefs: {
        download: {
            prompt_for_download: false,
            default_directory: process.cwd(),
        }
    }
}));
puppeteer.use(require('puppeteer-extra-plugin-adblocker')({ blockTrackers: true }))
const fs = require('fs');
const path = require('path');
(async () => {
    await fs.promises.mkdir('apks', { recursive: true });
    const browser = await puppeteer.launch({ headless: false });
    for (const e of q) {
        const page = await browser.newPage();
        await fs.promises.mkdir('apks/' + e, { recursive: true });
        await page.goto('https://apkcombo.com/downloader/#package=' + e);
        var got = false;
        while (!got) { // the site is buggy sometimes
            await page.evaluate(async () => {
                var r = false;
                while (!r) {
                    for (const e of Array.from(document.getElementsByTagName('a'))) {
                        if (e.href.startsWith('https://apkcombo.com/r2') || e.href.split('?')[0].endsWith('.apk')) {
                            window.location = e.href;
                            r = true;
                            break;
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            for (const file of await fs.promises.readdir(process.cwd())) {
                if (file.endsWith('.crdownload')) {
                    got = true;
                }
            }
        }
        var d = false;
        while (!d) {
            for (const file of await fs.promises.readdir(process.cwd())) {
                if (file.endsWith('.apk') || file.endsWith('.xapk')) {
                    await fs.promises.rename(file, 'apks/' + e + '/' + file);
                    d = true;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        await page.close();
    }
    await browser.close();
})();