function compare(current, latest) {

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

var current = '2.2.a';
var latest = '2.2.b';

console.log(compare(current, latest))


