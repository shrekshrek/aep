(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.AEP = {}));
}(this, (function (exports) { 'use strict';

    var global = {
        author: 'shrek.wang - https://github.com/shrekshrek',
        version: '0.10.0',
        loadOrder: 0,
        alphaTest: 0.05,
        curveSegments: 10,
        lockWidth: false,
        far: 50000,
        near: 1,
        width: 0,
        height: 0,
        frameSegments: 10,
        canvas: null,
        THREE: null
    };

    //替换成淘宝小程序版
    function loadJson(url, callback) {
        // my.request({
        //     url: url,
        //     success(res) {
        //         callback(res.data);
        //     }
        // })

        my.downloadFile({
            url: url,
            success({apFilePath}) {
                my.getFileSystemManager().readFile({
                    filePath: apFilePath,
                    success(res) {
                        callback(JSON.parse(res.data));
                    }
                });
            }
        });
    }

    //替换成淘宝小程序版
    function loadImg(url, callback, param) {
        var _img = global.canvas.createImage();
        _img.onload = _img.onerror = function () {
            callback(_img, param);
        };
        _img.src = url;
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
            });
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

    function bindScopedCanvas(canvas) {
        global.canvas = canvas;
        global.width = canvas.width;
        global.height = canvas.height;
    }

    // --------------------------------------------------------------------全局update
    Date.now = (Date.now || function () {
        return new Date().getTime();
    });

    var nowOffset = Date.now();

    function now() {
        return Date.now() - nowOffset;
    }

    var timelines = [];
    var tempTimelines = [];
    var soloTimelines = [];
    var tempSoloTimelines = [];
    var isUpdating = false;
    var lastTime = 0;

    function globalUpdate() {
        var _len = timelines.length;
        var _len2 = soloTimelines.length;
        if (_len === 0 && _len2 === 0) {
            isUpdating = false;
            return;
        }

        var _now = now();
        var _step = _now - lastTime;
        lastTime = _now;
        if (_step > 500) _step = 33;

        tempTimelines = timelines.slice(0);
        for (var i = 0; i < _len; i++) {
            var _timeline = tempTimelines[i];
            if (_timeline && _timeline.isPlaying && !_timeline._updateTime(_step)) _timeline.pause();
        }

        tempSoloTimelines = soloTimelines.slice(0);
        for (var j = 0; j < _len2; j++) {
            var _soloTimeline = tempSoloTimelines[j];
            if (_soloTimeline && _soloTimeline.isSoloPlaying) _soloTimeline._updateSoloTime(_step);
        }

        global.canvas.requestAnimationFrame(globalUpdate);
    }


    // --------------------------------------------------------------------Timeline
    function Timeline(data, params) {
        this._frameRate = 0;
        this._frameStep = 0;
        this.totalTime = 0;
        this.curTime = null;
        this.lastTime = null;
        this.timeScale = 1;

        this.isPlaying = false;
        this.isReverse = false;

        this.isSoloPlaying = false;
        this.soloItems = null;

        this.loop = params.loop || false;

        this.isSeek = false;
        this.isKeep = false;

        this.setFrameRate(data.fr);

        this.onStart = params.onStart || null;
        this.onEnd = params.onEnd || null;
        this.onUpdate = params.onUpdate || null;
    }


    Object.assign(Timeline.prototype, {
        _updateTime: function (time) {
            this.isKeep = false;

            time = (this.isReverse ? -1 : 1) * time * this.timeScale;
            var _lastTime = this.curTime;
            if (this.loop) {
                if (this.curTime === 0 && time < 0) _lastTime = this.totalTime;
                else if (this.curTime === this.totalTime && time > 0) _lastTime = 0;
            }
            var _curTime = Math.min(this.totalTime, Math.max(0, _lastTime + time));

            if (_curTime === this.curTime) return true;

            this.lastTime = _lastTime;
            this.curTime = _curTime;

            var _fid = fixed(this.curTime / this._frameStep);
            this._seekFrame(_fid + this.inFrame);
            if (!this.isSeek && this.onUpdate) this.onUpdate(time);

            if (this.lastTime < this.curTime) {
                if (this.lastTime <= 0 && this.curTime > 0) {
                    if (!this.isSeek && this.onStart) this.onStart();
                }

                if (this.lastTime < this.totalTime && this.curTime >= this.totalTime) {
                    if (!this.isSeek && this.onEnd) this.onEnd();
                    return this.loop || this.isKeep;
                }
            } else {
                if (this.lastTime >= this.totalTime && this.curTime < this.totalTime) {
                    if (!this.isSeek && this.onEnd) this.onEnd();
                }

                if (this.lastTime > 0 && this.curTime <= 0) {
                    if (!this.isSeek && this.onStart) this.onStart();
                    return this.loop || this.isKeep;
                }
            }

            return true;
        },

        _updateSoloTime: function (time) {
            time = (this.isReverse ? -1 : 1) * time * this.timeScale;
            for (var i = 0, l = this.soloItems.length; i < l; i++) {
                this.soloItems[i]._soloFrame(time / this._frameStep);
            }
            if (!this.isPlaying && !this.isSeek && this.onUpdate) this.onUpdate(time);
        },

        getFrameRate: function () {
            return this._frameRate;
        },
        setFrameRate: function (value) {
            this._frameRate = value;
            this._frameStep = 1000 / this._frameRate;
            this.totalTime = this._frameStep * (this.outFrame - this.inFrame);
        },

        seek: function (time, isSeek) {
            var _time = Math.max(0, Math.min(this.totalTime, time));
            if (this.curTime === _time) return;

            this.isSeek = isSeek || false;
            this._updateTime((this.isReverse ? -1 : 1) * (_time - this.curTime));
            this.isSeek = false;
        },

        prev: function () {
            this.seek(this.curTime - this._frameStep);
        },

        next: function () {
            this.seek(this.curTime + this._frameStep);
        },

        play: function (position) {
            this.isReverse = false;
            if (position !== undefined) this.seek(position, true);

            if (!this.loop && this.curTime === this.totalTime) return this.isKeep = false;
            else this.isKeep = true;

            if (this.isPlaying) return;
            this.isPlaying = true;
            this._addTimeline();
        },

        pause: function () {
            this.isKeep = false;

            if (!this.isPlaying) return;
            this.isPlaying = false;
            this._removeTimeline();
        },

        stop: function () {
            this.pause();
            this.curTime = 0;
        },

        reverse: function (position) {
            this.isReverse = true;
            if (position !== undefined) this.seek(position, true);

            if (!this.loop && this.curTime === 0) return this.isKeep = false;
            else this.isKeep = true;

            if (this.isPlaying) return;
            this.isPlaying = true;
            this._addTimeline();
        },

        _addTimeline: function () {
            timelines.push(this);

            if (!isUpdating) {
                lastTime = now();
                isUpdating = true;
                global.canvas.requestAnimationFrame(globalUpdate);
            }
        },

        _removeTimeline: function () {
            var i = timelines.indexOf(this);
            if (i !== -1) timelines.splice(i, 1);
        },

        solo: function (items) {
            if (this.soloItems) {
                for (var i = 0, l = this.soloItems.length; i < l; i++) {
                    this.soloItems[i].isSolo = false;
                }
                this.soloItems = null;
                this.pauseSolo();
            }

            if (items && items.length) {
                this.soloItems = [];
                for (var i = 0, l = items.length; i < l; i++) {
                    if (items[i].type == 'comp') {
                        items[i].isSolo = true;
                        this.soloItems.push(items[i]);
                    }
                }
                this.playSolo();
            } else if (items && items.type == 'comp') {
                items.isSolo = true;
                this.soloItems = [items];
                this.playSolo();
            }
        },

        playSolo: function () {
            if (this.isSoloPlaying || !this.soloItems) return;
            this.isSoloPlaying = true;
            this._addSoloTimeline();
        },

        pauseSolo: function () {
            if (!this.isSoloPlaying) return;
            this.isSoloPlaying = false;
            this._removeSoloTimeline();
        },

        _addSoloTimeline: function () {
            soloTimelines.push(this);

            if (!isUpdating) {
                lastTime = now();
                isUpdating = true;
                global.canvas.requestAnimationFrame(globalUpdate);
            }
        },

        _removeSoloTimeline: function () {
            var i = soloTimelines.indexOf(this);
            if (i !== -1) soloTimelines.splice(i, 1);
        },


    });

    var BezierFactory = (function () {
        /**
         * BezierEasing - use bezier curve for transition easing function
         * by Gaëtan Renaudeau 2014 - 2015 – MIT License
         *
         * Credits: is based on Firefox's nsSMILKeySpline.cpp
         * Usage:
         * var spline = BezierEasing([ 0.25, 0.1, 0.25, 1.0 ])
         * spline.get(x) => returns the easing value | x must be in [0, 1] range
         *
         */

        var ob = {};
        ob.getBezierEasing = getBezierEasing;
        var beziers = {};

        function getBezierEasing(a, b, c, d, nm) {
            var str = nm || ('bez_' + a + '_' + b + '_' + c + '_' + d).replace(/\./g, 'p');
            if (beziers[str]) {
                return beziers[str];
            }
            var bezEasing = new BezierEasing([a, b, c, d]);
            beziers[str] = bezEasing;
            return bezEasing;
        }

    // These values are established by empiricism with tests (tradeoff: performance VS precision)
        var NEWTON_ITERATIONS = 4;
        var NEWTON_MIN_SLOPE = 0.001;
        var SUBDIVISION_PRECISION = 0.0000001;
        var SUBDIVISION_MAX_ITERATIONS = 10;

        var kSplineTableSize = 11;
        var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

        var float32ArraySupported = typeof Float32Array === "function";

        function A(aA1, aA2) {
            return 1.0 - 3.0 * aA2 + 3.0 * aA1;
        }

        function B(aA1, aA2) {
            return 3.0 * aA2 - 6.0 * aA1;
        }

        function C(aA1) {
            return 3.0 * aA1;
        }

    // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
        function calcBezier(aT, aA1, aA2) {
            return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
        }

    // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
        function getSlope(aT, aA1, aA2) {
            return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
        }

        function binarySubdivide(aX, aA, aB, mX1, mX2) {
            var currentX, currentT, i = 0;
            do {
                currentT = aA + (aB - aA) / 2.0;
                currentX = calcBezier(currentT, mX1, mX2) - aX;
                if (currentX > 0.0) {
                    aB = currentT;
                } else {
                    aA = currentT;
                }
            } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
            return currentT;
        }

        function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
            for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
                var currentSlope = getSlope(aGuessT, mX1, mX2);
                if (currentSlope === 0.0) return aGuessT;
                var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
                aGuessT -= currentX / currentSlope;
            }
            return aGuessT;
        }

        /**
         * points is an array of [ mX1, mY1, mX2, mY2 ]
         */
        function BezierEasing(points) {
            this._p = points;
            this._mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
            this._precomputed = false;

            this.get = this.get.bind(this);
        }

        BezierEasing.prototype = {

            get: function (x) {
                var mX1 = this._p[0],
                    mY1 = this._p[1],
                    mX2 = this._p[2],
                    mY2 = this._p[3];
                if (!this._precomputed) this._precompute();
                if (mX1 === mY1 && mX2 === mY2) return x; // linear
                // Because JavaScript number are imprecise, we should guarantee the extremes are right.
                if (x === 0) return 0;
                if (x === 1) return 1;
                return calcBezier(this._getTForX(x), mY1, mY2);
            },

            // Private part

            _precompute: function () {
                var mX1 = this._p[0],
                    mY1 = this._p[1],
                    mX2 = this._p[2],
                    mY2 = this._p[3];
                this._precomputed = true;
                if (mX1 !== mY1 || mX2 !== mY2)
                    this._calcSampleValues();
            },

            _calcSampleValues: function () {
                var mX1 = this._p[0],
                    mX2 = this._p[2];
                for (var i = 0; i < kSplineTableSize; ++i) {
                    this._mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
                }
            },

            /**
             * getTForX chose the fastest heuristic to determine the percentage value precisely from a given X projection.
             */
            _getTForX: function (aX) {
                var mX1 = this._p[0],
                    mX2 = this._p[2],
                    mSampleValues = this._mSampleValues;

                var intervalStart = 0.0;
                var currentSample = 1;
                var lastSample = kSplineTableSize - 1;

                for (; currentSample !== lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
                    intervalStart += kSampleStepSize;
                }
                --currentSample;

                // Interpolate to provide an initial guess for t
                var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1] - mSampleValues[currentSample]);
                var guessForT = intervalStart + dist * kSampleStepSize;

                var initialSlope = getSlope(guessForT, mX1, mX2);
                if (initialSlope >= NEWTON_MIN_SLOPE) {
                    return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
                } else if (initialSlope === 0.0) {
                    return guessForT;
                } else {
                    return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
                }
            }
        };

        return ob;

    }());

    function bezFunction() {

        function BezierData(length) {
            this.segmentLength = 0;
            this.points = new Array(length);
        }

        function PointData(length, ptDistance, point) {
            this.length = length;
            this.ptDistance = ptDistance;
            this.point = point;
        }

        var buildBezierData = (function () {

            var storedData = {};

            return function (keyData, segmentLength) {
                var pt1 = keyData.s;
                var pt2 = keyData.e;
                var pt3 = keyData.to;
                var pt4 = keyData.ti;
                var bezierName = (pt1.join('_') + '_' + pt2.join('_') + '_' + pt3.join('_') + '_' + pt4.join('_')).replace(/\./g, 'p');
                if (storedData[bezierName]) {
                    return storedData[bezierName];
                }
                var curveSegments = Math.max(Math.min(Math.round(segmentLength), global.curveSegments), 2);
                var k, i, len;
                var ptCoord, perc, addedLength = 0;
                var ptDistance;
                var point, lastPoint = null;
                var bezierData = new BezierData(curveSegments);
                len = pt3.length;
                for (k = 0; k < curveSegments; k += 1) {
                    point = new Array(len);
                    perc = k / (curveSegments - 1);
                    ptDistance = 0;
                    for (i = 0; i < len; i += 1) {
                        ptCoord = Math.pow(1 - perc, 3) * pt1[i] + 3 * Math.pow(1 - perc, 2) * perc * (pt1[i] + pt3[i]) + 3 * (1 - perc) * Math.pow(perc, 2) * (pt2[i] + pt4[i]) + Math.pow(perc, 3) * pt2[i];
                        point[i] = ptCoord;
                        if (lastPoint !== null) {
                            ptDistance += Math.pow(point[i] - lastPoint[i], 2);
                        }
                    }
                    ptDistance = Math.sqrt(ptDistance);
                    addedLength += ptDistance;
                    bezierData.points[k] = new PointData(addedLength, ptDistance, point);
                    lastPoint = point;
                }
                bezierData.segmentLength = addedLength;
                storedData[bezierName] = bezierData;
                return bezierData;
            }
        }());

        return {
            buildBezierData: buildBezierData
        };
    }

    var bez = bezFunction();

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

    function adjustOrient(data) {
        for (var j in data.k) {
            var _key = data.k[j];
            for (var i in _key.s) {
                _key.to[i] = _key.ti[i] = 0;
                if (_key.e[i] - _key.s[i] > 180) {
                    _key.s[i] += 360;
                }
                if (_key.e[i] - _key.s[i] < -180) {
                    _key.s[i] -= 360;
                }
            }
        }
    }

    function PropertyValue(name, data) {
        this.name = name;

        this.isAnim = data.a === 1;

        if (this.name == 'or' && this.isAnim) {
            adjustOrient(data);
        }

        if (this.isAnim) this.keys = new KeyValues(data.k);
        else this.value = data.k;
    }

    Object.assign(PropertyValue.prototype, {
        update: function (frameId) {
            if (this.isAnim) return this.keys.update(frameId);
            else return this.value;
        },

    });

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

    function Tanimation(data, params) {
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
        this.setSize(params.width || global.width, params.height || global.height);
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

    exports.Tanimation = Tanimation;
    exports.bindScopedCanvas = bindScopedCanvas;
    exports.fixed = fixed;
    exports.global = global;
    exports.loadFullJson = loadFullJson;
    exports.loadImg = loadImg;
    exports.loadJson = loadJson;
    exports.loadQueue = loadQueue;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
