const fs = require('fs');
for (const file of fs.readdirSync('apks')) {
    if (fs.readdirSync('apks/' + file).length == 0) {
        fs.rmdirSync('apks/' + file);
    }
}