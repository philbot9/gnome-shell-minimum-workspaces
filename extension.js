// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GioSSS = Gio.SettingsSchemaSource;
const MessageTray = imports.ui.messageTray;

const ExtensionUtils = imports.misc.extensionUtils;
const ExtensionSystem = imports.ui.extensionSystem;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const DisableNotification = new Lang.Class({
    Name: 'DisableNotification',
    Extends: MessageTray.Source,

    _init: function() {
        this.parent('', 'minimum-workspaces-disabled');
        Main.messageTray.add(this);
    },

    doNotify: function() {
        let notification = new MessageTray.Notification(this, "Minimum Workspaces extension disabled", "Workspaces are now static.");
        this.notify(notification);
    },
});


const MinimumWorkspaces = new Lang.Class({
    Name: 'MinimumWorkspaces',
    
    _init: function() {
        
        global.log("Setting Listeners");
        //connect a change listener to the extension preference value of minworkspaces
        this._preferencesSchema = Convenience.getSettings();
        this._numWorkspacesListenerID = this._preferencesSchema.connect("changed::" + "minworkspaces",
            Lang.bind(this, this._onPreferenceChanged));

        
        //access the gnome shell settings via schemas
        let schema = "org.gnome.shell.overrides";
        let schemaSource = GioSSS.get_default();
        let schemaObj = schemaSource.lookup(schema, true);

        if (!schemaObj) {
            global.log("Schema " + schema + " could not be found.");
        }
        else {
            this._settingsSchema = new Gio.Settings({
                settings_schema: schemaObj
            });

            global.log("Activating Dynamic Mode");
            //Activate dynamic workspaces in Gnome Shell Settings
            this._settingsSchema.set_boolean("dynamic-workspaces", true);
            global.log("Dynamic Mode: " + Meta.prefs_get_dynamic_workspaces());
            
            //connect a change listener to the Gnome Shell settings for dynamic workspaces
            this._workspaceSettingListenerID = this._settingsSchema.connect("changed::" + "dynamic-workspaces", 
                Lang.bind(this, this._onWorkspaceSettingChanged));
        }
        //set the minimum number of workspaces
        this._setFixedWorkspaces();
    },

    _onPreferenceChanged: function() {
        if(Meta.prefs_get_dynamic_workspaces()) {
            this._setFixedWorkspaces();
        }
    },

    _onWorkspaceSettingChanged: function() {       
        if(!this._settingsSchema.get_boolean("dynamic-workspaces")) {
            //the user has selected to use static workspaces in the Gnome Shell Settings
            //So we disable this extension
            global.log("User selected static workspaces. Disabling extension.");
            
            let notification = new DisableNotification();
            notification.doNotify();
            
            ExtensionSystem.disableExtension(Me.uuid);
        }
    },

    _setFixedWorkspaces: function() {    
        let min_workspaces;
        //check whether a parameter was passed
        if(arguments[0] !== undefined) {
            min_workspaces = arguments[0];
        }
        else {
            min_workspaces = this._preferencesSchema.get_int("minworkspaces");
        }

        global.log("Setting workspaces: " + min_workspaces);

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
        else { //if we already have enough workspaces make the first ones persistent
            for(let i = 0; i < min_workspaces-1; i++) {
                global.screen.get_workspace_by_index(i)._keepAliveId = true;
            }
        }
        //update the workspace view
        Main.wm._workspaceTracker._checkWorkspaces();
    },

    _destroy: function() {
        this._setFixedWorkspaces(0);
        //disconnect the listeners
        this._preferencesSchema.disconnect(this._numWorkspacesListenerID);
        this._settingsSchema.disconnect(this._workspaceSettingListenerID);
    }
});

function init() {}

let minimumWorkspaces = null;

function enable() {
    global.log("Enabling Extension");
    minimumWorkspaces = new MinimumWorkspaces();
}

function disable() {
    global.log("Disabling Extension");
    minimumWorkspaces._destroy();
}
