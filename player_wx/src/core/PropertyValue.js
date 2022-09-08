import {KeyValues} from './KeyValues';

function adjustOrient(data) {
    for (var j in data.k) {
        var _key = data.k[j];
        for (var i in _key.s) {
            _key.to[i] = _key.ti[i] = 0;
            if (_key.e[i] - _key.s[i] > 180) {
                _key.s[i] += 360;
            }
            if (_key.e[i] - _key.s[i] < -180) {
                _key.s[i] -= 360;
            }
        }
    }
}

function PropertyValue(name, data) {
    this.name = name;

    this.isAnim = data.a === 1;

    if (this.name == 'or' && this.isAnim) {
        adjustOrient(data);
    }

    if (this.isAnim) this.keys = new KeyValues(data.k);
    else this.value = data.k;
}

Object.assign(PropertyValue.prototype, {
    update: function (frameId) {
        if (this.isAnim) return this.keys.update(frameId);
        else return this.value;
    },

});

export {PropertyValue};