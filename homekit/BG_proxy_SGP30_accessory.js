// ============================================================================================
// --- BREAKOUT GARDENER :: PROXIES TO APPLE HOMEKIT :: SGP30 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

// ### NOTE: This file is supposed to be used separately from Breakout Gardener itself, as a
// (proxied) virtual HomeKit accessory for HAP-NodeJS -> https://github.com/KhaosT/HAP-NodeJS

var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var http = require('http');
const hostBG = 'http://localhost:9091/'; // This should match Breakout Gardener's host and configured Prometheus exposure server port (default 9091)
const checkEverySeconds = 60; // How often in seconds we should poll BG for new readings (nb. since this is for basic air quality reporting only, a 1 minute interval should be good enough)

// ================================================================================

var SGP30 = {
  name: "SGP30", // Name of accessory (changeable by the user)
  pincode: "031-45-154", // Pin code of accessory -> "Default" HAP-NodeJS accessory pin code
  username: "B4:2E:49:D2:94:5C", // MAC like address used by HomeKit to differentiate accessories
  manufacturer: "homekit.xoblite.net", // Manufacturer (optional)
  model: "SGP30", // Model (optional, not changeable by the user)
  // hardwareRevision: "1.0", // Hardware version (optional)
  firmwareRevision: "19.5.30", // Firmware version (optional)
  serialNumber: "HAP-NodeJS", // Serial number (optional)
  outputLogs: true, // Enable logging to the console?
}

// ================================================================================

var sgp30_iaq_level = 1, sgp30_tvoc = 0.0, sgp30_co2eq = 0; // sgp30_ethanol = 0, sgp30_hydrogen = 0;

function GetFromBG()
{
    http.get(hostBG, (res) =>
    {
        const { statusCode } = res;
        if (statusCode == 200)
        {
            res.setEncoding('utf8');
            var buffer = '';
            res.on('data', (chunk) => { buffer += chunk; });
            res.on('end', () =>
            {
                var entries = buffer.split("\n");
                for (var n=0; n<entries.length; n++)
                {
                    if (entries[n].startsWith('sgp30'))
                    {
                        if (entries[n].startsWith('sgp30_iaq_level')) sgp30_iaq_level = parseInt(entries[n].slice(16));
                        if (entries[n].startsWith('sgp30_tvoc')) sgp30_tvoc = (parseInt(entries[n].slice(11)) / 220); // Note: HomeKit wants VOC density values in µg/m3, so we need to divide the PPB value by 220 as per Sensirion's SGP30 application note -> https://www.sensirion.com/fileadmin/user_upload/customers/sensirion/Dokumente/9_Gas_Sensors/Sensirion_Gas_Sensors_SGP3x_TVOC_Concept.pdf
                        if (entries[n].startsWith('sgp30_co2eq')) sgp30_co2eq = parseInt(entries[n].slice(12));
                        // if (entries[n].startsWith('sgp30_ethanol')) sgp30_ethanol = parseInt(entries[n].slice(14)); // Not relevant for HomeKit
                        // if (entries[n].startsWith('sgp30_hydrogen')) sgp30_hydrogen = parseInt(entries[n].slice(15)); // Not relevant for HomeKit
                    }
                }

                if (SGP30.outputLogs)
                {
                    var tempString = "SGP30 (proxied) -> TVOC \x1b[100;97m " + Math.round(sgp30_tvoc*220) + " PPB (" +  sgp30_tvoc.toFixed(2) + " µg/m3) \x1b[0m / CO2eq \x1b[100;97m " + sgp30_co2eq + " PPM \x1b[0m / IAQ Level \x1b[107;30m ";
                    if (sgp30_iaq_level == 5) tempString += "5 (Unhealthy) \x1b[0m.";
                    else if (sgp30_iaq_level == 4) tempString += "4 (Poor) \x1b[0m.";
                    else if (sgp30_iaq_level == 3) tempString += "3 (Moderate) \x1b[0m.";
                    else if (sgp30_iaq_level == 2) tempString += "2 (Good) \x1b[0m.";
                    else tempString += "1 (Excellent) \x1b[0m.";
                    console.log(tempString);
            
                    // console.log("SGP30 (proxied) -> Ethanol " + sgp30_ethanol + " ppm / Hydrogen " + sgp30_hydrogen + " ppm."); // Not relevant for HomeKit
                }

                // Report the current values it back to HomeKit...
                virtualAccessory.getService(Service.AirQualitySensor, "SGP30 IAQ").setCharacteristic(Characteristic.AirQuality, sgp30_iaq_level);
                virtualAccessory.getService(Service.AirQualitySensor, "SGP30 IAQ").setCharacteristic(Characteristic.VOCDensity, sgp30_tvoc);
                virtualAccessory.getService(Service.AirQualitySensor, "SGP30 IAQ").setCharacteristic(Characteristic.CarbonDioxideLevel, sgp30_co2eq);
            })
        }
        else { res.resume(); return; }
    }).on('error', (msg) => {
        console.log("%s (proxied) -> HTTP ERROR -> %s", SGP30.name, msg);
    });
}

// ================================================================================

console.log("%s (proxied) -> INFO -> Starting: Running on HomeCore (HAP-NodeJS) %s / Node.js %s.", SGP30.name, require('../package.json').version, process.version);

// Create our virtual HomeKit accessory...
var virtualUUID = uuid.generate('hap-nodejs:accessories:airqualitysensor' + SGP30.name);
var virtualAccessory = exports.accessory = new Accessory(SGP30.name, virtualUUID);

// Add stand-alone accessory properties for publishing, i.e. in case we're using Core.js (->non-bridged accessory) and not BridgedCore.js (->bridged accessory) when starting HAP-NodeJS...
virtualAccessory.username = SGP30.username;
virtualAccessory.pincode = SGP30.pincode;
console.log("%s (proxied) -> INFO -> If not bridged, the HomeKit pincode for this accessory is \x1b[44m\x1b[37m %s \x1b[0m.", SGP30.name, SGP30.pincode);

// Set accessory information characteristics...
virtualAccessory
  .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, SGP30.manufacturer)
    .setCharacteristic(Characteristic.Model, SGP30.model)
    // .setCharacteristic(Characteristic.HardwareRevision, SGP30.hardwareRevision)
    .setCharacteristic(Characteristic.FirmwareRevision, SGP30.firmwareRevision)
    .setCharacteristic(Characteristic.SerialNumber, SGP30.serialNumber);

// Respond to any identification requests from HomeKit...
virtualAccessory.on('identify', function(paired, callback) {
  if (this.outputLogs) console.log("%s (proxied) -> IDENTIFY -> Hello world! :)", SGP30.name);
  callback();
});

// ====================

// Add applicable HomeKit Services for our accessory...
virtualAccessory
  .addService(Service.AirQualitySensor, "SGP30 Air Quality")
    .setCharacteristic(Characteristic.AirQuality, sgp30_iaq_level)
    .getCharacteristic(Characteristic.AirQuality)
        .on('get', function(callback) { callback(null, sgp30_iaq_level); });
virtualAccessory
  .getService(Service.AirQualitySensor, "SGP30 Air Quality")
    .setCharacteristic(Characteristic.VOCDensity, sgp30_tvoc)
    .getCharacteristic(Characteristic.VOCDensity)
        .on('get', function(callback) { callback(null, sgp30_tvoc); })
virtualAccessory
  .getService(Service.AirQualitySensor, "SGP30 Air Quality")
    .setCharacteristic(Characteristic.CarbonDioxideLevel, sgp30_co2eq)
    .getCharacteristic(Characteristic.CarbonDioxideLevel)
        .on('get', function(callback) { callback(null, sgp30_co2eq); });

// And finally, start reading device data via Breakout Gardener
// continously into our proxy's buffer and reporting it back to HomeKit...
GetFromBG();
var pollBGInterval = null;
pollBGInterval = setInterval(GetFromBG, checkEverySeconds*1000);

// ================================================================================

// Anything to clean up before exit?
process.on('SIGINT', (code) => {
    if (SGP30.outputLogs) console.log(`%s -> INFO -> Exiting [${code}].`, SGP30.name);
    clearInterval(pollBGInterval);
});
process.on('SIGTERM', (code) => {
    if (SGP30.outputLogs) console.log(`%s -> INFO -> Exiting [${code}].`, SGP30.name);
    clearInterval(pollBGInterval);
});

// ================================================================================
