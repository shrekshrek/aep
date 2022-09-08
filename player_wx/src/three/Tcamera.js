import {Tobject} from './Tobject';
import {global} from "../static";

function Tcamera(data, parent) {
    Tobject.call(this, data, parent);

    this.type = 'camera';

    this.target = null;

    var _h = global.lockWidth ? this.parent.size.width * global.height / global.width : this.parent.size.height;
    var _fov = Math.atan(_h / 2 / data.pe.k) * 2 / Math.PI * 180;
    this.el = new global.THREE.PerspectiveCamera(_fov, global.width / global.height, global.near, global.far);
    this.el.le = this;
    this.el.matrixAutoUpdate = false;

    this.rotateEuler = new global.THREE.Euler();
    this.rotateQuat = new global.THREE.Quaternion();
}


Tcamera.prototype = Object.assign(Object.create(Tobject.prototype), {
    constructor: Tcamera,

    _updateA: function () {
        if (this.target == null) this.target = new global.THREE.Vector3(0, 0, 0);
        this.target.set(this._a[0] - this.parent.size.width / 2, -this._a[1] + this.parent.size.height / 2, -this._a[2]);
        this.rotateUpdate = true;
    },

    _updateR: function () {
        if (this.target) {
            this.el.lookAt(this.target);
            this.rotateEuler.set(this._rx * Tobject.Radian, -this._ry * Tobject.Radian, -this._rz * Tobject.Radian);
            this.rotateQuat.setFromEuler(this.rotateEuler, false);
            this.el.quaternion.premultiply(this.rotateQuat);
        } else {
            this.el.rotation.set(this._rx * Tobject.Radian, -this._ry * Tobject.Radian, -this._rz * Tobject.Radian);
        }

        if (this._or[0] !== 0 || this._or[1] !== 0 || this._or[2] !== 0) {
            this.orientEuler.set(this._or[0] * Tobject.Radian, -this._or[1] * Tobject.Radian, -this._or[2] * Tobject.Radian);
            this.orientQuat.setFromEuler(this.orientEuler, false);
            this.el.quaternion.premultiply(this.orientQuat);
        }
    },

});


export {Tcamera};