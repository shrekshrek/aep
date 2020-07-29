import {renderManager} from "../renderManager.jsx";
import {generalUtils} from "../utils/generalUtils.jsx";
import {sourceHelper} from "../utils/sourceHelper.jsx";
import {transformHelper} from "../utils/transformHelper.jsx";
import {cameraHelper} from "../utils/cameraHelper.jsx";

var layerElement = function () {
    'use strict';
    var ob = {};
    ob.layerTypes = {
        precomp: 14,
        solid: 13,
        still: 12,
        nullLayer: 11,
        shape: 10,
        text: 9,
        audio: 8,
        pholderVideo: 7,
        imageSeq: 6,
        video: 5,
        pholderStill: 4,
        guide: 3,
        adjustment: 2,
        camera: 1,
        light: 0
    };

    var getLayerType = function () {
        function avLayerType(lObj) {
            var lSource = lObj.source;
            if (lSource instanceof CompItem) {
                return ob.layerTypes.precomp;
            }
            var lMainSource = lSource.mainSource;
            if (!lObj.hasVideo) {
                return ob.layerTypes.audio;
            } else if (lSource instanceof CompItem) {
                return ob.layerTypes.precomp;
            } else if (lSource.frameDuration < 1) {
                if (lMainSource instanceof PlaceholderSource) {
                    return ob.layerTypes.pholderVideo;
                } else if (lSource.name.toString().indexOf("].") !== -1) {
                    return ob.layerTypes.imageSeq;
                } else {
                    if (lMainSource.isStill) {
                        return ob.layerTypes.still;
                    } else {
                        return ob.layerTypes.video;
                    }
                }
            } else if (lSource.frameDuration === 1) {
                if (lMainSource instanceof PlaceholderSource) {
                    return ob.layerTypes.pholderStill;
                } else if (lMainSource.color) {
                    return ob.layerTypes.solid;
                } else {
                    return ob.layerTypes.still;
                }
            }
        }

        return function (layerOb) {
            try {
                var curLayer, instanceOfArray, instanceOfArrayLength, result;
                curLayer = layerOb;
                instanceOfArray = [AVLayer, CameraLayer, LightLayer, ShapeLayer, TextLayer];
                instanceOfArrayLength = instanceOfArray.length;

                if (curLayer.adjustmentLayer) {
                    return ob.layerTypes.adjustment;
                } else if (curLayer.nullLayer) {
                    return ob.layerTypes.nullLayer;
                }
                var i;
                for (i = 0; i < instanceOfArrayLength; i++) {
                    if (curLayer instanceof instanceOfArray[i]) {
                        result = instanceOfArray[i].name;
                        break;
                    }
                }
                if (result === "AVLayer") {
                    result = avLayerType(curLayer);
                } else if (result === "CameraLayer") {
                    result = ob.layerTypes.camera;
                } else if (result === "LightLayer") {
                    result = ob.layerTypes.light;
                } else if (result === "ShapeLayer") {
                    result = ob.layerTypes.shape;
                } else if (result === "TextLayer") {
                    result = ob.layerTypes.text;
                }
                return result;
            } catch (err) {
                alert(err.line.toString + " " + err.toString());
            }
        };
    }();

    function prepareLayer(layerInfo) {
        var layerData = {};
        var layerType = getLayerType(layerInfo);
        if (layerType === ob.layerTypes.audio || layerType === ob.layerTypes.light || layerType === ob.layerTypes.adjustment || layerType === ob.layerTypes.pholderStill || layerType === ob.layerTypes.pholderVideo) {
            layerData.isValid = false;
            layerData.render = false;
        }

        if (layerInfo.guideLayer) {
            layerData.isGuide = true;
            layerData.render = false;
        }

        if (layerInfo.enabled === false) {
            layerData.enabled = false;
            layerData.render = false;
        }
        if (layerInfo.threeDLayer) {
            layerData.ddd = 1;
        } else {
            layerData.ddd = 0;
        }
        layerData.ind = layerInfo.index;
        layerData.ty = layerType;
        layerData.nm = layerInfo.name;

        if (layerInfo.parent !== null) {
            layerData.parent = layerInfo.parent.index;
        }

        return layerData;
    }

    var compCount = 0;

    function checkLayerSource(layerInfo, layerData) {
        if (layerData.render === false) return;

        var layerType = layerData.ty;
        var sourceId;
        if (layerType === ob.layerTypes.precomp) {
            sourceId = sourceHelper.checkCompSource(layerInfo, layerType);
            if (sourceId !== false) {
                layerData.refId = sourceId;
            } else {
                layerData.compId = 'comp_' + compCount;
                compCount += 1;
                layerData.refId = layerData.compId;
                sourceHelper.setCompSourceId(layerInfo.source, layerData.compId);
            }
        } else if (layerType === ob.layerTypes.still) {
            layerData.refId = sourceHelper.checkImageSource(layerInfo);
        }
    }

    function renderLayer(layerOb) {
        var layerInfo = layerOb.layer;
        var layerData = layerOb.data;
        var frameRate = layerOb.framerate;
        if (layerData.render === false) {
            renderManager.renderLayerComplete();
            return;
        }

        layerData.sr = layerInfo.stretch / 100;

        var lType = layerData.ty;
        if (lType !== ob.layerTypes.camera) {
            transformHelper.exportTransform(layerInfo, layerData, frameRate);
        }

        if (lType === ob.layerTypes.solid) {
            layerData.sw = layerInfo.source.width;
            layerData.sh = layerInfo.source.height;
            layerData.sc = generalUtils.arrayRgbToHex(layerInfo.source.mainSource.color);
        } else if (lType === ob.layerTypes.precomp) {
            layerData.w = layerInfo.width;
            layerData.h = layerInfo.height;
            layerData.ws = layerInfo.source.workAreaStart * frameRate;
            layerData.wd = layerInfo.source.workAreaDuration * frameRate;
        } else if (lType === ob.layerTypes.camera) {
            cameraHelper.exportCamera(layerInfo, layerData, frameRate);
        }
        layerData.ip = layerInfo.inPoint * frameRate;
        layerData.op = layerInfo.outPoint * frameRate;
        layerData.st = layerInfo.startTime * frameRate;

        renderManager.renderLayerComplete();
    }

    ob.prepareLayer = prepareLayer;
    ob.checkLayerSource = checkLayerSource;
    ob.renderLayer = renderLayer;
    ob.getLayerType = getLayerType;
    return ob;
}();

export {layerElement};