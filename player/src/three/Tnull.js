import {Tobject} from './Tobject';
import {global} from '../static';

function Tnull(data, parentComp) {
    Tobject.call(this, data, parentComp);

    this.type = 'null object';

    this.el = new global.THREE.Object3D();
    this.el.le = this;
    this.el.matrixAutoUpdate = false;
}


Tnull.prototype = Object.assign(Object.create(Tobject.prototype), {
    constructor: Tnull,

    _updateO: function (_curData, _lastData) {
    },

});


export {Tnull};