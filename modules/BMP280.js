// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: BMP280 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
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
// === Bosch Sensortec BMP280 Barometric Pressure Sensor ===
// * Product Page -> https://www.bosch-sensortec.com/bst/products/all_products/bmp280
// * Datasheet -> https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BMP280-DS001.pdf
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_BMP280 = 0;
var bmp280DigT1 = 0, bmp280DigT2 = 0, bmp280DigT3 = 0;
var bmp280DigP1 = 0, bmp280DigP2 = 0, bmp280DigP3 = 0, bmp280DigP4 = 0, bmp280DigP5 = 0, bmp280DigP6 = 0, bmp280DigP7 = 0, bmp280DigP8 = 0, bmp280DigP9 = 0;
var data = [0.0, 0.0];
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	// Identify using the part number ID (0x58) of the BMP280 device...
	var deviceID = bus.readByteSync(address, 0xd0);
	if (deviceID == 0x58)
	{
		I2C_BUS = bus;
		I2C_ADDRESS_BMP280 = address;
		return true;
	}
	else return false;}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_BMP280) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	// Configure the device...
	I2C_BUS.writeByteSync(I2C_ADDRESS_BMP280, 0xe0, 0xb6); // Reset the sensor
	I2C_BUS.writeByteSync(I2C_ADDRESS_BMP280, 0xf4, 0b10110111); // Temp oversampling 16x, Pressure oversampling 16x, Normal (continuous) mode
	I2C_BUS.writeByteSync(I2C_ADDRESS_BMP280, 0xf5, 0b10010000); // 500 ms interval ("inactive duration"), IIR filter @ standard resolution

	// Read temperature calibration data from the sensor...
	var readBuffer = Buffer.alloc(24, 0x00); // 3 words temperature + 9 words pressure = 24 bytes in total
	var bytesRead = I2C_BUS.readI2cBlockSync(I2C_ADDRESS_BMP280, 0x88, 24, readBuffer);
	// if (bytesRead == 24)
	{
		// Temperature
		bmp280DigT1 = readBuffer.readUInt16LE(0); // dig_T1 @ 0x88+0x89
		bmp280DigT2 = readBuffer.readInt16LE(2); // dig_T2 @ 0x8a+0x8b
		bmp280DigT3 = readBuffer.readInt16LE(4); // dig_T3 @ 0x8c+0x8d

		// Pressure
		bmp280DigP1 = readBuffer.readUInt16LE(6); // dig_P1 @ 0x8e+0x8f
		bmp280DigP2 = readBuffer.readInt16LE(8); // dig_P2 @ 0x90+0x91
		bmp280DigP3 = readBuffer.readInt16LE(10); // dig_P3 @ 0x92+0x93
		bmp280DigP4 = readBuffer.readInt16LE(12); // dig_P4 @ 0x94+0x95
		bmp280DigP5 = readBuffer.readInt16LE(14); // dig_P5 @ 0x96+0x97
		bmp280DigP6 = readBuffer.readInt16LE(16); // dig_P6 @ 0x98+0x99
		bmp280DigP7 = readBuffer.readInt16LE(18); // dig_P7 @ 0x9a+0x9b
		bmp280DigP8 = readBuffer.readInt16LE(20); // dig_P8 @ 0x9c+0x9d
		bmp280DigP9 = readBuffer.readInt16LE(22); // dig_P9 @ 0x9e+0x9f
	}
}

function Stop() { return; }

// ====================

function Get()
{
	// Get temperature and pressure readings from the sensor...
	var readBuffer = Buffer.alloc(6, 0x00); // 3 bytes temperature (20 bits) + 3 bytes pressure (20 bits)
	I2C_BUS.readI2cBlockSync(I2C_ADDRESS_BMP280, 0xf7, 6, readBuffer);

	// Apply temperature compensation formula according to the BMP280 datasheet... (yes, this is fugly!)
	var readTemp = (readBuffer.readInt8(3) << 12) + (readBuffer.readUInt8(4) << 4) + (readBuffer.readUInt8(5) >> 4); // MSB 8 bits, LSB 8 bits, XLSB 4 bits
	var var1 = ((readTemp / 16384) - (bmp280DigT1 / 1024)) * bmp280DigT2;
	var var2 = ((readTemp / 131072) - (bmp280DigT1 / 8192)) * ((readTemp / 131072) - (bmp280DigT1 / 8192)) * bmp280DigT3;
	var fineTemp = (var1 + var2);
	data[0] = (var1 + var2) / 5120; // -> Temperature in °C (float)

	// Apply pressure compensation formula according to the BMP280 datasheet... (yes, this is fugly!)
	var readPres = (readBuffer.readUInt8(0) << 12) + (readBuffer.readUInt8(1) << 4 ) + (readBuffer.readUInt8(2) >> 4); // MSB 8 bits, LSB 8 bits, XLSB 4 bits
	var1 = (fineTemp / 2) - 64000;
	var2 = (var1 * var1 * bmp280DigP6) / 32768;
	var2 = var2 + (var1 * bmp280DigP5 * 2);
	var2 = (var2 / 4) + (bmp280DigP4 * 65536);
	var1 = (((bmp280DigP3 * var1 * var1) / 524288) + (bmp280DigP2 * var1)) / 524288;
	var1 = (1 + (var1 / 32768)) * bmp280DigP1;
	if (var1 == 0.0) data[1] = 0.0;
	else
	{
		var var3 = 1048576 - readPres;
		var3 = ((var3 - (var2 / 4096)) * 6250) / var1;
		var1 = (bmp280DigP9 * var3 * var3) / 2147483648;
		var2 = (var3 * bmp280DigP8) / 32768;
		data[1] = (var3 + ((var1 + var2 + bmp280DigP7) / 16)) / 100; // -> Pressure in hPa (float)	
	}

	return data;
}

// ====================

function Log()
{
	console.log("Breakout Gardener -> BMP280 -> Temperature \x1b[97;44m %s °C \x1b[0m / Pressure \x1b[97;44m %s hPa \x1b[0m.", data[0].toFixed(1), data[1].toFixed(0));
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
			SH1107.DrawSeparatorLine();
			SH1107.DrawTextSmall("NEARBY (BMP280)", 12, 16, false);
		}

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
		textString = data[1].toFixed(0) + ' HPA';
		SH1107.DrawTextSmall(textString, 40, 12, true);

		if (refreshAll) SH1107.On();
	}

	// ====================

	if (IS31FL3731.IsAvailable())
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

		IS31FL3731.Display(icon);
	}

	// ====================

	if (refreshAll) Log();
}

// ================================================================================
