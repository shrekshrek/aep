import {Layer} from '../core/Layer';
import {global} from '../static';

function Tobject(data, parent) {
    Layer.call(this, data, parent);

    this.orientEuler = new global.THREE.Euler();
    this.orientQuat = new global.THREE.Quaternion();

    this.anchorMatrix = new global.THREE.Matrix4();
}

Tobject.Radian = Math.PI / 180;

Tobject.prototype = Object.assign(Object.create(Layer.prototype), {
    constructor: Tobject,

    _updateO: function () {
        this.mat.opacity = this._o / 100;
    },

    _updateP: function () {
        var _pw = this.parent ? this.parent.size.width : 0;
        var _ph = this.parent ? this.parent.size.height : 0;
        this.el.position.set(this._x - _pw / 2, -this._y + _ph / 2, -this._z);
    },

    _updateA: function () {
        this.anchorMatrix.makeTranslation(-this._a[0] + this.size.width / 2, this._a[1] - this.size.height / 2, this._a[2]);
    },

    _updateS: function () {
        this.el.scale.set(this._s[0] / 100, this._s[1] / 100, this._s[2] / 100);
    },

    _updateR: function () {
        this.el.rotation.set(this._rx * Tobject.Radian, -this._ry * Tobject.Radian, -this._rz * Tobject.Radian);
        if (this._or[0] !== 0 || this._or[1] !== 0 || this._or[2] !== 0) {
            this.orientEuler.set(this._or[0] * Tobject.Radian, -this._or[1] * Tobject.Radian, -this._or[2] * Tobject.Radian);
            this.orientQuat.setFromEuler(this.orientEuler, false);
            this.el.quaternion.premultiply(this.orientQuat);
        }
    },

    _updateSelf: function () {
        this.el.updateMatrix();
        if (this.type != 'camera') this.el.matrix.multiplyMatrices(this.el.matrix, this.anchorMatrix);
    },

    _updateFromParent: function () {
        var _pw = this.parent ? this.parent.size.width : 0;
        var _ph = this.parent ? this.parent.size.height : 0;
        this.el.matrix.elements[12] += _pw / 2 - this.parentLayer.size.width / 2;
        this.el.matrix.elements[13] -= _ph / 2 - this.parentLayer.size.height / 2;
        this.el.matrix.multiplyMatrices(this.parentLayer.el.matrix, this.el.matrix);
        this.el.matrixWorldNeedsUpdate = true;
    },

});


export {Tobject};