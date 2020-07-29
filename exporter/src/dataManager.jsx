
import "./JSON.jsx";
import {layerElement} from "./elements/layerElement.jsx";

var dataManager = function () {
    'use strict';
    var ob = {};
    var _endCallback;
    var _destinationPath;

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
        _destinationPath = destinationPath;
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

export {dataManager};