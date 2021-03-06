import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  Characteristic,
  HAP,
  Logging,
  Service
} from "homebridge";
import mqtt from 'mqtt';

let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("MQTTSensor", MQTTSensorAccessory);
};

class MQTTSensorAccessory implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private readonly topic: string;
  private readonly valueName: string;
  private readonly batteryStatusValueName: string;
  private readonly mqttHost: string;
  private readonly sensorType: string;

  private sensorValue: number;
  private batteryValue: number;

  private readonly mqttClient: mqtt.Client;

  private readonly accessoryService: Service;
  private readonly informationService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {

    this.log = log;
    this.name = config.name;
    this.topic = config.topic;
    this.valueName = config.valueName;
    this.batteryStatusValueName = config.batteryStatusValueName;
    this.sensorType = config.sensorType;
    this.mqttHost = config.mqttHost || 'mqtt://localhost';

    this.sensorValue = 0;
    this.batteryValue = Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

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
      // read value
      if (this.valueName) {
        const data = JSON.parse(message.toString());
        const value = data[this.valueName];
        if (value && typeof value === 'number') {
          this.sensorValue = value;
        } else {
          // error message if value is invalid
          log.error('Bad value: ' + value);
        }
      } else {
        // error message if value name is not defined in config
        log.error('Value name is not defined!');
      }

      // read battery if needed
      if (this.batteryStatusValueName) {
        const data = JSON.parse(message.toString());
        const batteryValue = data[this.batteryStatusValueName];
        if (batteryValue && typeof batteryValue === 'number') {
          this.batteryValue = batteryValue <= 15 ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
        } else {
          // error message if value is invalid
          log.error('Bad value: ' + batteryValue);
        }
      }
    })

    this.accessoryService = new hap.Service.HumiditySensor(this.name);

    if (
      this.sensorType === 'humidity' ||
      this.sensorType === 'temperature'
    ) {
      if (this.sensorType === 'humidity') {
        this.accessoryService = new hap.Service.HumiditySensor(this.name);
        this.accessoryService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
        .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
          callback(undefined, this.sensorValue);
        })
      } else if (this.sensorType === 'temperature') {
        this.accessoryService = new hap.Service.TemperatureSensor(this.name);
        this.accessoryService.getCharacteristic(hap.Characteristic.CurrentTemperature)
        .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
          callback(undefined, this.sensorValue);
        })
      }
    } else {
      log.error('Unsupported sensor type!');
    }

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
