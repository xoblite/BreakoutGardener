// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: DS18B20 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const { exec } = require('child_process');
const SH1107 = require('./SH1107.js');
const IS31FL3731 = require('./IS31FL3731.js');

module.exports = {
	Identify: Identify,
	IsAvailable: IsAvailable,
	Start: Start,
	Stop: Stop,
	Get: Get,
	Log: Log,
	Display: Display
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === Maxim Integrated DS18B20 1-Wire Digital Thermometer ===
// * Product Page -> https://www.maximintegrated.com/en/products/sensors/DS18B20.html
// * Datasheet -> https://datasheets.maximintegrated.com/en/ds/DS18B20.pdf
// ----------------------------------------------------------------------------------------

var temperatureSensors = [];
var temperatureValues = [];
var updateInterval = null;
var busyUpdating = false;
var outputLogs = false, showDebug = false;

// ====================

function Identify(sensors)
{
	if (sensors.length == 0) return;

	var fs = require('fs');

    for (var n = 0; n < sensors.length; n++)
    {
		var file = '/sys/bus/w1/devices/' + sensors[n] + '/w1_slave';
		if (fs.existsSync(file))
		{
			// DS18B20 sensor found, add an array entry for it...
			temperatureSensors.push(sensors[n]);
			temperatureValues.push(0.0);
		}
		else console.log("Breakout Gardener -> \x1b[31mERROR\x1b[0m -> No DS18B20 device found at the configured 1-Wire address %s!", sensors[n]);
	}

	if (temperatureSensors.length > 0)
	{
		console.log("Breakout Gardener -> INFO -> %s non-I2C device(s) found:\n", temperatureSensors.length);
		for (var n = 0; n < temperatureSensors.length; n++)
		{
			console.log("   • \x1b[32mDS18B20\x1b[0m digital thermometer found at 1-Wire address %s.", sensors[n]);
		}
		console.log("");
	}
}

// ====================

function IsAvailable()
{
	if (temperatureSensors.length) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	if (temperatureSensors.length == 0) return;

	Update(); // Perform a first update to have valid readings from the start

	// Since reading across the DS18B20 1-wire interface is quite slow,
	// let's update our readings asynchronously every 10 seconds instead...
	updateInterval = setInterval(Update, 10000);
}

function Stop() { clearInterval(updateInterval); }

// ====================

function ReadSensor(sensor, id, command, callback) // Helper function to Update()
{
	// Note: We do not want to run this command synchronously since it's quite slow
	// and will block the Node.js event loop while busy, so we have to use a regular
	// asynchronous exec command plus a callback function (see below) instead
	exec(command, function(err, stdout, stderr) {
		if (err)
		{
			if (outputLogs) console.log("Breakout Gardener -> DS18B20 -> \x1b[31mERROR\x1b[0m -> Temperature could not be read from %s!", id);
			callback(sensor, "0.0");
		}
		else callback(sensor, stdout);
	});	
}

function Update()
{
	busyUpdating = true;

    for (var n = 0; n < temperatureSensors.length; n++)
    {
		var command = 'cat /sys/bus/w1/devices/' + temperatureSensors[n] + '/w1_slave';

		ReadSensor(n, temperatureSensors[n], command, function (sensor, data) { 
			var str = data.toString(); // Convert result to string
			var i = str.indexOf(' t=') + 3; // Find the temperature in the output
			var value = str.substring(i).trim(); // Trim any trailing whitespaces etc
			var degrees = parseInt(value) / 1000; // Parse value to temperature (float)

			// Apply some minor adjustments roughly matching the typical error /
			// performance curve included in the DS18B20 datasheet
			// See https://datasheets.maximintegrated.com/en/ds/DS18B20.pdf ,
			// page 3 figure 1 (nb figure 17 in older revisions of the datasheet)
			if (degrees <= 0) degrees += 0.1;
			else if (degrees < 10) degrees += 0.15;
			else if (degrees < 30) degrees += 0.2;
			else if (degrees < 40) degrees += 0.15;
			else if (degrees < 50) degrees += 0.10;
			else if (degrees < 60) degrees += 0.05;
			else if (degrees >= 60) degrees -= 0.05;
	
			temperatureValues[sensor] = degrees.toFixed(1);
		});
	}

	busyUpdating = false;
}

// ====================

function Get()
{
//	while (busyUpdating) await sleep(10);
    return temperatureValues;
}

// ====================

function Log()
{
	if (temperatureValues.length > 1) console.log("Breakout Gardener -> DS18B20 -> Temperature -> Indoors \x1b[97;104m %s °C \x1b[0m / Outdoors \x1b[97;104m %s °C \x1b[0m.", temperatureValues[0], temperatureValues[1]);
	else if (temperatureValues.length == 1) console.log("Breakout Gardener -> DS18B20 -> Temperature -> \x1b[97;104m %s °C \x1b[0m.", temperatureValues[0]);
}

// ====================

function Display(refreshAll)
{
	var data = Get();

	// ====================

	if (SH1107.IsAvailable())
	{
		if (refreshAll)
		{
			SH1107.Off();
			SH1107.Clear();
			if (data.length > 0) SH1107.DrawTextSmall("INDOORS", 4, 1, false);
			if (data.length > 1)
			{
				SH1107.DrawSeparatorLine(7);
				SH1107.DrawTextSmall("OUTDOORS", 4, 8, false);
			}
			SH1107.DrawTextSmall("WIRED (DS18B20)", 17, 16, false);
		}
	
		if (data.length > 0)
		{
			var textString = data[0] + ' *C';
			SH1107.DrawTextMedium(textString, 24, 3, true);
		}
		if (data.length > 1)
		{
			textString = data[1] + ' *C';
			SH1107.DrawTextMedium(textString, 24, 10, true);
		}
	
		if (refreshAll) SH1107.On();
	}

	// ====================

	if (IS31FL3731.IsAvailable())
	{
		// Let's draw something else than a temperature indicator for this one...
		// It's mostly nice weather indoors, so how about a sunny day icon? =]
		const icon = [0x000088, 0x000088, 0x888800, 0x000088, 0x000088,
					  0x000088, 0x888800, 0x888800, 0x888800, 0x000088,
					  0x888800, 0x888800, 0x888800, 0x888800, 0x888800,
					  0x000088, 0x888800, 0x888800, 0x888800, 0x000088,
					  0x000088, 0x000088, 0x888800, 0x000088, 0x000088 ];

		IS31FL3731.Display(icon);
	}

	// ====================

	if (refreshAll) Log();
}

// ================================================================================
