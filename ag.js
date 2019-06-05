var process = require('child_process');
/*
显卡切换
 */
exports.set = function (model) {
    process.exec(`sudo pmset -a GPUSwitch ${model}`, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
}
