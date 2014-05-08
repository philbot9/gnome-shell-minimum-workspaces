// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;



function set_fixed_workspaces(number) {
    let min_workspaces = number;
    let num_workspaces = global.screen.n_workspaces;
    
    //first make all workspaces non-persistent
    for(let i = num_workspaces-1; i > 0; i--) {
        global.screen.get_workspace_by_index(i)._keepAliveId = false;
    }

    //if we have less than the minimum workspaces create new ones and make them persistent
    if(num_workspaces < min_workspaces) {
        for(let i = num_workspaces; i < min_workspaces; i++) {
            global.screen.append_new_workspace(false, 0);
            global.screen.get_workspace_by_index(global.screen.n_workspaces - 1)._keepAliveId = true;    
        }
    } 
    //if we already have enough workspaces make the first ones persistent
    else {
        for(let i = 0; i < min_workspaces-1; i++) {
            global.screen.get_workspace_by_index(i)._keepAliveId = true;
        }
    }
}

function init() {
}

function enable() {
    if (Meta.prefs_get_dynamic_workspaces()) {
        this._schema = Convenience.getSettings();
        set_fixed_workspaces(this._schema.get_int('minworkspaces'));
    }
}

function disable() {
    set_fixed_workspaces(0);
}