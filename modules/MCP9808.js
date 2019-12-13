// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: MCP9808 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');
const HT16K33 = require('./HT16K33.js');

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
// === Microchip Technology MCP9808 Digital Temperature Sensor ===
// * Product Page -> https://www.microchip.com/wwwproducts/en/MCP9808
// * Datasheet -> http://ww1.microchip.com/downloads/en/DeviceDoc/MCP9808-0.5C-Maximum-Accuracy-Digital-Temperature-Sensor-Data-Sheet-DS20005095B.pdf
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_MCP9808 = 0;
var data = [0.0, 0.0];
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_MCP9808 > 0) return false;

	// Identify using the manufacturer (0x5400 swapped LSB/MSB)
	// and device (0x04 with swapped LSB/MSB) IDs of the MCP9808 device...
	var manufacturerID = bus.readWordSync(address, 0x06);
	var deviceID = bus.readWordSync(address, 0x07);
	if ((manufacturerID == 0x5400) && (((deviceID & 0xff)) == 0x04))
	{
		I2C_BUS = bus;
		I2C_ADDRESS_MCP9808 = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_MCP9808) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	// Configure the device...
	// ...TO BE ADDED...
}

function Stop() { return; }

// ====================

function Get()
{
	// Calculate the ambient temperature in degrees C...
	var tempRaw = I2C_BUS.readWordSync(I2C_ADDRESS_MCP9808, 0x05);

	var temperature = 0;
	var lowerByte = (tempRaw & 0xff00) >> 8; // Data is little endian
	var upperByte = (tempRaw & 0xff); // Data is little endian
	upperByte = upperByte & 0x1f; // Remove flag bits (we don't use them)
	if ((upperByte & 0x10) == 0x10) // Temperature is < 0 °C
	{
		upperByte = upperByte & 0x0f; // Remove sign (-) bit
		temperature = 256 - (upperByte*16 + lowerByte/16);
	}
	else temperature = (upperByte*16 + lowerByte/16); // Temperature is >= 0 °C

	data[0] = temperature;

	return data;
}

// ====================

function Log()
{
    if (outputLogs) console.log("Breakout Gardener -> MCP9808 -> Temperature \x1b[97;44m %s °C \x1b[0m.", data[0].toFixed(1));
}

// ====================

function Display(refreshAll)
{
	Get();

	if (SH1107.IsAvailable())
	{
		if (refreshAll)
		{
			SH1107.Off();
			SH1107.Clear();
			SH1107.DrawSeparatorLine();
			SH1107.DrawTextSmall("MCP9808", 37, 16, false);
		}

		// Display the temperature rounded to the nearest integer...
		var roundedTemperature = Math.round(data[0]);
		var textString = roundedTemperature.toString();
		if (roundedTemperature > 10)
		{
			SH1107.DrawNumberLarge(parseInt(textString[0]), 10, 1);
			SH1107.DrawNumberLarge(parseInt(textString[1]), 1, 1);
		}
		else SH1107.DrawNumberLarge(parseInt(textString[0]), 1, 1);

		textString = data[0].toFixed(1) + ' *C';
		SH1107.DrawTextMedium(textString, 24, 9, true);

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

		// Add a simple temperature indicator... (red-yellow-green-cyan-blue horizontal bar depending on the temperature)
		if (data[0] > 24) icon[0] = icon[1] = icon[2] = icon[3] = icon[4] = 0xaa0000; // Red > 24 °C
		else if (data[0] > 21) icon[5] = icon[6] = icon[7] = icon[8] = icon[9] = 0xaaaa00; // Yellow 21-24 °C
		else if (data[0] > 19) icon[10] = icon[11] = icon[12] = icon[13] = icon[14] = 0x00aa00; // Green 19-21 °C
		else if (data[0] > 17) icon[15] = icon[16] = icon[17] = icon[18] = icon[19] = 0x00aaaa; // Cyan 17-19 °C
		else icon[20] = icon[21] = icon[22] = icon[23] = icon[24] = 0x0000aa; // Blue < 17 °C

		IS31FL3731_RGB.Display(icon);
	}

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
		IS31FL3731_WHITE.DrawString(Math.round(data[0]).toString());
    }
    
    // ====================
    
    if (HT16K33.IsAvailable())
    {
        var temperature = data[0].toFixed(1) + 'C';
        HT16K33.Display(temperature);
    }

	// ====================

	if (refreshAll) Log();
}

// ================================================================================
