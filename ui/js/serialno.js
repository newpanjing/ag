const process = require('child_process');

exports.get = function () {
    return new Promise((resolve, reject) => {
        process.exec('system_profiler SPHardwareDataType | awk \'/UUID/{ print $3; }\'', ((error, stdout, stderr) => {
            if (error) {
                reject(error, stderr);
            } else {
                let value = stdout.replace(/\n|\-/g, '');
                let rs = [];
                if (value.length == 32) {
                    for (var i = 0; i < 32; i += 4) {
                        rs.push(value[i]);
                    }
                }else{
                    rs = value;
                }
                resolve(rs.join(''));
            }
        }))
    });
}

exports.get().then(res => {
    console.log(res)
}).catch(err => {
    console.error(err)
})


