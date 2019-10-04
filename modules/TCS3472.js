// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: TCS3472 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
const { execSync } = require('child_process');
const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');

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
// === ams TCS3472 Color Light Sensor ===
// * Product Page -> https://ams.com/tcs34725
// * Datasheet -> https://ams.com/documents/20143/36005/TCS3472_DS000390_2-00.pdf
// * Application Notes -> https://ams.com/tcs34725#tab/documents
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_TCS3472 = 0;
var enableLEDs = false;
var data = [0,0,0,0,0,0];
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_TCS3472 > 0) return false;

	// Identify using the part number ID (0x44 or 0x4d) of the TCS3472 device...
	var deviceID = bus.readByteSync(address, 0x92);
	if (deviceID == 0x44 || deviceID == 0x4d) // 0x44 -> TCS34725, 0x4d -> TCS34727
	{
		I2C_BUS = bus;
		I2C_ADDRESS_TCS3472 = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_TCS3472) return true;
	else return false;
}

// ====================

function Start(leds, logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	if (leds) enableLEDs = true;

	// Configure the device...
	I2C_BUS.writeByteSync(I2C_ADDRESS_TCS3472, 0x80, 0x00); // Reset device (just in case)
	I2C_BUS.writeByteSync(I2C_ADDRESS_TCS3472, 0x80, 0b00000011); // Enable RGBC, Power on
	// I2C_BUS.writeByteSync(I2C_ADDRESS_TCS3472, 0x81, 0x2b); // Set integration time (Pimoroni's default for Enviro pHAT)
	I2C_BUS.writeByteSync(I2C_ADDRESS_TCS3472, 0x81, 0x48); // Set integration time to 72*2.4 = 172.8 msec (saturation optimized [?])
	I2C_BUS.writeByteSync(I2C_ADDRESS_TCS3472, 0x8f, 0b00000000); // Set RGBC gain control to 1x
}

function Stop() { return; }

// ====================

function Get()
{
	// if (IS31FL3731_RGB.IsAvailable()) IS31FL3731_RGB.Clear(); // Clear ("turn off") the display to prevent it from affecting our light readings

	// ====================

	var gpioCmdSuccess = true;
	if (enableLEDs) // Should we turn on the illumination LEDs on the Enviro pHAT while reading from the light sensor?
	{
		execSync('gpio mode 7 output', (err, stdout, stderr) => {
			if (err && outputLogs) { console.log("Breakout Gardener -> ERROR -> TCS3472 -> Could not configure GPIO pin 7 as an output!"); gpioCmdSuccess = false; }
		});

		if (gpioCmdSuccess)
		{
			// Turn on the illumination LEDs... (GPIO pin 7 aka BCM 4)
			execSync('gpio write 7 1', (err, stdout, stderr) => {
				if (err && outputLogs) { console.log("Breakout Gardener -> ERROR -> TCS3472 -> Could not write 1 to GPIO pin 7!"); gpioCmdSuccess = false; }
			});
		}

        // await sleep(500); // ...and wait a bit, just in case... ;)
	}

	var clear = I2C_BUS.readWordSync(I2C_ADDRESS_TCS3472, 0xb4);
	var red = I2C_BUS.readWordSync(I2C_ADDRESS_TCS3472, 0xb6);
	var green = I2C_BUS.readWordSync(I2C_ADDRESS_TCS3472, 0xb8);
	var blue = I2C_BUS.readWordSync(I2C_ADDRESS_TCS3472, 0xba);

	if (enableLEDs & gpioCmdSuccess)
	{
			// Turn off the illumination LEDs... (GPIO pin 7 aka BCM 4)
			execSync('gpio write 7 0', (err, stdout, stderr) => {
			if (err && outputLogs) { console.log("Breakout Gardener -> ERROR -> TCS3472 -> Could not write 0 to GPIO pin 7!"); gpioCmdSuccess = false; }
		});
	}

	// Calculate the color temperature using coefficients specified in the TCS3472 DN40 documentation
	// (-> https://ams.com/documents/20143/36005/ColorSensors_AN000166_1-00.pdf/60da9631-5037-1dd7-86ed-72dfeda61754 )
	var ir = (red + green + blue - clear) / 2;
	var CT_Coef = 3810, CT_Offset = 1391;
	var simpleColorTemp = (CT_Coef * ((blue-ir) / (red-ir))) + CT_Offset;

	// Simple calculation of lux using RGB only - more sophisticated calculation per the documentation above to be added later =)
	var simpleLux = (-0.32466 * red) + (1.57837 * green) + (-0.73191 * blue);

	if (clear > 0)
	{
		red = Math.round((red * 255) / clear);
		green = Math.round((green * 255) / clear);
		blue = Math.round((blue * 255) / clear);
	}

	simpleColorTemp = Math.round(simpleColorTemp);
	simpleLux = Math.round(simpleLux);

	data = [clear, red, green, blue, simpleColorTemp, simpleLux];
    return data;
}

// ====================

function Log()
{
    if (outputLogs)
    {
        var tempString = 'Breakout Gardener -> TCS3472 -> Clear \x1b[30;107m ' + data[0].toString() + ' \x1b[0m / Red \x1b[97;41m ' + data[1].toString() + ' \x1b[0m / Green \x1b[97;42m ' + data[2].toString() + ' \x1b[0m / Blue \x1b[97;44m ' + data[3].toString() + ' \x1b[0m.';
        console.log(tempString);
        tempString = 'Breakout Gardener -> TCS3472 -> Color temperature \x1b[30;43m ' + data[4].toString() + ' °K \x1b[0m / Lux \x1b[30;107m ' + data[5].toString() + ' \x1b[0m.';
        console.log(tempString);
    }
}

// ====================

function Display(refreshAll)
{
	Get();

	// ====================

	if (SH1107.IsAvailable())
	{
		if (refreshAll)
		{
			SH1107.Off();
			SH1107.Clear();
			SH1107.DrawTextSmall('CLEAR:', 4, 0, false);
			SH1107.DrawTextSmall('RED:', 4, 2, false);
			SH1107.DrawTextSmall('GREEN:', 4, 4, false);
			SH1107.DrawTextSmall('BLUE:', 4, 6, false);
			SH1107.DrawSeparatorLine();
			SH1107.DrawTextSmall('TEMP:', 4, 9, false);
			SH1107.DrawTextSmall('LUX:', 4, 11, false);
			SH1107.DrawTextSmall("TCS3472", 37, 16, false);
		}

		SH1107.DrawTextSmall(data[0].toString(), 80, 0, true); // Clear
		SH1107.DrawTextSmall(data[1].toString(), 80, 2, true); // Red
		SH1107.DrawTextSmall(data[2].toString(), 80, 4, true); // Green
		SH1107.DrawTextSmall(data[3].toString(), 80, 6, true); // Blue
		SH1107.DrawTextSmall(data[4].toString(), 80, 9, true); // Light temperature
		SH1107.DrawTextSmall(data[5].toString(), 80, 11, true); // Lux

		if (refreshAll) SH1107.On();
	}

	// ====================

	if (IS31FL3731_RGB.IsAvailable())
	{
		const icon = [0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000 ];

		var rgb = (data[1] << 16) + (data[2] << 8) + data[3];
		icon[6] = icon[7] = icon[8] = icon[11] = icon[12] = icon[13] = icon[16] = icon[17] = icon[18] = rgb;

		IS31FL3731_RGB.Display(icon);
	}

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
		IS31FL3731_WHITE.DrawString("#");
	}

	// ====================

	if (refreshAll) Log();
}

// ================================================================================
