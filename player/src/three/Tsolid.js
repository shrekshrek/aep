import {Tobject} from './Tobject';
import {global} from '../static';

function Tsolid(data, parentComp) {
    Tobject.call(this, data, parentComp);

    this.type = 'solid';

    this.size = {width:data.sw, height:data.sh};
    this.mat = new global.THREE.MeshBasicMaterial({
        color: Number('0x' + data.sc.substring(1)),
        side: global.THREE.DoubleSide,
        transparent: true
    });
    this.geo = new global.THREE.PlaneBufferGeometry(this.size.width, this.size.height, 1, 1);
    this.el = new global.THREE.Mesh(this.geo, this.mat);
    this.el.le = this;
    this.el.matrixAutoUpdate = false;
}


Tsolid.prototype = Object.assign(Object.create(Tobject.prototype), {
    constructor: Tsolid,

});


export {Tsolid};