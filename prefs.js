/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: tabs -*- */

const Gtk = imports.gi.Gtk;
const Convenience = imports.misc.extensionUtils.getCurrentExtension().imports.convenience;
const Lang = imports.lang;

function init(){}

function buildPrefsWidget() {
    let settings = Convenience.getSettings();
    
    let frame = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        border_width: 10
    });

    let hbox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL
    });

    let vbox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin: 20,
        margin_top: 10
    });

    let settingLabel = new Gtk.Label({
        label: "Minimum number of Workspaces:",
        xalign: 0
    });


    let noWorkspaces = new Gtk.SpinButton({xalign: 0});
    noWorkspaces.set_range(1, 32);
    noWorkspaces.set_value(settings.get_int('minworkspaces'));
    noWorkspaces.set_increments(1, 1);
            
    noWorkspaces.connect('value-changed', function(button){
        let s = button.get_value_as_int();
        settings.set_int('minworkspaces', s);
    });
    
    settingLabel.set_tooltip_text("Define the minimum number of Workspaces.");
    noWorkspaces.set_tooltip_text("Define the minimum number of Workspaces.");

    let  restartGnomeInfo = new Gtk.Label({label: "<i>The extension needs to be disabled and re-enabled for changes to take effect.</i>", use_markup: true, xalign: 2,hexpand:true});

    hbox.pack_start(settingLabel, true, true, 0);
    hbox.add(noWorkspaces);
    
    vbox.add(hbox);

    frame.add(vbox);
    frame.add(restartGnomeInfo);
    frame.show_all();
    return frame;
}


