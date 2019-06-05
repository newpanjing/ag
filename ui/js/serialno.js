const process = require('child_process');

exports.get = function () {
    return new Promise((resolve, reject) => {
        process.exec('system_profiler SPHardwareDataType | awk \'/UUID/{ print $3; }\'', ((error, stdout, stderr) => {
            if(error){
                reject(error, stderr);
            }else{
                resolve(stdout.replace(/\n|\-/g,''));
            }
        }))
    });
}

// exports.get().then(res => {
//     console.log(res)
// }).catch(err => {
//     console.error(err)
// })
//

