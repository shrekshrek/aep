import {Tobject} from './Tobject';
import {global} from '../static';

function Timage(data, parentComp, image) {
    Tobject.call(this, data, parentComp);

    this.type = 'image';

    this.image = image;

    this.size = {width: this.image.w, height: this.image.h};
    this.mat = new global.THREE.MeshBasicMaterial({
        map: this.image.texture,
        side: global.THREE.DoubleSide,
        transparent: true,
        alphaTest: global.alphaTest
    });
    this.geo = new global.THREE.PlaneBufferGeometry(this.size.width, this.size.height, 1, 1);

    this.el = new global.THREE.Mesh(this.geo, this.mat);
    this.el.le = this;
    this.el.matrixAutoUpdate = false;
}


Timage.prototype = Object.assign(Object.create(Tobject.prototype), {
    constructor: Timage,

});


export {Timage};