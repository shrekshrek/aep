import {fixed} from "../static";

// --------------------------------------------------------------------全局update
Date.now = (Date.now || function () {
    return new Date().getTime();
});

var nowOffset = Date.now();

function now() {
    return Date.now() - nowOffset;
}

var requestFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };

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

    requestFrame(globalUpdate);
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
            requestFrame(globalUpdate);
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
            requestFrame(globalUpdate);
        }
    },

    _removeSoloTimeline: function () {
        var i = soloTimelines.indexOf(this);
        if (i !== -1) soloTimelines.splice(i, 1);
    },


});

export {Timeline};