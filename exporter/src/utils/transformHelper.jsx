
import {keyframeHelper} from "./keyframeHelper.jsx";

var transformHelper = function () {
    'use strict';
    var ob = {};

    function exportTransform(layerInfo, data, frameRate) {
        if (!layerInfo.transform) {
            return;
        }
        var stretch = data.sr;

        data.tf = {};
        if (layerInfo.transform.opacity) {
            data.tf.o = keyframeHelper.exportKeyframes(layerInfo.transform.opacity, frameRate, stretch);
        }
        if (layerInfo.threeDLayer) {
            data.tf.rx = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Rotate X'), frameRate, stretch);
            data.tf.ry = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Rotate Y'), frameRate, stretch);
            data.tf.rz = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Rotate Z'), frameRate, stretch);
            data.tf.or = keyframeHelper.exportKeyframes(layerInfo.transform.Orientation, frameRate, stretch);
        } else {
            data.tf.r = keyframeHelper.exportKeyframes(layerInfo.transform.rotation, frameRate, stretch);
        }
        if (layerInfo.transform.position.dimensionsSeparated) {
            data.tf.p = {s: true};
            data.tf.p.x = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Position_0'), frameRate, stretch);
            data.tf.p.y = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Position_1'), frameRate, stretch);
            if (layerInfo.threeDLayer) {
                data.tf.p.z = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Position_2'), frameRate, stretch);
            }
        } else {
            data.tf.p = keyframeHelper.exportKeyframes(layerInfo.transform.position, frameRate, stretch);
        }
        if (layerInfo.transform.property('ADBE Anchor Point')) {
            data.tf.a = keyframeHelper.exportKeyframes(layerInfo.transform.property('ADBE Anchor Point'), frameRate, stretch);
        }
        if (layerInfo.transform.Scale) {
            data.tf.s = keyframeHelper.exportKeyframes(layerInfo.transform.Scale, frameRate, stretch);
        }
        if (layerInfo.autoOrient === AutoOrientType.ALONG_PATH) {
            data.ao = 1;
        } else {
            data.ao = 0;
        }
    }

    ob.exportTransform = exportTransform;
    return ob;
}();

export {transformHelper};