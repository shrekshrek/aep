var global = {
    author: 'shrek.wang - https://github.com/shrekshrek',
    version: '0.9.0',
    loadOrder: 0,
    alphaTest: 0.05,
    curveSegments: 10,
    lockWidth: false,
    far: 50000,
    near: 1,
    width: 0,
    height: 0,
    frameSegments: 10,
    THREE: THREE
};

function loadJson(url, callback) {
    var _xhr = new XMLHttpRequest();
    _xhr.open('GET', url, true);
    _xhr.onreadystatechange = function () {
        if (_xhr.readyState == 4) {
            if (_xhr.status == 200) {
                callback(JSON.parse(_xhr.responseText));
            }
        }
    };
    _xhr.send();
}

function loadImg(url, callback, param) {
    var _xhr = new XMLHttpRequest();
    _xhr.open('GET', url, true);
    _xhr.responseType = "blob";
    _xhr.onreadystatechange = function () {
        if (_xhr.readyState == 4) {
            if (_xhr.status == 200) {
                var _blob = _xhr.response;
                var _img = document.createElement("img");
                _img.crossOrigin = "anonymous";
                _img.onload = function () {
                    window.URL.revokeObjectURL(_img.src);
                    callback(_img, param);
                };
                _img.src = window.URL.createObjectURL(_blob);

            }
        }
    };
    _xhr.send();
}

var fileNameExp = new RegExp('.+/(.+)$');
var extNameExp = new RegExp('[^\\.]\\w*$');

function loadQueue(arr, progress, complete) {
    var _data = {};
    var _max = arr.length;
    var _count = 0;

    arr.forEach(function (item) {
        var _ext = extNameExp.exec(item)[0];
        var _name = fileNameExp.exec(item)[1];
        switch (_ext) {
            case 'jpeg':
            case 'jpg':
            case 'png':
            case 'gif':
                loadImg(item, function (data) {
                    handler(_name, data);
                });
                break;
            case 'json':
                loadJson(item, function (data) {
                    handler(_name, data);
                });
                break;
        }
    });

    function handler(name, data) {
        _data[name] = data;
        if (++_count >= _max) complete(_data);
        else progress(_count / _max);
    }
}

function loadFullJson(json, base, progress, complete, per) {
    var _data = {};
    var _max = 0;
    var _count = 0;

    loadJson(base + json, function (data) {
        _max = (per ? Math.floor(data.images.length * per) : data.images.length) + 1;
        handler(json, data);

        data.images.forEach(function (item2, index) {
            if (index < _max - 1) {
                loadImg(base + item2.u + item2.p, function (data2) {
                    handler(item2.p, data2);
                });
            }
        })
    });

    function handler(name, data) {
        _data[name] = data;
        if (++_count >= _max) complete(_data);
        else progress(_count / _max);
    }
}

function fixed(n) {
    return Math.floor(n * global.frameSegments) / global.frameSegments;
}


export {
    global,
    loadJson,
    loadImg,
    loadQueue,
    loadFullJson,
    fixed
};