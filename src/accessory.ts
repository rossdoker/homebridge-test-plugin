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
import mqtt from 'mqtt';

let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("ExampleTemperatureSensorAccessory", ExampleTemperatureSensorAccessory);
};

class ExampleTemperatureSensorAccessory implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private readonly topic: string;
  private readonly valueName: string;
  private readonly mqttHost: string;

  private sensorValue: number;

  private readonly mqttClient: mqtt.Client;

  private readonly accessoryService: Service;
  private readonly informationService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {

    // log.info('config: ' + JSON.stringify(config));

    this.log = log;
    this.name = config.name;
    this.topic = config.topic;
    this.valueName = config.valueName;
    this.mqttHost = config.mqttHost || 'mqtt://localhost';

    this.sensorValue = 0;

    // connect to mqtt server
    this.mqttClient = mqtt.connect(this.mqttHost);
    this.mqttClient.on('connect', () => {
      // subscribe to topic
      if (this.topic) {
        this.mqttClient.subscribe(this.topic, (err) => {
          if (err) log.error(err.message);
        });
      } else {
        // error message if topic is not defined in config
        log.error('Topic is not defined!');
      }
    });
    this.mqttClient.on('message', (topic, message) => {
      if (this.valueName) {
        const data = JSON.parse(message.toString());
        const value = data[this.valueName];
        if (value && typeof value === 'number') {
          this.sensorValue = value; 
        } else {
          // error message if value name is not defined in config
          log.error('Bad value: ' + value);
        }
      } else {
        // error message if value name is not defined in config
        log.error('Value name is not defined!');
      }
      log.info('mqtt topic: ' + topic);
      log.info('mqtt message: ' + message.);
    })

    this.accessoryService = new hap.Service.TemperatureSensor(this.name);
    this.accessoryService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, this.sensorValue);
      })

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Custom Manufacturer")
      .setCharacteristic(hap.Characteristic.Model, "Custom Model");
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.accessoryService,
    ];
  }

}
