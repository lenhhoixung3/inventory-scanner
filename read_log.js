const fs = require('fs')
console.log(fs.readFileSync(process.argv[2], 'utf8').substring(800, 2000))
