import {BezierFactory} from '../bezier/BezierFactory';
import {bez} from '../bezier/bez';

function KeyValues(data) {
    this.data = data;
    this.frames = [];
    this.easings = [];
    this.beziers = [];
}

Object.assign(KeyValues.prototype, {
    update: function (frameId) {
        if (this.frames[frameId]) return this.frames[frameId];

        for (var len = this.data.length, i = len - 1; i >= 0; i--) {
            var _data = this.data[i];

            if (frameId >= _data.t) {
                if (i == len - 1) {
                    this.frames[frameId] = this.data[i - 1].e;
                } else {
                    if (this.easings[i] === undefined) {
                        if (_data.o.x.constructor === Array) {
                            var _a = [];
                            for (var j in _data.o.x) {
                                _a[j] = BezierFactory.getBezierEasing(_data.o.x[j], _data.o.y[j], _data.i.x[j], _data.i.y[j], _data.n[j]).get;
                            }
                            this.easings[i] = _a;
                        } else {
                            this.easings[i] = BezierFactory.getBezierEasing(_data.o.x, _data.o.y, _data.i.x, _data.i.y, _data.n).get;
                        }
                    }
                    var _easing = this.easings[i];

                    var _perc = (frameId - _data.t) / (this.data[i + 1].t - _data.t);

                    var _frame = [];

                    if (_data.to) {
                        if (this.beziers[i] === undefined) {
                            this.beziers[i] = bez.buildBezierData(_data, this.data[i + 1].t - _data.t);
                        }
                        var _bezier = this.beziers[i];

                        for (var k in _data.s) {
                            var _eperc = _easing.constructor === Array ? _easing[k](_perc) : _easing(_perc);
                            var _distanceInLine = _bezier.segmentLength * _eperc;

                            var _curPointId = 1;
                            for (var len2 = _bezier.points.length, m = 0; m < len2; m++) {
                                if (_distanceInLine < _bezier.points[m].length) {
                                    _curPointId = m;
                                    break;
                                }
                            }

                            var _ptPerc = _bezier.points[_curPointId].ptDistance != 0 ? (_distanceInLine - _bezier.points[_curPointId - 1].length) / _bezier.points[_curPointId].ptDistance : 0;
                            _frame[k] = _bezier.points[_curPointId].point[k] * _ptPerc + _bezier.points[_curPointId - 1].point[k] * (1 - _ptPerc);
                        }

                    } else {
                        for (var k in _data.s) {
                            var _p0 = _data.s;
                            var _p1 = _data.e;
                            var _eperc = _easing.constructor === Array ? _easing[k](_perc) : _easing(_perc);
                            _frame[k] = _p0[k] + (_p1[k] - _p0[k]) * _eperc;
                        }
                    }

                    this.frames[frameId] = _frame;
                }
                return this.frames[frameId];
            }
        }

        this.frames[frameId] = this.data[0].s;
        return this.frames[frameId];
    },

});

export {KeyValues};