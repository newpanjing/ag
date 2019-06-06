/*key = 'name';
value = obj[key];
Object.defineProperty(obj, key, {
    set(v) {
        obj[key] = value
    },
    get() {
        return value
    }
});*/

// console.log(obj)
// obj.name = '11111'
// console.log(obj.name)
//
//
// var app = new Nue({
//     data: {
//         name: '123',
//         sex: '321',
//         sub: {
//             name: '33'
//         }
//     },
//     watch: {
//         name: function (newValue, oldValue) {
//             console.log({newValue: newValue, oldValue: oldValue})
//             console.log(this)
//         },
//         'sub.name'(newValue, oldValue) {
//
//         }
//     }
// });
//
// app.name = 2123123123
// console.log(app)


