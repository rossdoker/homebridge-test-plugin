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
  private readonly mqttHost: string;

  private sensorValue: number;

  private readonly mqttClient: mqtt.Client;

  private readonly accessoryService: Service;
  private readonly informationService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {

    // log.info('config: ' + JSON.stringify(config));

    this.log = log;
    this.name = config.name;
    log.info(JSON.stringify(config));
    log.info(config.topic);
    this.topic = config.topic;
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
      }
      // error message if topic is not defined in config
      log.error('Topic is not defined!');
    });
    this.mqttClient.on('message', function (topic, message) {
      log.info('mqtt topic: ' + topic);
      log.info('mqtt message: ' + message.toString());
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
