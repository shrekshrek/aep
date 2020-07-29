import {renderManager} from "./renderManager.jsx";

var folder = app.project.file.parent;
folder.changePath('aexport_' + app.project.activeItem.name + '/');
if (!folder.exists) folder.create();

renderManager.render(app.project.activeItem, folder.absoluteURI + '/data.json', true);