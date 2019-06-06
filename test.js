var os = require('os');
var fs = require('fs');
var filepath = os.homedir() + '/.ag';
console.log(filepath)

fs.writeFileSync(filepath, '123');