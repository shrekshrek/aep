import {keyframeHelper} from "./keyframeHelper.jsx";

var cameraHelper = function () {
    'use strict';
    var ob = {};

    function exportCamera(layerInfo, data, frameRate) {
        var stretch = data.sr;
        data.pe = keyframeHelper.exportKeyframes(layerInfo.property('ADBE Camera Options Group').property('ADBE Camera Zoom'), frameRate, stretch);
        data.tf = {};
        if (layerInfo.transform.property('ADBE Anchor Point').canSetExpression) {
            data.tf.a = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Anchor Point'), frameRate, stretch);
        }
        if (layerInfo.transform.position.dimensionsSeparated) {
            data.tf.p = {s: true};
            data.tf.p.x = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Position_0'), frameRate, stretch);
            data.tf.p.y = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Position_1'), frameRate, stretch);
            data.tf.p.z = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Position_2'), frameRate, stretch);
        } else {
            data.tf.p = keyframeHelper.exportKeyframes(layerInfo.transform.position, frameRate, stretch);
        }
        data.tf.or = keyframeHelper.exportKeyframes(layerInfo.transform.Orientation, frameRate, stretch);
        data.tf.rx = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Rotate X'), frameRate, stretch);
        data.tf.ry = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Rotate Y'), frameRate, stretch);
        data.tf.rz = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Rotate Z'), frameRate, stretch);
    }

    ob.exportCamera = exportCamera;

    return ob;
}();

export {cameraHelper};