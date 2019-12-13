// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: SHT31D ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
const SGP30 = require('./SGP30.js');
const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');
const HT16K33 = require('./HT16K33.js');

const { performance } = require('perf_hooks');
function Wait(msecs) { const start = performance.now(); while(performance.now() - start < msecs); } // Helper function

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
// === Sensirion SHT31-D Humidity and Temperature Sensor ===
// * Product Page -> https://www.sensirion.com/en/environmental-sensors/humidity-sensors/digital-humidity-sensors-for-various-applications/
// * Datasheet -> https://www.sensirion.com/fileadmin/user_upload/customers/sensirion/Dokumente/0_Datasheets/Humidity/Sensirion_Humidity_Sensors_SHT3x_Datasheet_digital.pdf
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_SHT31D = 0;
var data = [0.0, 0.0];
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_SHT31D > 0) return false;

	// Identify using the product ID of the SHT31D device...
	//var productID = bus.readWordSync(address, 0xNN);
	//if ((productID & 0xNNNN) == 0xNN)
	{
		I2C_BUS = bus;
		I2C_ADDRESS_SHT31D = address;
		return true;
	}
	// else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_SHT31D) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

    // Configure the device...
	// var writeBuf = Buffer.from([0xa2]);
	// I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SHT31D, 0x30, 1, writeBuf); // Soft reset the device on startup, just in case... (this reloads calibration data etc)
    // I2C_BUS.writeByteSync(I2C_ADDRESS_SHT31D, 0x30, 0xa2); // Soft reset the device on startup, just in case... (this reloads calibration data etc)
    // Wait(20); // Note: Wait duration not specified in the datasheet, just guessing...

    // var writeBuf = Buffer.from([0x93]);
    // I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SHT31D, 0x30, 1, writeBuf); // Cancel any previous periodic data acquisition mode setting ("break" command)
    I2C_BUS.writeByteSync(I2C_ADDRESS_SHT31D, 0x30, 0x93); // Cancel any previous periodic data acquisition mode setting ("break" command)
    Wait(1);
}

function Stop() { return; }

// ====================

function Get()
{
	// First, we trigger a new humidity/temperature measurement... (high repeatability, clock stretching disabled)
    // var writeBuf = Buffer.from([0x00]);
    // I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SHT31D, 0x24, 1, writeBuf);
    I2C_BUS.writeByteSync(I2C_ADDRESS_SHT31D, 0x24, 0x00);

    Wait(16); // ...wait for the measurement to finish... (this takes up to 15 msecs at the "high repeatability" setting as per the datasheet)

    // ...read the measured raw humidity and temperature values from the sensor...
    var readBuf = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00]);
    I2C_BUS.readI2cBlockSync(I2C_ADDRESS_SHT31D, 0x00, 6, readBuf);
    // ...and re-calculate them to applicable units
    data[0] = ((((readBuf[3] << 8) + readBuf[4]) * 100) / 65535); // Humidity (%RH)
    data[1] = (((((readBuf[0] << 8) + readBuf[1]) * 175) / 65536) - 45); // Temperature (°C)

    // Finally, we send the newly read humidity data to the SGP30 module (if available) to be able to fine-tune its measurements...
    // if (SGP30.IsAvailable()) SGP30.SetHumidity(data[0]);

    return data;
}

// ====================

function Log()
{
	if (outputLogs) console.log("Breakout Gardener -> SHT31D -> Humidity \x1b[97;44m %s %% \x1b[0m / Temperature \x1b[97;44m %s °C \x1b[0m.", data[0].toFixed(0), data[1].toFixed(1));
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
			SH1107.DrawTextSmall("HUMIDITY:", 4, 1, false);
            SH1107.DrawSeparatorLine(7);
            SH1107.DrawTextSmall("TEMPERATURE:", 4, 8, false);
			SH1107.DrawTextSmall("SHT31D", 40, 16, false);
		}
    
        // Display the humidity rounded to the nearest integer...
        var roundedHumidity = Math.round(data[0]);
        var textString = roundedHumidity.toString() + ' %';
        SH1107.DrawTextMedium(textString, 24, 3, true);
        // ...and temperature rounded to one decimal...
		textString = data[1].toFixed(1) + ' *C';
		SH1107.DrawTextMedium(textString, 24, 10, true);
	
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

		// Let's draw a diagonally growing blue (think water? ;]) gradient based on the relative humidity...
		// (why diagonal, you ask? -> because this gives us more available steps [9] than horizontal [5] and vertical [5])
        var relativeHumidity = Math.round(data[0] / 10) - 1;
        if (relativeHumidity < 0) relativeHumidity = 0;
        if (relativeHumidity > 8) icon[4] = 0x0000aa;
		if (relativeHumidity > 7) icon[3] = icon[9] = 0x000099;
		if (relativeHumidity > 6) icon[2] = icon[8] = icon[14] = 0x000088;
		if (relativeHumidity > 5) icon[1] = icon[7] = icon[13] = icon[19] = 0x000077;
		if (relativeHumidity > 4) icon[0] = icon[6] = icon[12] = icon[18] = icon[24] = 0x000066;
		if (relativeHumidity > 3) icon[5] = icon[11] = icon[17] = icon[23] = 0x000055;
		if (relativeHumidity > 2) icon[10] = icon[16] = icon[22] = 0x000044;
		if (relativeHumidity > 1) icon[15] = icon[21] = 0x000033;
		if (relativeHumidity >= 0) icon[20] = 0x000022;

		IS31FL3731_RGB.Display(icon);
	}

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
        // ### PLACEHOLDER: DISPLAYS HUMIDITY AS SIMPLE TWO-DIGIT VALUE ###
		IS31FL3731_WHITE.DrawString(Math.round(data[0]).toString());
    }
    
    // ====================
    
    if (HT16K33.IsAvailable())
    {
        var humidity = Math.round(data[0]) + '%';
        HT16K33.Display(humidity);
    }

	// ====================

    if (refreshAll) Log();
}

// ================================================================================
