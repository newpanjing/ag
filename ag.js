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

exports.getGraphics = function () {
    return new Promise((resolve, reject) => {
        process.exec('system_profiler SPDisplaysDataType -json', ((error, stdout, stderr) => {
            if (error) {
                reject(error, stderr);
            } else {
                let data = JSON.parse(stdout);
                let result = []
                data.SPDisplaysDataType.forEach(item => {
                    // console.log(item)
                    let vendor = item.spdisplays_vendor;
                    if(vendor.indexOf('amd')!=-1){
                        vendor = 'AMD';
                    }
                    result.push({
                        name: item.sppci_model,
                        builtin: item.sppci_bus == 'spdisplays_builtin',
                        vendor: vendor,
                        vram: item.spdisplays_vram_shared || item.spdisplays_vram

                    })
                })

                resolve(result);
            }
        }));
    })
}

// this.getGraphics().then(res => {
//     console.log(res)
// })