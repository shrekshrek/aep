import {PropertyValue} from './PropertyValue';
import {fixed} from "../static";

function checkEqual(a, b) {
    if (a && a.length) {
        for (var i in a) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    } else {
        return a === b;
    }
}

function Layer(data, parent) {
    this.data = data;
    this.type = '';

    this.name = data.nm;

    this.size = {width: 0, height: 0};

    this.startFrame = data.st || 0;
    this.inFrame = data.ip;
    this.outFrame = data.op;
    this.curFrame = null;
    this.curSoloFrame = null;
    this.curUpdateFrame = null;

    this.scaleRate = data.sr || 1;

    this.parentLayer = null;
    this.parent = parent;

    this.property = {};
    for (var i in data.tf) {
        if (i === 'p' && data.tf[i].s === true) {
            if (data.tf[i].x) this.property.x = new PropertyValue('x', data.tf[i].x);
            if (data.tf[i].y) this.property.y = new PropertyValue('y', data.tf[i].y);
            if (data.tf[i].z) this.property.z = new PropertyValue('z', data.tf[i].z);
        } else {
            this.property[i] = new PropertyValue(i, data.tf[i]);
        }
    }

    this.visible = false;
    this.positionUpdate = false;
    this.rotateUpdate = false;
    this.needsUpdate = false;
    this.isMoved = false;
    this.isClosed = false;

    this._a = null;
    this._o = null;
    this._s = null;
    this._or = null;
    this._rx = null;
    this._ry = null;
    this._rz = null;
    this._p = null;
    this._x = null;
    this._y = null;
    this._z = null;

    this.onFrameUpdate = null;
}

Object.assign(Layer.prototype, {

    open: function () {
        this.isClosed = false;

        if (this.visible) this._addSelf();

        return this;
    },

    close: function () {
        this.isClosed = true;
        if (this.el.parent) this.el.parent.remove(this.el);
        return this;
    },

    _seekFrame: function (frameId) {
        if (this.isClosed) return;

        if (this.curFrame === frameId) return;
        this.curFrame = frameId;

        if (this.curFrame >= this.inFrame && this.curFrame < this.outFrame) {
            if (!this.visible) {
                this.visible = true;
                this._addSelf();
                this._update(this.curFrame, true);
            } else {
                this._update(this.curFrame, false);
            }

            if (this.layers && !this.isSolo) {
                for (var i = 0, l = this.layers.length; i < l; i++) {
                    var _layer = this.layers[i];
                    if (_layer) _layer._seekFrame((this.curFrame - this.startFrame) / this.scaleRate);
                }
            }
        } else {
            if (this.visible) {
                this.visible = false;
                this._removeSelf();
            }
        }
    },

    _soloFrame: function (step) {
        if (this.visible) {
            var _fid = fixed((this.curSoloFrame + step - this.workStart) % this.workDuration);
            this.curSoloFrame = this.workStart + _fid + (_fid < 0 ? this.workDuration : 0);

            if (this.layers && this.isSolo) {
                for (var i = 0, l = this.layers.length; i < l; i++) {
                    var _layer = this.layers[i];
                    if (_layer) _layer._seekFrame(this.curSoloFrame / this.scaleRate);
                }
            }
        }
    },

    _addSelf: function () {
    },

    _removeSelf: function () {
    },

    _update: function (frameId, isIn) {
        if (this.curUpdateFrame === frameId) return;
        this.curUpdateFrame = frameId;

        this.positionUpdate = false;
        this.rotateUpdate = false;
        this.needsUpdate = false;
        this.isMoved = false;

        if (this.property.o) {
            var _o = this.property.o.update(frameId);
            if (this.parent) {
                _o *= (this.parent._o || 100) / 100;
            }
            if (!checkEqual(this._o, _o)) {
                this._o = _o;
                this._updateO();
            }
        }
        if (this.property.p) {
            var _p = this.property.p.update(frameId);
            if (!checkEqual(this._p, _p)) {
                this.isMoved = true;
                this._p = _p;
                this._x = _p[0];
                this._y = _p[1];
                this._z = _p[2];
                this.positionUpdate = true;
            }
        }
        if (this.property.x) {
            var _x = this.property.x.update(frameId);
            if (!checkEqual(this._x, _x)) {
                this.isMoved = true;
                this._x = _x;
                this.positionUpdate = true;
            }
        }
        if (this.property.y) {
            var _y = this.property.y.update(frameId);
            if (!checkEqual(this._y, _y)) {
                this.isMoved = true;
                this._y = _y;
                this.positionUpdate = true;
            }
        }
        if (this.property.z) {
            var _z = this.property.z.update(frameId);
            if (!checkEqual(this._z, _z)) {
                this.isMoved = true;
                this._z = _z;
                this.positionUpdate = true;
            }
        }

        if (this.positionUpdate) {
            this._updateP();
            this.needsUpdate = true;
        }

        if (this.property.a) {
            var _a = this.property.a.update(frameId);
            if (this.type === 'camera' && this.isMoved || !checkEqual(this._a, _a)) {
                this._a = _a;
                this._updateA();
                this.needsUpdate = true;
            }
        }
        if (this.property.s) {
            var _s = this.property.s.update(frameId);
            if (!checkEqual(this._s, _s)) {
                this._s = _s;
                this._updateS();
                this.needsUpdate = true;
            }
        }
        if (this.property.rx) {
            var _rx = this.property.rx.update(frameId);
            if (!checkEqual(this._rx, _rx)) {
                this._rx = _rx;
                this.rotateUpdate = true;
            }
        }
        if (this.property.ry) {
            var _ry = this.property.ry.update(frameId);
            if (!checkEqual(this._ry, _ry)) {
                this._ry = _ry;
                this.rotateUpdate = true;
            }
        }
        if (this.property.rz) {
            var _rz = this.property.rz.update(frameId);
            if (!checkEqual(this._rz, _rz)) {
                this._rz = _rz;
                this.rotateUpdate = true;
            }
        }
        if (this.property.or) {
            var _or = this.property.or.update(frameId);
            if (!checkEqual(this._or, _or)) {
                this._or = _or;
                this.rotateUpdate = true;
            }
        }

        if (this.rotateUpdate) {
            this._updateR();
            this.needsUpdate = true;
        }


        if (this.needsUpdate) {
            this._updateSelf();
        }

        if (this.parentLayer) {
            this.parentLayer._update(frameId);
            if (this.parentLayer.needsUpdate || this.needsUpdate || isIn) {
                if (!this.needsUpdate) {
                    this._updateSelf();
                    this.needsUpdate = true;
                }
                this._updateFromParent();
            }
        }

    },

    _updateO: function () {
    },

    _updateP: function () {
    },

    _updateA: function () {
    },

    _updateS: function () {
    },

    _updateR: function () {
    },

    _updateSelf: function () {
    },

    _updateFromSelf: function () {
    },

    _updateFromParent: function () {
    },


});

export {Layer};