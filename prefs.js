/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: tabs -*- */

const Gtk = imports.gi.Gtk;
const Convenience = imports.misc.extensionUtils.getCurrentExtension().imports.convenience;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('minimum-workspaces');
const _ = Gettext.gettext;

function init(){
    Convenience.initTranslations("minimum-workspaces");
}

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
        label: _("Minimum number of Workspaces:"),
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
    
    settingLabel.set_tooltip_text(_("Define the minimum number of Workspaces."));
    noWorkspaces.set_tooltip_text(_("Define the minimum number of Workspaces."));

    hbox.pack_start(settingLabel, true, true, 0);
    hbox.add(noWorkspaces);
    
    vbox.add(hbox);

    frame.add(vbox);
    frame.show_all();
    return frame;
}


