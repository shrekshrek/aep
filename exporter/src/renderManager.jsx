import {layerElement} from "./elements/layerElement.jsx";
import {sourceHelper} from "./utils/sourceHelper.jsx";
import {dataManager} from "./dataManager.jsx";

var renderManager = function () {
    'use strict';

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
        totalLayers = pendingLayers.length;
        currentLayer = 0;

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
            currentLayer += 1;
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

export {renderManager};