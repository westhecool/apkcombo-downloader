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
    for (const file of await fs.promises.readdir(process.cwd())) {
        if (file.endsWith('.apk') || file.endsWith('.xapk') || file.endsWith('.crdownload')) {
            await fs.promises.rm(file);
        }
    }
    await fs.promises.mkdir('apks', { recursive: true });
    const browser = await puppeteer.launch({ headless: false });
    for (const e of q) {
        if (fs.existsSync('apks/' + e)) continue; // already downloaded
        const page = await browser.newPage();
        await fs.promises.mkdir('apks/' + e, { recursive: true });
        await page.goto('https://apkcombo.com/downloader/#package=' + e);
        var got = false;
        var success = false;
        while (!got) { // the site is buggy sometimes
            success = await page.evaluate(async () => {
                var r = false;
                while (!r) {
                    for (const e of Array.from(document.getElementsByTagName('p'))) {
                        if (e.innerText.includes('app has been removed') || e.innerText.includes('not available to download')) {
                            return false;
                        }
                    }
                    for (const e of Array.from(document.getElementsByTagName('a'))) {
                        if (e.href.includes('apkcombo-installer.apk')) continue;
                        if (e.href.startsWith('https://apkcombo.com/r2') || e.href.split('?')[0].endsWith('.apk') || e.href.split('?')[0].endsWith('.xapk')) {
                            window.location = e.href;
                            r = true;
                            break;
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return true;
            });
            if (success) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                for (const file of await fs.promises.readdir(process.cwd())) {
                    if (file.endsWith('.crdownload') || file.endsWith('.apk') || file.endsWith('.xapk')) {
                        got = true;
                    }
                }
            } else {
                got = true;
            }
        }
        if (!success) {
            console.log('Failed to download ' + e);
            await page.close();
            continue;
        }
        var d = false;
        while (!d) {
            for (const file of await fs.promises.readdir(process.cwd())) {
                if (file.endsWith('.apk') || file.endsWith('.xapk')) {
                    await fs.promises.rename(file, 'apks/' + e + '/' + file);
                    d = true;
                    break;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        await page.close();
    }
    await browser.close();
})();