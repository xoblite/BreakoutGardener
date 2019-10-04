// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: VCNL4010 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
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
// === Vishay Semiconductors VCNL4010 Proximity/Light Sensor ===
// * Product Page -> https://www.vishay.com/optical-sensors/list/product-83462/
// * Datasheet -> https://www.vishay.com/docs/83462/vcnl4010.pdf
// * Application Note -> https://www.vishay.com/docs/84138/designingvcnl4010.pdf
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_VCNL4010 = 0;
var data = [0.0, 0.0];
const proximityOffset = 2000;
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_VCNL4010 > 0) return false;

	// Identify using the product ID (0x20) of the VCNL4010 device...
	var productID = bus.readByteSync(address, 0x81);
	if ((productID & 0xf0) == 0x20)
	{
		I2C_BUS = bus;
		I2C_ADDRESS_VCNL4010 = address;
		return true;
	}
	else return false;}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_VCNL4010) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	// Configure the device...
	I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x80, 0b00000000); // Command register: Disable all measurements while we're configuring the device
	I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x82, 0b00000000); // Proximity rate register: 1.95 measurements/s (default)
	I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x83, 20);		   // IR LED current register: 20x10 = 200 mA (the maximum value, which is OK with our low proximity measurement rate -> average 35 uA according to the datasheet)
	I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x84, 0b10011101); // Ambient light parameter register: Continuous conversion enabled, automatic offset compensation enabled (default), averaging function @ 32x (default)
	I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x89, 0b00000000); // Interrupt control register: Disable all interrupts (default)
	I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x8e, 0b00001111); // Interrupt status register: Clear all interrupts (just in case)
	I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x8f, 0b00000001); // Proximity modulator timing adjustment register: All settings as per Vishay's recommended defaults

	// ### FOR SOME REASON I COULDN'T GET SELF TIMED PROXIMITY MEASUREMENTS TO WORK -> FALLING BACK TO ON-DEMAND MEASUREMENTS (FOR NOW AT LEAST), SEE BELOW #####
	// I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x80, 0b00000001); // Command register: (1) Enable self timer state machine and LP oscillator
	// I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x80, 0b00000111); // Command register: (2) Enable self timed periodic ambient light and proximity measurements
}

function Stop() { return; }

// ====================

function Get()
{
	// Start a single on-demand measurement for ambient light and proximity... (see why above)
	I2C_BUS.writeByteSync(I2C_ADDRESS_VCNL4010, 0x80, 0b00011000);

	// Get the ambient light and proximity readings from the sensor...
	var readBuffer = Buffer.alloc(4, 0x00);
	I2C_BUS.readI2cBlockSync(I2C_ADDRESS_VCNL4010, 0x85, 4, readBuffer);

	// var light = Math.round(((I2C_BUS.readByteSync(I2C_ADDRESS_VCNL4010, 0x85) << 8) + I2C_BUS.readByteSync(I2C_ADDRESS_VCNL4010, 0x86)) * 0.25); // Ambient light in lux (i.e. at 0.25 lux per lsb count)
	// var proximity = (I2C_BUS.readByteSync(I2C_ADDRESS_VCNL4010, 0x87) << 8) + I2C_BUS.readByteSync(I2C_ADDRESS_VCNL4010, 0x88); // Proximity
	var light = Math.round(readBuffer.readUInt16BE(0) * 0.25); // Ambient light in lux (i.e. at 0.25 lux per lsb count)
	var proximity = readBuffer.readUInt16BE(2); // Proximity

	data = [light, proximity];

	return data;
}

// ====================

function Log()
{
	if (outputLogs) console.log("Breakout Gardener -> VCNL4010 -> Light \x1b[100;97m " + data[0] + " lux \x1b[0m / Proximity \x1b[100;97m " + data[1] + " \x1b[0m.");
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
			SH1107.DrawTextSmall('AMBIENT LIGHT:', 4, 0, false);
			SH1107.DrawSeparatorLine(5);
			SH1107.DrawTextSmall('PROXIMITY:', 4, 6, false);
			SH1107.DrawTextSmall("VCNL4010", 33, 16, false);
		}

		// Ambient light (lux)
		var xoffset = SH1107.DrawTextMedium(data[0].toString(), 4, 2, true);
		SH1107.DrawTextSmall("LUX", xoffset+8, 3, true);

		// Proximity
		SH1107.DrawTextMedium(data[1].toString(), 4, 8, true);
		var relativeProximity = Math.round((data[1]*100) / 65536);
		SH1107.DrawMeterBar(relativeProximity, 11);

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

		var relativeProximity = Math.round(((data[1]-proximityOffset) * 9) / 16384); // Note: Settling for max 16384 since higher readings are for extremely short distances, while in my case the "no proximity" offset was ~2180.
		if (data[1] > 16384) relativeProximity = 9;
		// if (showDebug) console.log("Breakout Gardener -> DEBUG (VCNL4010) -> Relative proximity: " + relativeProximity + ".");

		// Let's draw a diagonally growing rainbow based on the relative proximity...
		// (why diagonal, you ask? -> because this gives us more available steps [9] than horizontal [5] and vertical [5])
		if (relativeProximity > 8) icon[4] = 0xaa0000;
		if (relativeProximity > 7) icon[3] = icon[9] = 0xaa4400;
		if (relativeProximity > 6) icon[2] = icon[8] = icon[14] = 0xaa4400;
		if (relativeProximity > 5) icon[1] = icon[7] = icon[13] = icon[19] = 0x666600;
		if (relativeProximity > 4) icon[0] = icon[6] = icon[12] = icon[18] = icon[24] = 0x00aa00;
		if (relativeProximity > 3) icon[5] = icon[11] = icon[17] = icon[23] = 0x006666;
		if (relativeProximity > 2) icon[10] = icon[16] = icon[22] = 0x0000aa;
		if (relativeProximity > 1) icon[15] = icon[21] = 0x660066;
		if (relativeProximity >= 0) icon[20] = 0x330066;

		IS31FL3731_RGB.Display(icon);
	}

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
		const img = [ 0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0 ];

		var relativeProximity = Math.round(((data[1]-proximityOffset) * 17) / 16384); // Note: Settling for max 16384 since higher readings are for extremely short distances, while in my case the "no proximity" offset was ~2180.
		if (data[1] > 16384) relativeProximity = 17;
		// if (showDebug) console.log("Breakout Gardener -> DEBUG (VCNL4010) -> Relative proximity: " + relativeProximity + ".");

		// Let's draw a diagonally growing meter based on the relative proximity...
		// (why diagonal, you ask? -> because this gives us more available steps [17] than horizontal [11] and vertical [7])
		if (relativeProximity > 16) img[10] = 120;
		if (relativeProximity > 15) img[9] = img[21] = 110;
		if (relativeProximity > 14) img[8] = img[20] = img[32] = 100;
		if (relativeProximity > 13) img[7] = img[19] = img[31] = img[43] = 95;
		if (relativeProximity > 12) img[6] = img[18] = img[30] = img[42] = img[54] = 90;
		if (relativeProximity > 11) img[5] = img[17] = img[29] = img[41] = img[53] = img[65] = 85;
		if (relativeProximity > 10) img[4] = img[16] = img[28] = img[40] = img[52] = img[64] = img[76] = 80;
		if (relativeProximity > 9) img[3] = img[15] = img[27] = img[39] = img[51] = img[63] = img[75] = 75;
		if (relativeProximity > 8) img[2] = img[14] = img[26] = img[38] = img[50] = img[62] = img[74] = 70;
		if (relativeProximity > 7) img[1] = img[13] = img[25] = img[37] = img[49] = img[61] = img[73] = 65;
		if (relativeProximity > 6) img[0] = img[12] = img[24] = img[36] = img[48] = img[60] = img[72] = 60;
		if (relativeProximity > 5) img[11] = img[23] = img[35] = img[47] = img[59] = img[71] = 55;
		if (relativeProximity > 4) img[22] = img[34] = img[46] = img[58] = img[70] = 50;
		if (relativeProximity > 3) img[33] = img[45] = img[57] = img[69] = 45;
		if (relativeProximity > 2) img[44] = img[56] = img[68] = 40;
		if (relativeProximity > 1) img[55] = img[67] = 35;
		if (relativeProximity >= 0) img[66] = 30;

		IS31FL3731_WHITE.Display(img);
	}

	// ====================

	if (refreshAll) Log();
}

// ================================================================================
