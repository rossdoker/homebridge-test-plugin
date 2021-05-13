import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from "homebridge";

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */

// module.exports = (api) => {
//   api.registerAccessory('ExampleTemperatureSensorPlugin', ExampleTemperatureSensorAccessory);
// };
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("ExampleTemperatureSensorAccessory", ExampleTemperatureSensorAccessory);
};

class ExampleTemperatureSensorAccessory implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;

  private readonly accessoryService: Service;
  private readonly informationService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {

    this.log = log;
    this.name = config.name;

    this.accessoryService = new hap.Service.TemperatureSensor(this.name);
    this.accessoryService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, 22);
      })


    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Custom Manufacturer")
      .setCharacteristic(hap.Characteristic.Model, "Custom Model");
  }

  //   private readonly log: Logging;
  //   private readonly name: string;
  //   private switchOn = false;

  //   private readonly switchService: Service;
  //   private readonly informationService: Service;

  //   constructor(log: Logging, config: AccessoryConfig, api: API) {
  //     this.log = log;
  //     this.name = config.name;

  //     log.info('config: ' + JSON.stringify(config));

  //     this.switchService = new hap.Service.Switch(this.name);
  //     this.switchService.getCharacteristic(hap.Characteristic.On)
  //       .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
  //         log.info("Current state of the switch was returned: " + (this.switchOn? "ON": "OFF"));
  //         callback(undefined, this.switchOn);
  //       })
  //       .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
  //         this.switchOn = value as boolean;
  //         log.info("Switch state was set to: " + (this.switchOn? "ON": "OFF"));
  //         callback();
  //       });

  //     this.informationService = new hap.Service.AccessoryInformation()
  //       .setCharacteristic(hap.Characteristic.Manufacturer, "Custom Manufacturer")
  //       .setCharacteristic(hap.Characteristic.Model, "Custom Model");

  //     log.info("Switch finished initializing!");
  //   }

  //   /*
  //    * This method is called directly after creation of this instance.
  //    * It should return all services which should be added to the accessory.
  //    */
  getServices(): Service[] {
    return [
      this.informationService,
      this.accessoryService,
    ];
  }

}
