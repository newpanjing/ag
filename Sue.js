class Sue {
    constructor(options) {
        let data = options.data;
        if (typeof (data) == 'function') {
            data = data.call(this);
        }
        let self = this;

        for (let key in data) {
            self[key] = data[key];
        }
        //创建vm部分
        if (options.watch) {
            let watch = options.watch;
            for (let key in watch) {
                let callback = watch[key];
                let obj = self.getObject(key);
                this.define(obj, key, callback);
            }
            this['$watch'] = options.watch;
        }
    }

    getObject(key) {
        var self = this;
        var result = self;
        var fields = key.split('.');
        if (fields.length > 1) {
            for (let i = 0; i < fields.length - 1; i++) {
                let field = fields[i];
                result = result[field];
                if (typeof (result) == "undefined") {
                    throw new Error(`field:'${field}' is not found in data.`);
                }
            }
        }
        return result;
    }

    define(obj, field, callback) {
        var self = this;

        (function (obj, field) {
            var value = undefined;
            Object.defineProperty(obj, field, {
                set(v) {
                    callback.call(self, v, value);
                    value = v
                },
                get() {
                    return value;
                }
            })
        })(obj, field);

    }
}

exports.Sue = Sue;