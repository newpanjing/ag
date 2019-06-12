(function () {
    const {ipcRenderer, net} = require('electron')
    const axios = require('axios');
    window.app = new Vue({
        el: '#app',
        data: {
            tabs: '0',
            website: 'https://newpanjing.github.io/ag/',
            payurl: 'https://www.88cto.com',
            sn: null,
            version: null,
            checking: false,
            update: true,
            power: null,
            dialog: {
                name: '',
                download: '',
                body: '',
                created_at: '',
                version: '',
                show: false
            },
            modelData: [{
                name: '集显',
                value: 0
            }, {
                name: '独显',
                value: 1
            }],
            powerData: [{
                name: '自动',
                value: 0
            }, {
                name: '手动',
                value: 1
            }],
            settings: {
                statusText: true,
                touchBar: true,
                model: {
                    type: 0,
                    value: 0

                },
                radio: 0,
            }
        },
        watch: {
            settings: {
                deep: true,
                handler(newValue, oldValue) {
                    console.log(newValue)
                    //将值发送的主进程处理
                    ipcRenderer.send('settings', newValue);
                }
            }
        },
        methods: {
            openSite(site) {
                ipcRenderer.send('openUrl', site);
            },
            download() {
                ipcRenderer.sendSync('command', {
                    name: 'download',
                    data: this.dialog.download
                });
            },
            restart() {
                ipcRenderer.send('restart');
            },
            check() {

                this.checking = true;
                axios.get('https://api.github.com/repos/newpanjing/ag/releases/latest')
                    .then(res => {
                        console.log(res.data)

                        let data = res.data;
                        let isUpdate = this.compare(data.tag_name);
                        if (isUpdate) {
                            this.dialog.show = true;
                            this.dialog.name = data.name;
                            this.dialog.download = data.zipball_url;
                            this.dialog.body = data.body;
                            this.dialog.created_at = data.created_at;
                            this.dialog.version = data.tag_name;

                        } else {
                            this.update = false;
                        }
                        console.log(isUpdate)
                    }).catch(err => {
                    this.$notify.error({
                        title: '错误',
                        message: '版本检查失败，请确定是否能访问Github.com。详细错误：' + err
                    });
                }).finally(() => {
                    this.checking = false;
                });

            }, compare(latest) {
                let current = this.version;
                var a = current.split(/\./);
                var b = latest.split(/\./);
                var len = a.length - b.length;
                var type = 1;
                if (len > 0) {
                    type = 2;
                } else if (len < 0) {
                    type = 1;
                }
                len = Math.abs(len);
                for (var i = 0; i < len; i++) {
                    type == 1 ? a.push('0') : b.push('0');
                }

                for (var k = 0; k < a.length; k++) {
                    var d = a[k].charCodeAt(0), c = b[k].charCodeAt(0)

                    if (d == c) {
                        continue
                    }
                    return c > d;
                }
                return false
            }

        },
        created() {

            var serialno = require('./js/serialno')
            serialno.get().then(res => this.sn = res);
            this.version = ipcRenderer.sendSync('command', {
                name: 'version'
            });

            ipcRenderer.send('register', function (data) {
                console.log('data')
            })
            ipcRenderer.on('data', (e, r) => {
                console.log('r:' + r)
                this.power = r == 'AC Power' ? '电源供电' : '电池供电'
            })
            let sets = ipcRenderer.sendSync('command', {
                name: 'settings'
            });
            if (sets && sets['model']) {
                this.settings = sets;
            }
            ipcRenderer.on('switchTab', (event, tabIndex) => {
                this.tabs = tabIndex + "";
            })
            ipcRenderer.on('checkVersion', () => {
                this.check();
            });


        }
    })
})();
