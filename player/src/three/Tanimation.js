import {Timeline} from '../core/Timeline';
import {Tcomp} from "./Tcomp";
import {global, loadImg} from "../static";

function Tanimation(data, params) {
    if (data.git.indexOf('shrek') == -1 && global.author.indexOf('shrek') == -1) return;

    this.path = params && params.path;
    this.imageAssets = {};
    this.compAssets = {};

    this.assets = params && params.assets || {};
    this._initImages(data.images);
    this._initComps(data.comps);

    Tcomp.call(this, data, null, data, this.imageAssets, this.compAssets);
    Timeline.call(this, data, params);

    this.type = 'animation';

    this.defaultZ = 2666;
    this.defaultCamera = new global.THREE.PerspectiveCamera(75, global.width / global.height, global.near, global.far);
    this.defaultCamera.position.set(0, 0, this.defaultZ);

    this.activeCamera = this.defaultCamera;
    this.setSize(params.width || window.innerWidth, params.height || window.innerHeight);
}

Tanimation.prototype = Object.assign(Object.create(Tcomp.prototype), Timeline.prototype, {
    constructor: Tanimation,

    _update: function (frameId, isIn) {
    },

    _initImages: function (data) {
        if (global.loadOrder === 0) {
            for (var i = 0, len = data.length; i < len; i++) {
                var _data = data[i];
                this.imageAssets[_data.id] = _data;
            }
        } else {
            for (var i = data.length - 1; i >= 0; i--) {
                var _data = data[i];
                this.imageAssets[_data.id] = _data;
            }
        }

        for (var i in this.imageAssets) {
            var _asset = this.imageAssets[i];
            var _texture = new global.THREE.Texture();
            if (this.assets[this.imageAssets[i].p]) {
                _texture.image = this.assets[this.imageAssets[i].p];
                _texture.needsUpdate = true;
            } else {
                loadImg(this.path + _asset.u + _asset.p, function (img, texture) {
                    texture.image = img;
                    texture.needsUpdate = true;
                }, _texture);
            }
            _texture.needsUpdate = false;
            _asset.texture = _texture;
        }
    },

    _initComps: function (data) {
        for (var i = 0, len = data.length; i < len; i++) {
            var _data = data[i];
            this.compAssets[_data.id] = _data;
        }
    },

    setSize: function (width, height) {
        global.width = width;
        global.height = height;

        Tcomp.prototype.setSize.call(this);

        var _h = global.lockWidth ? this.size.width * global.height / global.width : this.size.height;
        var _fov = Math.atan(_h / 2 / this.defaultZ) * 2 / Math.PI * 180;
        this.defaultCamera.fov = _fov;
        this.defaultCamera.aspect = global.width / global.height;
        this.defaultCamera.updateProjectionMatrix();
    },

});


export {Tanimation};
