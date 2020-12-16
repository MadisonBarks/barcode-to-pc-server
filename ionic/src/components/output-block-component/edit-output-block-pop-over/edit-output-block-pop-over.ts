import { Component, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { Config } from '../../../../../electron/src/config';
import { ApplicationModel } from '../../../models/application.model';
import { barcodeFormatModel } from '../../../models/barcode-format.model';
import { OutputBlockModel } from '../../../models/output-block.model';
import { ElectronProvider } from '../../../providers/electron/electron';

@Component({
  selector: 'edit-output-block-pop-over',
  templateUrl: 'edit-output-block-pop-over.html',
})
export class EditOutputBlockPage {
  public outputBlock: OutputBlockModel;
  public color: string;

  public modifiers: boolean[] = [false, false, false, false];

  public barcodeFormats: barcodeFormatModel[];
  public enableLimitBarcodeFormats = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public ngZone: NgZone,
    private electronProvider: ElectronProvider, // required from the template
    private domSanitizer: DomSanitizer,
  ) {
    this.outputBlock = this.navParams.get('outputBlock');
    this.color = this.navParams.get('color');

    if (this.outputBlock.type == 'key') {
      this.modifiers[0] = this.outputBlock.modifiers.findIndex(x => x == 'alt') != -1;
      this.modifiers[1] = this.outputBlock.modifiers.findIndex(x => x == 'command') != -1;
      this.modifiers[2] = this.outputBlock.modifiers.findIndex(x => x == 'control') != -1;
      this.modifiers[3] = this.outputBlock.modifiers.findIndex(x => x == 'shift') != -1;
    }

    if (this.outputBlock.type == 'barcode') {
      // Restore the ion-toggle state by reading the outputBlock.enabledFormats values
      this.barcodeFormats = JSON.parse(JSON.stringify(barcodeFormatModel.supportedBarcodeFormats));
      if (this.outputBlock.enabledFormats.length != 0) {
        this.barcodeFormats.forEach(barcodeFormat => {
          let enabledFormat = this.outputBlock.enabledFormats.find(x => x == barcodeFormat.name);
          if (enabledFormat) {
            barcodeFormat.enabled = true;
          } else {
            barcodeFormat.enabled = false;
          }
        });
        this.enableLimitBarcodeFormats = true;
      }
    }
  }

  onModifierChange() {
    // copy this.modifiers values to the the outputBlock.modifiers
    let modifiers = [];
    if (this.modifiers[0] == true) modifiers.push('alt');
    if (this.modifiers[1] == true) modifiers.push('command');
    if (this.modifiers[2] == true) modifiers.push('control');
    if (this.modifiers[3] == true) modifiers.push('shift');
    this.outputBlock.modifiers = modifiers;
  }

  onEnableLimitBarcodeFormatsChange() {
    if (this.outputBlock.type == 'barcode') {
      if (!this.enableLimitBarcodeFormats) {
        // Restore the default formats values when the toggle button is enabled
        this.outputBlock.enabledFormats = [];
        this.barcodeFormats = JSON.parse(JSON.stringify(barcodeFormatModel.supportedBarcodeFormats));
      }
    }
  }

  onBarcodeFormatsChange() {
    // copy this.barcodeFormats values to the the outputBlock.enabledFormats
    this.outputBlock.enabledFormats = this.barcodeFormats.filter(x => x.enabled).map(x => x.name);
    this.enableLimitBarcodeFormats = true
    console.log('onBarcodeFormatsChange() => enabled formats=', this.outputBlock.enabledFormats)
  }

  onHelpClick(outputBlock: OutputBlockModel) {
    switch (outputBlock.type) {
      case 'barcode': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      case 'key': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      case 'text': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      case 'variable': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      case 'function': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_JAVASCRIPT_FUNCTION); break;
      case 'barcode': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      case 'delay': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      case 'if': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_IF); break;
      case 'endif': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_IF); break;
      case 'http': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      case 'run': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_RUN); break;
      case 'select_option': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      case 'beep': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      case 'csv_lookup': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CSV_LOOKUP); break;
      case 'alert': this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
      default: this.electronProvider.shell.openExternal(Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE); break;
    }
  }

  onCloseClick() {
    this.viewCtrl.dismiss();
  }

  getUrlTutorialUseVariables() {
    return Config.URL_TUTORIAL_JAVASCRIPT_FUNCTION;
  }

  getUrlTutorialRunPassParameter() {
    return Config.URL_TUTORIAL_RUN_PASS_PARAMETER;
  }

  getUrlSupportedKeyIdentifiers() {
    return Config.URL_SUPPORTED_KEY_IDENTIFIERS;
  }

  async testAudio() {
    // this code is duplicated on the app side (providers/scan.ts)
    let beepSpeed;
    switch (this.outputBlock.beepSpeed) {
      case 'low': beepSpeed = 700; break;
      case 'medium': beepSpeed = 450; break;
      case 'fast': beepSpeed = 250; break;
    }
    let beep = () => {
      return new Promise((resolve, reject) => {
        let audio = new Audio();
        audio.src = 'assets/audio/' + this.outputBlock.value + '.ogg';
        audio.load();
        audio.play();
        setTimeout(() => { resolve() }, beepSpeed);
      });
    };
    for (let i = 0; i < this.outputBlock.beepsNumber; i++) { await beep(); }
  }
}
