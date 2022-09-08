import {Tobject} from './Tobject';
import {Timage} from "./Timage";
import {Tsolid} from "./Tsolid";
import {Tnull} from "./Tnull";
import {Tcamera} from "./Tcamera";
import {global} from '../static';

function Tcomp(data, parent, refData, images, comps) {
    Tobject.call(this, data, parent);

    this.type = 'comp';

    this.imageAssets = images;
    this.compAssets = comps;

    this.size = {width: data.w, height: data.h};
    this.el = new global.THREE.Group();
    this.el.le = this;
    this.el.matrixAutoUpdate = false;

    this.workStart = data.ws;
    this.workDuration = data.wd;
    this.isSolo = false;

    this.layers = [];

    this.cameras = [];
    this.activeCamera = null;

    this._initLayers(refData.layers);
}

Tcomp.prototype = Object.assign(Object.create(Tobject.prototype), {
    constructor: Tcomp,

    _updateO: function (_curData, _lastData) {
    },

    _initLayers: function (data) {
        var _self = this;
        for (var i = 0, l = data.length; i < l; i++) {
            var _data = data[i];
            switch (_data.ty) {
                case 1://camera
                    var _camera = new Tcamera(_data, this);
                    this.layers[_data.ind - 1] = _camera;
                    this.cameras.push(_camera);
                    _camera._addSelf = function () {
                        _self.activeCamera = this.el;
                        _self._addCamera(this.el);
                        if (this.onAdd) this.onAdd.call(this);
                    };
                    _camera._removeSelf = function () {
                        if (_self.activeCamera == this.el) _self.activeCamera = null;
                        _self._removeCamera(this.el);
                        if (this.onRemove) this.onRemove.call(this);
                    };
                    break;
                case 14://comp
                    var _comp = new Tcomp(_data, this, this.compAssets[_data.refId], this.imageAssets, this.compAssets);
                    this.layers[_data.ind - 1] = _comp;
                    _comp._addSelf = function () {
                        if (this.activeCamera) _self.activeCamera = this.activeCamera;
                        _self.el.add(this.el);
                        if (this.onAdd) this.onAdd.call(this);
                    };
                    _comp._removeSelf = function () {
                        if (_self.activeCamera == this.activeCamera) _self.activeCamera = _self.defaultCamera || null;
                        _self.el.remove(this.el);
                        if (this.onRemove) this.onRemove.call(this);
                    };
                    _comp._addCamera = function (camera) {
                        _self._addCamera(camera);
                    };
                    _comp._removeCamera = function (camera) {
                        _self._removeCamera(camera);
                    };
                    break;
                case 13://solid
                    var _solid = new Tsolid(_data, this);
                    this.layers[_data.ind - 1] = _solid;
                    _solid._addSelf = function () {
                        _self.el.add(this.el);
                        if (this.onAdd) this.onAdd.call(this);
                    };
                    _solid._removeSelf = function () {
                        _self.el.remove(this.el);
                        if (this.onRemove) this.onRemove.call(this);
                    };
                    break;
                case 12://image
                    var _image = new Timage(_data, this, this.imageAssets[_data.refId]);
                    this.layers[_data.ind - 1] = _image;
                    _image._addSelf = function () {
                        _self.el.add(this.el);
                        if (this.onAdd) this.onAdd.call(this);
                    };
                    _image._removeSelf = function () {
                        _self.el.remove(this.el);
                        if (this.onRemove) this.onRemove.call(this);
                    };
                    break;
                case 11://nullLayer
                    var _null = new Tnull(_data, this);
                    this.layers[_data.ind - 1] = _null;
                    _null._addSelf = function () {
                        _self.el.add(this.el);
                        if (this.onAdd) this.onAdd.call(this);
                    };
                    _null._removeSelf = function () {
                        _self.el.remove(this.el);
                        if (this.onRemove) this.onRemove.call(this);
                    };
                    break;
            }
        }

        for (var i = 0, l = this.layers.length; i < l; i++) {
            var _layer = this.layers[i];
            if (_layer && _layer.data.parent) _layer.parentLayer = this.layers[_layer.data.parent - 1];
        }
    },

    findByName: function (name) {
        var _result = [];

        if (Array.isArray(name)) {
            for (var i = 0, l = name.length; i < l; i++) {
                _result = _result.concat(this.findByName(name[i]));
            }
        } else {
            for (var i = 0, l = this.layers.length; i < l; i++) {
                var _layer = this.layers[i];
                if (_layer && _layer.name === name) _result.push(_layer);
                if (_layer && _layer.type === 'comp') {
                    _result = _result.concat(_layer.findByName(name));
                }
            }
        }

        return _result;
    },

    findContainName: function (name) {
        var _result = [];

        if (Array.isArray(name)) {
            for (var i = 0, l = name.length; i < l; i++) {
                _result = _result.concat(this.findContainName(name[i]));
            }
        } else {
            for (var i = 0, l = this.layers.length; i < l; i++) {
                var _layer = this.layers[i];
                if (_layer && _layer.name.indexOf(name) != -1) _result.push(_layer);
                if (_layer && _layer.type === 'comp') {
                    _result = _result.concat(_layer.findContainName(name));
                }
            }
        }

        return _result;
    },

    findByRef: function (name) {
        var _result = [];

        if (Array.isArray(name)) {
            for (var i = 0, l = name.length; i < l; i++) {
                _result = _result.concat(this.findByRef(name[i]));
            }
        } else {
            for (var i = 0, l = this.layers.length; i < l; i++) {
                var _layer = this.layers[i];
                if (_layer && _layer.data.refId && _layer.data.refId === name) _result.push(_layer);
                if (_layer && _layer.type === 'comp') {
                    _result = _result.concat(_layer.findByRef(name));
                }
            }
        }

        return _result;
    },

    findContainRef: function (name) {
        var _result = [];

        if (Array.isArray(name)) {
            for (var i = 0, l = name.length; i < l; i++) {
                _result = _result.concat(this.findContainRef(name[i]));
            }
        } else {
            for (var i = 0, l = this.layers.length; i < l; i++) {
                var _layer = this.layers[i];
                if (_layer && _layer.data.refId && _layer.data.refId.indexOf(name) != -1) _result.push(_layer);
                if (_layer && _layer.type === 'comp') {
                    _result = _result.concat(_layer.findContainRef(name));
                }
            }
        }

        return _result;
    },

    _addCamera: function (camera) {
        this.activeCamera = camera;
    },

    _removeCamera: function (camera) {
        if (this.activeCamera == camera) this.activeCamera = this.defaultCamera;
    },

    setSize: function () {
        var _h = global.lockWidth ? this.size.width * global.height / global.width : this.size.height;
        for (var i = 0, l = this.cameras.length; i < l; i++) {
            var _camera = this.cameras[i];
            var _fov = Math.atan(_h / 2 / _camera.data.pe.k) * 2 / Math.PI * 180;
            _camera.el.fov = _fov;
            _camera.el.aspect = global.width / global.height;
            _camera.el.updateProjectionMatrix();
        }

        for (var i = 0, l = this.layers.length; i < l; i++) {
            var _layer = this.layers[i];
            if (_layer && _layer.type == 'comp') {
                _layer.setSize();
            }
        }
    }

});


export {Tcomp};