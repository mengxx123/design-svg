Object.prototype.DeepCopy = function () {
    var obj, i;
    obj = {};

    for (attr in this) {
        if (this.hasOwnProperty(attr)) {
            if (typeof(this[attr]) === "object") {
                if (this[attr] === null) {
                    obj[attr] = null;
                }
                else if (Object.prototype.toString.call(this[attr]) === '[object Array]') {
                    obj[attr] = [];
                    for (i=0; i<this[attr].length; i++) {
                        obj[attr].push(this[attr][i].DeepCopy());
                    }
                } else {
                    obj[attr] = this[attr].DeepCopy();
                }
            } else {
                obj[attr] = this[attr];
            }
        }
    }
    return obj;
}

export default storage
