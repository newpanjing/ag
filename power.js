/*
    监控电源模式，电池或是交流电
 */
const spawn = require('child_process').spawn;
const power = spawn('pmset', ['-g', 'pslog']);
const electron = require('electron')
const {ipcRenderer} = electron
exports.start = function () {
    this.addListener(type => {
        ipcRenderer.send('powerChange', type);
    })
}
/**
 * 监听电源模式
 * @param callback
 */
exports.addListener = function (callback) {

    var last = '';

    power.stdout.on('data', (data) => {
        if (data && data.indexOf('IOPSNotificationCreateRunLoopSource') != -1) {
            var regex = /Now drawing from \'(.*?)\'/;
            let m = data.toString().match(regex);
            if (m) {
                let type = m[1];
                if (last != type) {
                    last = type;
                    callback(type)
                }
            }
        }
    });

    power.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    power.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}



