// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const PreferencesObserver = new Lang.Class ({
    Name: 'PreferencesObserver',
    _init: function() {
        this._schema = Convenience.getSettings();
        this.prefsObsID = this._schema.connect("changed::" + 'minworkspaces',
                               Lang.bind(this, this._onValueChanged));
    },
    _onValueChanged: function() {
        set_fixed_workspaces(this._schema.get_int('minworkspaces'));
    },

    _destroy: function() {
        this._schema.disconnect(this.prefsObsID);
    }
});

function set_fixed_workspaces(min_workspaces) {
    let num_workspaces = global.screen.n_workspaces;

    //first make all workspaces non-persistent
    for(let i = num_workspaces-1; i >= 0; i--) {
        global.screen.get_workspace_by_index(i)._keepAliveId = false;
    }

    //if we have less than the minimum workspaces create new ones and make them persistent
    if(num_workspaces < min_workspaces-1) {
        for(let i = 0; i < min_workspaces-1; i++) {
            if(i >= global.screen.n_workspaces) {
                global.screen.append_new_workspace(false, global.get_current_time());
            }            
            global.screen.get_workspace_by_index(i)._keepAliveId = true;    
        }
    } 
    //if we already have enough workspaces make the first ones persistent
    else {
        for(let i = 0; i < min_workspaces-1; i++) {
            global.screen.get_workspace_by_index(i)._keepAliveId = true;
        }
    }
    Main.wm._workspaceTracker._checkWorkspaces();
}

function init() {
}

let prefsObserver = null;

function enable() {
    if (Meta.prefs_get_dynamic_workspaces()) {
        this._schema = Convenience.getSettings();
        set_fixed_workspaces(this._schema.get_int('minworkspaces'));
        prefsObserver = new PreferencesObserver();
    }
}

function disable() {
    set_fixed_workspaces(0);
    
    if(prefsObserver != null) {
        prefsObserver._destroy();
    }
}
