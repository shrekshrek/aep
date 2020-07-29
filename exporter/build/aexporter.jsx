/*!
 * GIT: https://github.com/shrekshrek
 * @author: Shrek.wang
 **/

var generalUtils = function () {
    var ob = {};

    function random(len) {
        var sequence = 'abcdefghijklmnoqrstuvwxyz1234567890', returnString = '', i;
        for (i = 0; i < len; i += 1) {
            returnString += sequence.charAt(Math.floor(Math.random() * sequence.length));
        }
        return returnString;
    }

    function roundArray(arr, decimals) {
        var i, len = arr.length;
        var retArray = [];
        for (i = 0; i < len; i += 1) {
            if (typeof arr[i] === 'number') {
                retArray.push(roundNumber(arr[i], decimals));
            } else {
                retArray.push(roundArray(arr[i], decimals));
            }
        }
        return retArray;
    }

    function roundNumber(num, decimals) {
        num = num || 0;
        if (typeof num === 'number') {
            return parseFloat(num.toFixed(decimals));
        } else {
            return roundArray(num, decimals);
        }
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function arrayRgbToHex(values) {
        return rgbToHex(Math.round(values[0] * 255), Math.round(values[1] * 255), Math.round(values[2] * 255));
    }

    ob.random = random;
    ob.roundNumber = roundNumber;
    ob.arrayRgbToHex = arrayRgbToHex;

    return ob;

}();

var sourceHelper = function () {
    var compSources = [], imageSources = [], currentExportingImage, imagesArray, folder, imageCount = 0, RQbackup;

    function checkCompSource(item) {
        var arr = compSources;
        var i = 0, len = arr.length, isRendered = false;
        while (i < len) {
            if (arr[i].source === item.source) {
                isRendered = true;
                break;
            }
            i += 1;
        }
        if (isRendered) {
            return arr[i].id;
        }
        arr.push({
            source: item.source
        });
        return false;
    }

    function checkImageSource(item) {
        var arr = imageSources;
        var i = 0, len = arr.length;
        while (i < len) {
            if (arr[i].source === item.source) {
                return arr[i].id;
            }
            i += 1;
        }
        arr.push({
            source: item.source,
            width: item.source.width,
            height: item.source.height,
            source_name: item.source.name,
            name: item.name,
            id: 'image_' + imageCount
        });
        imageCount += 1;
        return arr[arr.length - 1].id;
    }

    function setCompSourceId(source, id) {
        var i = 0, len = compSources.length;
        while (i < len) {
            if (compSources[i].source === source) {
                compSources[i].id = id;
            }
            i += 1;
        }
    }

    function storeRenderQueue() {
        var checkeds = [];
        for (var i = 1; i <= app.project.renderQueue.numItems; i++) {
            if (app.project.renderQueue.item(i).status == RQItemStatus.RENDERING) {
                checkeds.push("rendering");
                break;
            } else if (app.project.renderQueue.item(i).status == RQItemStatus.QUEUED) {
                checkeds.push(i);
                app.project.renderQueue.item(i).render = false;
            }
        }
        return checkeds;
    }

    function restoreRenderQueue(checkedItems) {
        for (var i = 0; i < checkedItems.length; i++) {
            app.project.renderQueue.item(checkedItems[i]).render = true;
        }
    }

    function saveNextImage() {
        if (currentExportingImage === imageSources.length) {
            app.activeViewer.setActive();
            renderManager.imagesReady();
            if (RQbackup != null && RQbackup != '') {
                restoreRenderQueue(RQbackup);
            }
            return;
        }
        var currentSourceData = imageSources[currentExportingImage];
        var currentSource = currentSourceData.source;
        var imageName = 'img_' + currentExportingImage + '.png';
        imagesArray.push({
            id: currentSourceData.id,
            w: currentSourceData.width,
            h: currentSourceData.height,
            u: 'images/',
            p: imageName
        });

        var _w = Math.max(4, currentSource.width);
        var _h = Math.max(4, currentSource.height);
        if (renderManager.checkNeedPower2()) {
            _w = roundPowerOfTwo(_w);
            _h = roundPowerOfTwo(_h);
        }

        var helperComp = app.project.items.addComp('tempConverterComp', _w, _h, 1, 1, 1);
        helperComp.layers.add(currentSource);
        helperComp.layer(1).transform.Scale.setValueAtTime(0, [_w / currentSource.width * 100, _h / currentSource.height * 100, 100]);
        helperComp.resolutionFactor = [1, 1];
        var file = new File(folder.absoluteURI + '/' + imageName);


        // renderQueue方法，速度相对较慢
        helperComp.openInViewer();
        app.executeCommand(2104);
        var helperRenderItem = app.project.renderQueue.item(app.project.renderQueue.numItems);
        helperRenderItem.render = true;
        var _tid = getPngTemplateId(helperRenderItem.outputModule(1).templates);
        var setPNG = helperRenderItem.outputModule(1).templates[_tid];
        helperRenderItem.outputModule(1).applyTemplate(setPNG);
        helperRenderItem.outputModule(1).file = file;
        app.project.renderQueue.render();
        helperRenderItem.remove();

        // saveFrameToPng方法，透明图片有黑边
        // helperComp.saveFrameToPng(0, file);


        helperComp.remove();
        currentExportingImage += 1;
        renderManager.updateBar(currentExportingImage / imageSources.length);
        saveNextImage();
    }

    function roundPowerOfTwo (value) {
        return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
    }

    // 0    AIFF 48kHz
    // 1    Photoshop
    // 2    QuickTime DV NTSC 48kHz
    // 3    QuickTime DV PAL 48kHz
    // 4    仅 Alpha
    // 5    使用 Alpha 无损耗
    // 6    保存当前预览
    // 7    多机序列
    // 8    带有 Alpha 的 TIFF 序列
    // 9    无损
    // 10   _HIDDEN X-Factor 16
    // 11   _HIDDEN X-Factor 16 Premul
    // 12   _HIDDEN X-Factor 32
    // 13   _HIDDEN X-Factor 32 Premul
    // 14   _HIDDEN X-Factor 8
    // 15   _HIDDEN X-Factor 8 Premul

    function getPngTemplateId(templates) {
        for (var i = 0, l = templates.length; i < l; i++) {
            if (templates[i] == '_HIDDEN X-Factor 8 Premul') return i;
        }
    }

    function exportImages(path, images) {
        if (imageSources.length === 0) {
            renderManager.imagesReady();
            return;
        }

        RQbackup = storeRenderQueue();
        if (RQbackup[RQbackup.length - 1] == "rendering") {
            alert("Render Queue is rendering item, please wait for it complete or stop it.");
        }

        currentExportingImage = 0;
        var file = new File(path);
        folder = file.parent;
        folder.changePath('images/');
        imagesArray = images;

        if (folder.exists) {
            var files = folder.getFiles();
            for (var i = files.length - 1; i >= 0; i--) {
                files[i].remove();
            }
            folder.remove();
        }

        if (folder.create()) {
            saveNextImage();
        } else {
            alert('folder failed to be created at: ' + folder.fsName);
        }
    }


    function reset() {
        compSources.length = 0;
        imageSources.length = 0;
        imageCount = 0;
    }

    return {
        checkCompSource: checkCompSource,
        checkImageSource: checkImageSource,
        setCompSourceId: setCompSourceId,
        exportImages: exportImages,
        reset: reset
    };

}();

var keyframeHelper = function () {
    var ob = {}, property, j = 1, jLen, beziersArray, averageSpeed, duration, bezierIn, bezierOut, frameRate;

    function getPropertyValue(value, roundFlag) {
        switch (property.propertyValueType) {
            case PropertyValueType.SHAPE:
                var elem = {
                    i: roundFlag ? generalUtils.roundNumber(value.inTangents, 3) : value.inTangents,
                    o: roundFlag ? generalUtils.roundNumber(value.outTangents, 3) : value.outTangents,
                    v: roundFlag ? generalUtils.roundNumber(value.vertices, 3) : value.vertices,
                    c: value.closed
                };
                return elem;
            case PropertyValueType.COLOR:
                var i, len = value.length;
                for (i = 0; i < len; i += 1) {
                    value[i] = Math.round(value[i] * 1000000000000) / 1000000000000;
                    value[i] = value[i];
                }
                return value;
            default:
                return roundFlag ? generalUtils.roundNumber(value, 3) : value;
        }
    }

    function getCurveLength(initPos, endPos, outBezier, inBezier) {
        var k, curveSegments = 200, point, lastPoint = null, ptDistance, absToCoord, absTiCoord, triCoord1, triCoord2,
            triCoord3, liCoord1, liCoord2, ptCoord, perc, addedLength = 0, i, len;
        for (k = 0; k < curveSegments; k += 1) {
            point = [];
            perc = k / (curveSegments - 1);
            ptDistance = 0;
            absToCoord = [];
            absTiCoord = [];
            len = outBezier.length;
            for (i = 0; i < len; i += 1) {
                if (absToCoord[i] === null || absToCoord[i] === undefined) {
                    absToCoord[i] = initPos[i] + outBezier[i];
                    absTiCoord[i] = endPos[i] + inBezier[i];
                }
                triCoord1 = initPos[i] + (absToCoord[i] - initPos[i]) * perc;
                triCoord2 = absToCoord[i] + (absTiCoord[i] - absToCoord[i]) * perc;
                triCoord3 = absTiCoord[i] + (endPos[i] - absTiCoord[i]) * perc;
                liCoord1 = triCoord1 + (triCoord2 - triCoord1) * perc;
                liCoord2 = triCoord2 + (triCoord3 - triCoord2) * perc;
                ptCoord = liCoord1 + (liCoord2 - liCoord1) * perc;
                point.push(ptCoord);
                if (lastPoint !== null) {
                    ptDistance += Math.pow(point[i] - lastPoint[i], 2);
                }
            }
            ptDistance = Math.sqrt(ptDistance);
            addedLength += ptDistance;
            lastPoint = point;
        }
        return addedLength;
    }

    function buildKeyInfluence(key, lastKey, indexTime) {
        switch (property.propertyValueType) {
            case PropertyValueType.ThreeD_SPATIAL:
            case PropertyValueType.TwoD_SPATIAL:
            case PropertyValueType.SHAPE:
            case PropertyValueType.NO_VALUE:
                key.easeIn = {
                    influence: property.keyInTemporalEase(indexTime + 1)[0].influence,
                    speed: property.keyInTemporalEase(indexTime + 1)[0].speed
                };
                lastKey.easeOut = {
                    influence: property.keyOutTemporalEase(indexTime)[0].influence,
                    speed: property.keyOutTemporalEase(indexTime)[0].speed
                };
                break;
            default:
                key.easeIn = [];
                lastKey.easeOut = [];
                var inEase = property.keyInTemporalEase(indexTime + 1);
                var outEase = property.keyOutTemporalEase(indexTime);
                var i, len = inEase.length;
                for (i = 0; i < len; i += 1) {
                    key.easeIn.push({influence: inEase[i].influence, speed: inEase[i].speed});
                    lastKey.easeOut.push({influence: outEase[i].influence, speed: outEase[i].speed});
                }
        }
    }

    function exportKeys(prop, frRate, stretch, keyframeValues) {
        var currentExpression = '';
        property = prop;
        var propertyValueType = property.propertyValueType;

        frameRate = frRate;
        beziersArray = [];
        if (propertyValueType === PropertyValueType.SHAPE) {
            if (prop.expressionEnabled && !prop.expressionError) {
                currentExpression = prop.expression;
                prop.expression = '';
            }
        }
        if (property.numKeys <= 1) {
            if (propertyValueType === PropertyValueType.NO_VALUE) {
                return keyframeValues;
            }
            var propertyValue = getPropertyValue(property.valueAtTime(0, true), true);
            if (currentExpression !== '') {
                prop.expression = currentExpression;
            }
            return propertyValue;
        }
        jLen = property.numKeys;
        var isPrevHoldInterpolated = false;
        var STRETCH_FACTOR = stretch;
        for (j = 1; j < jLen; j += 1) {
            isPrevHoldInterpolated = false;
            var segmentOb = {};
            var indexTime = j;
            var i, len;
            var k, kLen;
            var key = {};
            var lastKey = {};
            var interpolationType = '';
            key.time = property.keyTime(indexTime + 1);
            lastKey.time = property.keyTime(indexTime);
            if (propertyValueType !== PropertyValueType.NO_VALUE) {
                key.value = getPropertyValue(property.keyValue(indexTime + 1), false);
                lastKey.value = getPropertyValue(property.keyValue(indexTime), false);
                if (!(key.value instanceof Array)) {
                    key.value = [key.value];
                    lastKey.value = [lastKey.value];
                }
            } else {
                key.value = keyframeValues[j];
                lastKey.value = keyframeValues[j - 1];
            }
            if (property.keyOutInterpolationType(indexTime) === KeyframeInterpolationType.HOLD) {
                interpolationType = 'hold';
            } else {
                if (property.keyOutInterpolationType(indexTime) === KeyframeInterpolationType.LINEAR && property.keyInInterpolationType(indexTime + 1) === KeyframeInterpolationType.LINEAR) {
                    interpolationType = 'linear';
                }
                buildKeyInfluence(key, lastKey, indexTime);
                switch (property.propertyValueType) {
                    case PropertyValueType.ThreeD_SPATIAL:
                    case PropertyValueType.TwoD_SPATIAL:
                        lastKey.to = property.keyOutSpatialTangent(indexTime);
                        key.ti = property.keyInSpatialTangent(indexTime + 1);
                        break;
                }
            }
            if (interpolationType === 'hold') {
                isPrevHoldInterpolated = true;
                segmentOb.t = generalUtils.roundNumber(lastKey.time * frameRate, 3);
                if (propertyValueType !== PropertyValueType.NO_VALUE) {
                    segmentOb.s = getPropertyValue(property.keyValue(j), true);
                    if (!(segmentOb.s instanceof Array)) {
                        segmentOb.s = [segmentOb.s];
                    }
                } else {
                    segmentOb.s = keyframeValues[j - 1];
                }
                segmentOb.h = 1;
            } else {
                duration = (key.time - lastKey.time) / STRETCH_FACTOR;
                len = propertyValueType === PropertyValueType.NO_VALUE ? 0 : key.value.length;
                bezierIn = {};
                bezierOut = {};
                averageSpeed = 0;
                var infOut, infIn;
                switch (property.propertyValueType) {
                    case PropertyValueType.ThreeD_SPATIAL:
                    case PropertyValueType.TwoD_SPATIAL:
                        var curveLength = getCurveLength(lastKey.value, key.value, lastKey.to, key.ti);
                        averageSpeed = curveLength / duration;
                        if (curveLength === 0) {
                            infOut = lastKey.easeOut.influence;
                            infIn = key.easeIn.influence;
                        } else {
                            infOut = Math.min(100 * curveLength / (lastKey.easeOut.speed * duration), lastKey.easeOut.influence);
                            infIn = Math.min(100 * curveLength / (key.easeIn.speed * duration), key.easeIn.influence);
                        }
                        bezierIn.x = 1 - infIn / 100;
                        bezierOut.x = infOut / 100;
                        break;
                    case PropertyValueType.SHAPE:
                    case PropertyValueType.NO_VALUE:
                        averageSpeed = 1;
                        infOut = Math.min(100 / lastKey.easeOut.speed, lastKey.easeOut.influence);
                        infIn = Math.min(100 / key.easeIn.speed, key.easeIn.influence);
                        bezierIn.x = 1 - infIn / 100;
                        bezierOut.x = infOut / 100;
                        break;
                    case PropertyValueType.ThreeD:
                    case PropertyValueType.TwoD:
                    case PropertyValueType.OneD:
                    case PropertyValueType.COLOR:
                        bezierIn.x = [];
                        bezierOut.x = [];
                        kLen = key.easeIn.length;
                        for (k = 0; k < kLen; k += 1) {
                            bezierIn.x[k] = 1 - key.easeIn[k].influence / 100;
                            bezierOut.x[k] = lastKey.easeOut[k].influence / 100;
                        }
                        averageSpeed = [];
                        for (i = 0; i < len; i += 1) {
                            if (property.propertyValueType === PropertyValueType.COLOR) {
                                averageSpeed[i] = 255 * (key.value[i] - lastKey.value[i]) / duration;
                            } else {
                                averageSpeed[i] = (key.value[i] - lastKey.value[i]) / duration;
                            }
                        }
                        break;
                }
                if (averageSpeed === 0) {
                    bezierIn.y = bezierIn.x;
                    bezierOut.y = bezierOut.x;
                } else {
                    switch (property.propertyValueType) {
                        case PropertyValueType.ThreeD_SPATIAL:
                        case PropertyValueType.TwoD_SPATIAL:
                        case PropertyValueType.SHAPE:
                        case PropertyValueType.NO_VALUE:
                            if (interpolationType === 'linear') {
                                bezierIn.y = bezierIn.x;
                                bezierOut.y = bezierOut.x;
                            } else {
                                bezierIn.y = 1 - (key.easeIn.speed / averageSpeed) * (infIn / 100);
                                bezierOut.y = (lastKey.easeOut.speed / averageSpeed) * (infOut / 100);
                            }
                            break;
                        case PropertyValueType.ThreeD:
                        case PropertyValueType.TwoD:
                        case PropertyValueType.OneD:
                        case PropertyValueType.COLOR:
                            bezierIn.y = [];
                            bezierOut.y = [];
                            kLen = key.easeIn.length;
                            for (k = 0; k < kLen; k += 1) {
                                if (interpolationType === 'linear') {
                                    bezierIn.y[k] = bezierIn.x[k];
                                    bezierOut.y[k] = bezierOut.x[k];
                                } else {
                                    var yNormal = (key.value[k] - lastKey.value[k]);
                                    if (Math.abs(yNormal) < 0.0000001) {
                                        yNormal = 1;
                                    }
                                    var bezierY = (lastKey.easeOut[k].speed * lastKey.easeOut[k].influence / 100);
                                    var bezierInY = (key.easeIn[k].speed * key.easeIn[k].influence / 100);
                                    bezierIn.y[k] = 1 - (bezierInY * duration) / yNormal;
                                    bezierOut.y[k] = (bezierY * duration) / yNormal;
                                }
                            }
                            break;
                    }
                }

                bezierIn.x = generalUtils.roundNumber(bezierIn.x, 3);
                bezierIn.y = generalUtils.roundNumber(bezierIn.y, 3);
                bezierOut.x = generalUtils.roundNumber(bezierOut.x, 3);
                bezierOut.y = generalUtils.roundNumber(bezierOut.y, 3);
                segmentOb.i = bezierIn;
                segmentOb.o = bezierOut;
                if (bezierIn.x.length) {
                    segmentOb.n = [];
                    kLen = bezierIn.x.length;
                    for (k = 0; k < kLen; k += 1) {
                        segmentOb.n.push((bezierIn.x[k].toString() + '_' + bezierIn.y[k].toString() + '_' + bezierOut.x[k].toString() + '_' + bezierOut.y[k].toString()).replace(/\./g, 'p'));
                    }
                } else {
                    segmentOb.n = (bezierIn.x.toString() + '_' + bezierIn.y.toString() + '_' + bezierOut.x.toString() + '_' + bezierOut.y.toString()).replace(/\./g, 'p');
                }
                segmentOb.t = generalUtils.roundNumber(lastKey.time * frameRate, 3);
                if (propertyValueType !== PropertyValueType.NO_VALUE) {
                    segmentOb.s = getPropertyValue(property.keyValue(j), true);
                    segmentOb.e = getPropertyValue(property.keyValue(j + 1), true);
                    if (!(segmentOb.s instanceof Array)) {
                        segmentOb.s = [segmentOb.s];
                        segmentOb.e = [segmentOb.e];
                    }
                } else {
                    segmentOb.s = keyframeValues[j - 1];
                    segmentOb.e = keyframeValues[j];

                }
                if (property.propertyValueType === PropertyValueType.ThreeD_SPATIAL || property.propertyValueType === PropertyValueType.TwoD_SPATIAL) {
                    segmentOb.to = lastKey.to;
                    segmentOb.ti = key.ti;
                }
            }

            beziersArray.push(segmentOb);
        }
        beziersArray.push({t: property.keyTime(j) * frameRate});
        if (property.keyOutInterpolationType(j) === KeyframeInterpolationType.HOLD || isPrevHoldInterpolated) {
            if (propertyValueType !== PropertyValueType.NO_VALUE) {
                var value = getPropertyValue(property.keyValue(j), true);
                if (!(value instanceof Array)) {
                    value = [value];
                }
            } else {
                value = keyframeValues[j - 1];
            }
            beziersArray[beziersArray.length - 1].s = value;
            beziersArray[beziersArray.length - 1].h = 1;
        }
        if (currentExpression !== '') {
            prop.expression = currentExpression;
        }
        return beziersArray;
    }

    function exportKeyframes(prop, frRate, stretch, keyframeValues) {
        var returnOb = {};
        if (prop.numKeys <= 1) {
            returnOb.a = 0;
        } else {
            returnOb.a = 1;
        }
        returnOb.k = exportKeys(prop, frRate, stretch, keyframeValues);
        // if (prop.propertyIndex) {
        //     returnOb.ix = prop.propertyIndex;
        // }
        return returnOb;
    }

    ob.exportKeyframes = exportKeyframes;

    return ob;
}();

var transformHelper = function () {
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

var cameraHelper = function () {
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

var layerElement = function () {
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

/****** INIT JSON PARSER ******/
if (typeof JSON !== 'object') {
    JSON = {};
}
(function () {
    function f(n) {
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate()) + 'T' +
                f(this.getUTCHours()) + ':' +
                f(this.getUTCMinutes()) + ':' +
                f(this.getUTCSeconds()) + 'Z'
                : null;
        };

        String.prototype.toJSON =
            Number.prototype.toJSON =
                Boolean.prototype.toJSON = function () {
                    return this.valueOf();
                };
    }

    var cx,
        escapable,
        gap,
        indent,
        meta,
        rep;

    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {
        var i,

            k,
            v,
            length,
            mind = gap,
            partial,
            value = holder[key];
        if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }
        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }
        switch (typeof value) {
            case 'string':
                return quote(value);
            case 'number':
                return isFinite(value) ? String(value) : 'null';
            case 'boolean':
            case 'null':
                return String(value);
            case 'object':
                if (!value) {
                    return 'null';
                }
                gap += indent;
                partial = [];
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    length = value.length;
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value) || 'null';
                    }
                    v = partial.length === 0
                        ? '[]'
                        : gap
                            ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                            : '[' + partial.join(',') + ']';
                    gap = mind;
                    return v;
                }
                if (rep && typeof rep === 'object') {
                    length = rep.length;
                    for (i = 0; i < length; i += 1) {
                        if (typeof rep[i] === 'string') {
                            k = rep[i];
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }
                } else {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }
                }
                v = partial.length === 0
                    ? '{}'
                    : gap
                        ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                        : '{' + partial.join(',') + '}';
                gap = mind;
                return v;
        }
    }

    if (typeof JSON.stringify !== 'function') {
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        meta = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        };
        JSON.stringify = function (value, replacer, space) {
            var i;
            gap = '';
            indent = '';
            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }
            } else if (typeof space === 'string') {
                indent = space;
            }
            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }
            return str('', {'': value});
        };
    }
    if (typeof JSON.parse !== 'function') {
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        JSON.parse = function (text, reviver) {
            var j;

            function walk(holder, key) {
                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

                j = eval('(' + text + ')');
                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }
            throw new SyntaxError('JSON.parse');
        };
    }
}());

var dataManager = function () {
    var ob = {};
    var _endCallback;
    function separateComps(layers, comps) {
        var i, len = layers.length;
        for (i = 0; i < len; i += 1) {
            if (layers[i].ty === layerElement.layerTypes.precomp && layers[i].compId) {
                comps.push({
                    id: layers[i].compId,
                    layers: layers[i].layers
                });
                separateComps(layers[i].layers, comps);
                delete layers[i].compId;
                delete layers[i].layers;
            }
        }
    }

    function deleteLayerParams(layers) {
        var i, len = layers.length;
        for (i = 0; i < len; i += 1) {
            delete layers[i].isValid;
            delete layers[i].isGuide;
            delete layers[i].render;
            delete layers[i].enabled;
            if (layers[i].ty === layerElement.layerTypes.precomp && layers[i].layers) {
                deleteLayerParams(layers[i].layers);
            }
        }
    }

    function deleteExtraParams(data) {
        deleteLayerParams(data.layers);
    }

    function saveData(data, destinationPath, callback) {
        _endCallback = callback;
        deleteExtraParams(data);
        separateComps(data.layers, data.comps);
        var dataFile, string;
        dataFile = new File(destinationPath);
        dataFile.open('w', 'TEXT', '????');
        dataFile.encoding = 'UTF-8';
        string = JSON.stringify(data);
        string = string.replace(/\n/g, '');

        try {
            dataFile.write(string);
            dataFile.close();
            _endCallback();
        } catch (errr) {
            alert('Could not write file.<br /> Make sure you have enabled scripts to write files. <br /> Edit > Preferences > General > Allow Scripts to Write Files and Access Network ');
        }

    }

    ob.saveData = saveData;

    return ob;
}();

var renderManager = function () {
    var ob = {}, pendingLayers = [], destinationPath, totalLayers, currentLayer, needPower2 = false;
    var github = 'https://github.com/shrekshrek';
    var palette, statictext, progressbar;

    function getParentData(layers, id) {
        var i = 0, len = layers.length;
        while (i < len) {
            if (layers[i].ind === id) {
                return layers[i];
            }
            i += 1;
        }
    }

    function restoreParents(layers) {
        var layerData, parentData, i, len = layers.length, hasChangedState = false;
        for (i = 0; i < len; i += 1) {
            layerData = layers[i];
            if (layerData.parent !== undefined && layerData.render !== false) {
                parentData = getParentData(layers, layerData.parent);
                if (parentData.render === false) {
                    parentData.ty = Layer.layerTypes.nullLayer;
                    hasChangedState = true;
                    parentData.render = true;
                    if (parentData.isValid === false) {
                        parentData.isValid = true;
                    }
                }
            }
        }
        if (hasChangedState) {
            restoreParents(layers);
        }
    }

    function createLayers(comp, layers, framerate) {
        var i, len = comp.layers.length, layerInfo, layerData;
        for (i = 0; i < len; i += 1) {
            layerInfo = comp.layers[i + 1];
            layerData = layerElement.prepareLayer(layerInfo);
            ob.renderData.exportData.ddd = layerData.ddd === 1 ? 1 : ob.renderData.exportData.ddd;
            layers.push(layerData);
            pendingLayers.push({data: layerData, layer: layerInfo, framerate: framerate});
        }

        restoreParents(layers);

        for (i = 0; i < len; i += 1) {
            layerData = layers[i];
            layerInfo = comp.layers[i + 1];
            layerElement.checkLayerSource(layerInfo, layerData);
            if (layerData.ty === layerElement.layerTypes.precomp && layerData.render !== false && layerData.compId) {
                layerData.layers = [];
                createLayers(layerInfo.source, layerData.layers, framerate);
            }
        }
    }

    function render(comp, destination, power2) {
        destinationPath = destination;
        needPower2 = power2;
        sourceHelper.reset();
        pendingLayers.length = 0;

        var exportData = {
            git: github,
            fr: comp.frameRate,
            ip: comp.workAreaStart * comp.frameRate,
            op: (comp.workAreaStart + comp.workAreaDuration) * comp.frameRate,
            w: comp.width,
            h: comp.height,
            nm: comp.name,
            ddd: 0,
            images: [],
            comps: [],
            layers: []
        };

        ob.renderData.exportData = exportData;
        ob.renderData.firstFrame = exportData.ip * comp.frameRate;
        createLayers(comp, exportData.layers, exportData.fr);
        createBar();

        renderNextLayer();
    }

    function createBar() {
        palette = new Window('palette', "Export json & images", {x: 0, y: 0, width: 420, height: 48});
        statictext = palette.add('statictext', {x: 10, y: 10, width: 400, height: 20}, '');
        progressbar = palette.add('progressbar', {x: 10, y: 30, width: 400, height: 12}, 0, 100);
        palette.center();
        palette.show();

        statictext.text = 'Rendering json';
        updateBar(0);
    }

    function updateBar(per) {
        progressbar.value = Math.floor(per * 100);
        palette.update();
    }

    function reset() {
        pendingLayers.length = 0;
    }

    function dataSaved() {
        reset();
        alert('Congratulations~~~  Export complete!');
    }

    function saveData() {
        dataManager.saveData(ob.renderData.exportData, destinationPath, dataSaved);
    }

    function clearUnrenderedLayers(layers) {
        var i, len = layers.length;
        for (i = 0; i < len; i += 1) {
            if (layers[i].render === false) {
                layers.splice(i, 1);
                i -= 1;
                len -= 1;
            } else if (layers[i].ty === layerElement.layerTypes.precomp && layers[i].layers) {
                clearUnrenderedLayers(layers[i].layers);
            }
        }
    }

    function removeExtraData() {
        clearUnrenderedLayers(ob.renderData.exportData.layers);
    }

    function renderNextLayer() {
        if (pendingLayers.length) {
            var nextLayerData = pendingLayers.pop();
            layerElement.renderLayer(nextLayerData);
        } else {
            removeExtraData();
            statictext.text = 'Rendering images';
            updateBar(0);
            sourceHelper.exportImages(destinationPath, ob.renderData.exportData.images);
        }
    }

    function imagesReady() {
        updateBar(1);
        palette.close();
        saveData();
    }

    function renderLayerComplete() {
        // renderNextLayer();
        app.scheduleTask('renderManager.renderNextLayer();', 10, false);
    }

    function checkNeedPower2() {
        return needPower2;
    }


    ob.renderData = {
        exportData: {
            images: []
        }
    };
    ob.render = render;
    ob.renderLayerComplete = renderLayerComplete;
    ob.renderNextLayer = renderNextLayer;
    ob.imagesReady = imagesReady;
    ob.checkNeedPower2 = checkNeedPower2;
    ob.updateBar = updateBar;

    return ob;
}();

var folder = app.project.file.parent;
folder.changePath('aexport_' + app.project.activeItem.name + '/');
if (!folder.exists) folder.create();

renderManager.render(app.project.activeItem, folder.absoluteURI + '/data.json', true);
