// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GioSSS = Gio.SettingsSchemaSource;
const GLib = imports.gi.GLib;
const MessageTray = imports.ui.messageTray;
const Gettext = imports.gettext.domain('minimum-workspaces');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const ExtensionSystem = imports.ui.extensionSystem;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const GNOME_SHELL_SCHEMA = "org.gnome.shell";
const GNOME_ENABLED_EXTENSIONS_KEY = ExtensionSystem.ENABLED_EXTENSIONS_KEY;
const GNOME_WORKSPACE_SETTINGS_SCHEMA = "org.gnome.shell.overrides";
const GNOME_DYNAMIC_WORKSPACES_KEY = "dynamic-workspaces";

const MINIMUM_WORKSPACES_KEY = "minworkspaces";


const DisableNotification = new Lang.Class({
    Name: 'DisableNotification',
    Extends: MessageTray.Source,

    _init: function() {
        this.parent('', 'minimum-workspaces-disabled');
        Main.messageTray.add(this);
    },
    doNotify: function() {
        let notification = new MessageTray.Notification(this, _("Minimum Workspaces extension disabled"), _("Workspaces are now static."));
        this.notify(notification);
    },
});


const MinimumWorkspaces = new Lang.Class({
    Name: 'MinimumWorkspaces',
    
    _init: function() {
        //connect a change listener to the extension preference value of minworkspaces
        this._preferencesSchema = Convenience.getSettings();
        this._numWorkspacesListenerID = this._preferencesSchema.connect("changed::" + MINIMUM_WORKSPACES_KEY,
            Lang.bind(this, this._onPreferenceChanged));
        
        //access the gnome shell settings via schemas
        let schemaSource = GioSSS.get_default();
        let schemaObj = schemaSource.lookup(GNOME_WORKSPACE_SETTINGS_SCHEMA, true);

        if (!schemaObj) {
            global.log("Schema " + GNOME_WORKSPACE_SETTINGS_SCHEMA + " could not be found.");
        }
        else {
            this._settingsSchema = new Gio.Settings({
                settings_schema: schemaObj
            });
            
            //Activate dynamic workspaces in Gnome Shell Settings
            this._settingsSchema.set_boolean(GNOME_DYNAMIC_WORKSPACES_KEY, true);
            
            //connect a change listener to the Gnome Shell settings for dynamic workspaces
            this._workspaceSettingListenerID = this._settingsSchema.connect("changed::" + GNOME_DYNAMIC_WORKSPACES_KEY, 
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
        //the user has selected to use static workspaces, so we disable this extension

            //Show a notification for the user
            let notification = new DisableNotification();
            notification.doNotify();
            
            //Disable the extension
            ExtensionSystem.disableExtension(Me.uuid);

            /**************************************************************************************************
            * The above call does not properly disable the extension, therefore we have to manually remove 
            * the Extension UUID from the ExtensionSystem instance and the Shell Schema
            ***************************************************************************************************/

            for(let i = 0; i < ExtensionSystem.enabledExtensions.length; i++) {
                if (ExtensionSystem.enabledExtensions[i] === Me.uuid) {
                    ExtensionSystem.enabledExtensions.splice(i, 1);
                }  
            }

            let schemaSource = GioSSS.get_default();
            let schemaObj = schemaSource.lookup(GNOME_SHELL_SCHEMA, true);

            if (!schemaObj) {
                global.log("Schema " + GNOME_SHELL_SCHEMA + " could not be found.");
            }
            else {
                let extensionSettingsSchema = new Gio.Settings({
                    settings_schema: schemaObj
                });

                //get all enabled extensions
                let list = extensionSettingsSchema.get_value(GNOME_ENABLED_EXTENSIONS_KEY).deep_unpack();
                
                //find this extension (minimum-workspaces@philbot9.github.com)...
                for(let i = 0; i < list.length; i++) {
                    if(list[i] === Me.uuid) {
                        //...and remove it from the list
                        list.splice(i, 1);
                    }
                }
                //Replace the enabled extensions list in the schema with our "list" array.
                extensionSettingsSchema.set_value(GNOME_ENABLED_EXTENSIONS_KEY, new GLib.Variant('as', list));
            }
            this._destroy();
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
        //remove all fixed workspaces
        this._setFixedWorkspaces(0);
        
        //disconnect the listeners
        this._preferencesSchema.disconnect(this._numWorkspacesListenerID);
        this._settingsSchema.disconnect(this._workspaceSettingListenerID);
    }
});

function init() {
    Convenience.initTranslations("minimum-workspaces");
}

let minimumWorkspaces = null;
function enable() {
    minimumWorkspaces = new MinimumWorkspaces();
}

function disable() {
    minimumWorkspaces._destroy();
}
