import { Component, HostListener, NgZone, ViewChild } from '@angular/core';
import ElectronStore from 'electron-store';
import { Alert, AlertButton, AlertController, Events, Navbar, NavController, NavParams } from 'ionic-angular';
import { DragulaService } from "ng2-dragula";
import { Config } from '../../../../electron/src/config';
import { OutputBlockModel } from '../../models/output-block.model';
import { OutputProfileModel } from '../../models/output-profile.model';
import { SettingsModel } from '../../models/settings.model';
import { ElectronProvider } from '../../providers/electron/electron';
import { LicenseProvider } from '../../providers/license/license';

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {
  @ViewChild(Navbar) navBar: Navbar;

  public unsavedSettingsAlert: Alert;
  public settings: SettingsModel = new SettingsModel();
  public availableOutputBlocks: OutputBlockModel[] = this.getAvailableOutputBlocks();

  private lastSavedSettings: string;
  private store: ElectronStore;

  public selectedOutputProfile = 0;


  private getAvailableOutputBlocks(): OutputBlockModel[] {
    // Warning: update scan.model.ts/ToString() and ToCSV() when changing the
    // array below and also enforce compatibility with the previous versions by
    // adding an upgrade script in the app.component.ts/upgrade() method.
    return [
      // KEYS
      { name: 'BACKSPACE', value: 'backspace', type: 'key', modifiers: [] },
      { name: 'DELETE', value: 'delete', type: 'key', modifiers: [] },
      { name: 'ALT', value: 'ALT', type: 'key', modifiers: [] },
      // Warning: keep in sync with settings.model.ts
      { name: 'ENTER', value: 'enter', type: 'key', modifiers: [] },
      { name: 'TAB', value: 'tab', type: 'key', modifiers: [] },
      { name: 'ESCAPE', value: 'escape', type: 'key', modifiers: [] },
      { name: '&uarr;', value: 'up', type: 'key', modifiers: [] },
      { name: '&rarr;', value: 'right', type: 'key', modifiers: [] },
      { name: '&darr;', value: 'down', type: 'key', modifiers: [] },
      { name: '&larr;', value: 'left', type: 'key', modifiers: [] },
      { name: 'HOME', value: 'home', type: 'key', modifiers: [] },
      { name: 'END', value: 'end', type: 'key', modifiers: [] },
      { name: 'PAGEUP', value: 'pageup', type: 'key', modifiers: [] },
      { name: 'PAGEDOWN', value: 'pagedown', type: 'key', modifiers: [] },
      { name: 'COMMAND', value: 'command', type: 'key', modifiers: [] },
      { name: 'ALT', value: 'alt', type: 'key', modifiers: [] },
      { name: 'CONTROL', value: 'control', type: 'key', modifiers: [] },
      { name: 'SHIFT', value: 'shift', type: 'key', modifiers: [] },
      { name: 'RIGHT_SHIFT', value: 'right_shift', type: 'key', modifiers: [] },
      { name: 'SPACE', value: 'space', type: 'key', modifiers: [] },
      { name: 'Custom key', value: '', type: 'key', modifiers: [], editable: true },

      // VARIABLES
      { name: 'TIMESTAMP', value: 'timestamp', type: 'variable', skipOutput: false },
      { name: 'DATE', value: 'date', type: 'variable', skipOutput: false },
      { name: 'TIME', value: 'time', type: 'variable', skipOutput: false },
      { name: 'DATE_TIME', value: 'date_time', type: 'variable', skipOutput: false },
      { name: 'SCAN_SESSION_NAME', value: 'scan_session_name', type: 'variable', skipOutput: false },
      // { name: 'SCAN_INDEX', value: 'scan_index', type: 'variable', skipOutput: false },
      { name: 'DEVICE_NAME', value: 'deviceName', type: 'variable', skipOutput: false },
      { name: 'NUMBER', value: 'number', type: 'variable', editable: true, skipOutput: false, label: null, filter: null, errorMessage: null, defaultValue: '1' },
      { name: 'TEXT', value: 'text', type: 'variable', editable: true, skipOutput: false, label: null, filter: null, errorMessage: null, defaultValue: null },
      // Warning: keep in sync with settings.model.ts
      { name: 'BARCODE', value: 'BARCODE', type: 'barcode', editable: true, skipOutput: false, label: null, enabledFormats: [], filter: null, errorMessage: null },

      // VARIABLE
      { name: 'Static text', value: '', type: 'text', editable: true },

      // DELAY
      { name: 'Delay', value: '', type: 'delay', editable: true },


      // CONSTRUCTS
      { name: 'IF', value: '', type: 'if', editable: true },
      { name: 'ENDIF', value: 'endif', type: 'endif' },

      // OTHER
      { name: 'JavaScript function', value: '', type: 'function', editable: true, skipOutput: false },
      { name: 'SELECT_OPTION', value: '', type: 'select_option', skipOutput: false },
      { name: 'HTTP', value: '', type: 'http', httpMethod: 'get', httpData: null, httpParams: null, httpHeaders: null, editable: true, skipOutput: false, timeout: 10000 },
      { name: 'RUN', value: '', type: 'run', editable: true, skipOutput: false, timeout: 10000 },
      { name: 'CSV_LOOKUP', value: '{{ barcode }}', type: 'csv_lookup', skipOutput: false, editable: true, csvFile: '', searchColumn: 1, resultColumn: 2, notFoundValue: '', delimiter: ',' },
      { name: 'BEEP', value: 'beep', type: 'beep', editable: true, beepsNumber: 1, beepSpeed: 'medium' },
      { name: 'ALERT', value: '', type: 'alert', editable: true, alertTitle: 'Alert', alertDiscardScanButton: 'Discard scan', alertScanAgainButton: 'Scan again', alertOkButton: 'Ok' },
    ];
  }


  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private dragulaService: DragulaService,
    private electronProvider: ElectronProvider,
    private licenseProvider: LicenseProvider,
    private alertCtrl: AlertController,
    public events: Events,
    private ngZone: NgZone,
  ) {
    this.store = new this.electronProvider.ElectronStore();
    this.dragulaService.destroy('dragula-group')
    this.dragulaService.createGroup('dragula-group', {
      copy: (el, source) => {
        return source.id === 'left';
      },
      accepts: (el, target, source, sibling) => {
        // To avoid dragging from right to left container
        return target.id !== 'left';
      },
      copyItem: (item: OutputBlockModel) => {
        return JSON.parse(JSON.stringify(item));
      },
      removeOnSpill: true
    });

    this.dragulaService.dropModel('dragula-group').subscribe(({ name, el, target, source, sibling, item, sourceModel, targetModel, }) => {
      if (item.value == 'number') {
        if (!this.licenseProvider.canUseNumberParameter(true)) {
          setTimeout(() => this.settings.outputProfiles[this.selectedOutputProfile].outputBlocks = this.settings.outputProfiles[this.selectedOutputProfile].outputBlocks.filter(x => x.value != 'number'), 1000)
        }
      }
    });
  }

  public getAppName() {
    return Config.APP_NAME;
  }

  public canAddMoreComponents() {
    return this.settings.outputProfiles[this.selectedOutputProfile].outputBlocks.length < this.licenseProvider.getNOMaxComponents();
  }

  public onSubscribeClick() {
    this.licenseProvider.showPricingPage('customOutputFieldOnSubscribeClick');
  }

  ionViewDidLoad() {
    this.settings = this.store.get(Config.STORAGE_SETTINGS, new SettingsModel());
    this.lastSavedSettings = JSON.stringify(this.settings);
    this.navBar.backButtonClick = (e: UIEvent) => {
      this.goBack();
    }
  }

  // willExit -> apply

  onApplyClick() {
    this.apply();
  }

  onRestoreDefaultSettingsClick() {
    this.alertCtrl.create({
      title: 'Are you sure?', message: 'Do you really want to restore the default settings? This cannot be undone', buttons: [{ text: 'Cancel', role: 'cancel' }, {
        text: 'Restore', handler: (opts) => {
          this.settings = new SettingsModel();
          this.apply();
        }
      }]
    }).present();
  }

  apply(pop = false) {
    let noIfs = this.settings.outputProfiles[this.selectedOutputProfile].outputBlocks.filter(x => x.type == 'if').length;
    let noEndIfs = this.settings.outputProfiles[this.selectedOutputProfile].outputBlocks.filter(x => x.type == 'endif').length;
    if (noIfs != noEndIfs) {
      let buttons: AlertButton[] = [{ text: 'OK', role: 'cancel', },];
      if (pop) {
        buttons.unshift({ text: 'Discard', handler: () => { this.navCtrl.pop(); } });
      }
      this.alertCtrl.create({
        title: 'Syntax error',
        message: 'The number of IF output components should be the same of the ENDIFs',
        buttons: buttons
      }).present();
      return false;
    }

    this.store.set(Config.STORAGE_SETTINGS, this.settings);
    if (this.electronProvider.isElectron()) {
      this.electronProvider.app.setLoginItemSettings({
        openAtLogin: (this.settings.openAutomatically == 'yes' || this.settings.openAutomatically == 'minimized'),
        openAsHidden: this.settings.openAutomatically == 'minimized'
      })
    }
    this.lastSavedSettings = JSON.stringify(this.settings);
    if (this.electronProvider.isElectron()) {
      this.electronProvider.ipcRenderer.send('settings');
    }

    if (pop) {
      this.navCtrl.pop();
    }
  }

  onEditOutputProfileNameClick() {
    let currentProfile = this.settings.outputProfiles[this.selectedOutputProfile];
    this.alertCtrl.create({
      title: 'Output template name',
      // message: 'Inse',
      enableBackdropDismiss: false,
      inputs: [{ name: 'name', type: 'text', placeholder: currentProfile.name, value: currentProfile.name }],
      buttons: [{
        role: 'cancel', text: 'Cancel',
        handler: () => { }
      }, {
        text: 'Ok',
        handler: data => {
          if (data.name != "") {
            this.settings.outputProfiles[this.selectedOutputProfile].name = data.name;
          }
        }
      }]
    }).present();
  }

  onDeleteOutputTemplateClick() {
    if (this.settings.outputProfiles.length <= 1) {
      return;
    }

    this.alertCtrl.create({
      title: 'Delete Output template',
      message: 'Are you sure?',
      buttons: [{
        text: 'Yes',
        handler: () => {
          // change the selected OutputProfile
          let selectedIndex = this.selectedOutputProfile;
          this.selectedOutputProfile = selectedIndex == 0 ? selectedIndex : selectedIndex - 1;

          // remove the selected OutputProfile
          this.settings.outputProfiles = this.settings.outputProfiles.filter((x, index) => index != selectedIndex);
        }
      }, {
        text: 'Cancel',
        role: 'cancel',
        handler: () => { }
      }]
    }).present();
  }

  onExportOutputTemplateClick() {
    let outputProfile = this.settings.outputProfiles[this.selectedOutputProfile];
    outputProfile.version = this.electronProvider.app.getVersion()

    this.electronProvider.dialog.showSaveDialog(this.electronProvider.remote.getCurrentWindow(), {
      title: "Select the location",
      defaultPath: outputProfile.name + '.btpt',
      buttonLabel: "Save",
      filters: [{ name: 'Barcode to PC Output Template', extensions: ['btpt',] }],
    }, (filename, bookmark) => {
      if (!filename) return;
      const fs = this.electronProvider.remote.require('fs');
      fs.writeFileSync(filename, JSON.stringify(outputProfile), 'utf-8');
    });
  }

  onImportOutputTemplateClick() {
    let filePaths = this.electronProvider.dialog.showOpenDialog(this.electronProvider.remote.getCurrentWindow(), {
      title: 'Select the Output Template file',
      buttonLabel: 'Select',
      defaultPath: this.electronProvider.app.getPath('desktop'),
      filters: [{ name: 'Output Template Files', extensions: ['btpt'] }],
      properties: ['openFile', 'createDirectory', 'promptToCreate',]
    });

    const fs = this.electronProvider.remote.require('fs');
    fs.readFile(filePaths[0], 'utf-8', (err, data) => {
      if (err) return console.log(err);
      this.addOutputTemplate(JSON.parse(data));
    });
  }

  onNewOutputTemplateClick() {
    let newTemplateName = 'Output template ' + (this.settings.outputProfiles.length + 1);
    this.alertCtrl.create({
      title: 'New Output template',
      message: 'Insert the Output template name',
      enableBackdropDismiss: false,
      inputs: [{ name: 'name', type: 'text', placeholder: newTemplateName }],
      buttons: [{
        role: 'cancel', text: 'Cancel',
        handler: () => { }
      }, {
        text: 'Ok',
        handler: data => {
          if (data.name != "") {
            newTemplateName = data.name;
          }
          let outputTemplate: OutputProfileModel = {
            name: newTemplateName,
            version: null,
            outputBlocks: new SettingsModel().outputProfiles[0].outputBlocks
          };
          this.addOutputTemplate(outputTemplate)
        }
      }]
    }).present();
  }

  addOutputTemplate(outputTemplate) {
    // push isn't working, so we're using the spread operator (duplicated issue on the app.compoennt.ts file)
    this.settings.outputProfiles = [...this.settings.outputProfiles, outputTemplate];
    this.selectedOutputProfile = this.settings.outputProfiles.length - 1;
  }

  private _settingsChanged = false;
  private settingsChangedDebounceTimeout = null;
  settingsChanged() {
    if (this.settingsChangedDebounceTimeout != null) clearTimeout(this.settingsChangedDebounceTimeout);
    this.settingsChangedDebounceTimeout = setTimeout(() => { this._settingsChanged = this.lastSavedSettings != JSON.stringify(this.settings) }, 200)
    return this._settingsChanged;
  }

  goBack() {
    if (!this.settingsChanged()) { // settings up to date
      this.navCtrl.pop();
    } else { // usnaved settings
      this.unsavedSettingsAlert = this.alertCtrl.create({
        title: 'Unsaved settings',
        message: 'Do you want to save and apply the settings?',
        buttons: [{
          text: 'Save & Apply',
          handler: () => {
            this.apply(true);
          }
        }, {
          text: 'Discard',
          role: 'cancel',
          handler: () => {
            this.navCtrl.pop();
          }
        }]
      });
      this.unsavedSettingsAlert.present();
    }
  }

  onSelectCSVPathClick() {
    let defaultPath = this.settings.csvPath;
    if (!defaultPath) {
      defaultPath = this.electronProvider.app.getPath('desktop')
    }

    let filePaths = this.electronProvider.dialog.showOpenDialog(this.electronProvider.remote.getCurrentWindow(), {
      title: 'Select the CSV file path',
      buttonLabel: 'Select',
      defaultPath: defaultPath,
      filters: [
        { name: 'Text files', extensions: ['txt', 'csv', 'log'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile', 'createDirectory', 'promptToCreate',]
    });

    if (filePaths && filePaths.length) {
      this.settings.csvPath = filePaths[0];
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.keyCode == 27 && !this.unsavedSettingsAlert && this.electronProvider.isDev) { // esc
      this.goBack();
    }
  }

  onCSVClick() {
    if (this.settings.appendCSVEnabled) {
      if (!this.licenseProvider.canUseCSVAppend(true)) {
        setTimeout(() => this.settings.appendCSVEnabled = false, 1000)
      }
    }
  }

  onOpenAutomaticallyChange() {
    if (this.settings.openAutomatically == 'minimized' && this.electronProvider.process.platform === 'darwin') {
      this.settings.enableTray = true;
    }
  }
}
