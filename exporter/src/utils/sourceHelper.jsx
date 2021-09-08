import {renderManager} from "../renderManager.jsx";

var sourceHelper = function () {
    'use strict';
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

        //修正高版本ae导出时卡住的bug，导出每张图片间增加一个强制0.5s延时
        var _now = Date.now();
        while (true) {
            if (Date.now() - _now > 500) break;
        }

        saveNextImage();
    }

    function roundPowerOfTwo(value) {
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

export {sourceHelper};