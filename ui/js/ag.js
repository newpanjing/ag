(function () {
    const {ipcRenderer, net} = require('electron')
    const axios = require('axios');
    new Vue({
        el: '#app',
        data: {
            sn: null,
            version: null,
            checking: false,
            update: true,
            dialog: {
                name: '',
                download: '',
                body: '',
                created_at: '',
                version: '',
                show: false
            }
        },
        methods: {
            download() {
                ipcRenderer.sendSync('command', {
                    name: 'download',
                    data: this.dialog.download
                });
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
        }
    })
})();
