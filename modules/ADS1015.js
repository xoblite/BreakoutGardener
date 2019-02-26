// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: ADS1015 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
const SH1107 = require('./SH1107.js');
const IS31FL3731 = require('./IS31FL3731.js');
//function sleep(msecs) { return new Promise(resolve => setTimeout(resolve, msecs)); } // Helper function

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
// === Texas Instruments ADS1015 Analog-To-Digital Converter ===
// * Product Page -> http://www.ti.com/product/ADS1015
// * Datasheet -> http://www.ti.com/lit/ds/symlink/ads1015.pdf
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_ADS1015 = 0;
var data = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
var ads1015MaxVoltage = 5.0; // Preliminary, not sure if this should always be 3.3 (volt) or not... (?)
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_ADS1015 > 0) return false;

	// Note: There doesn't seem to be a way to identify the
	// ADS1015 device unfortunately [?], so here we go...
	I2C_BUS = bus;
	I2C_ADDRESS_ADS1015 = address;
	return true;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_ADS1015) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	I2C_BUS.writeByteSync(I2C_ADDRESS_ADS1015, 0x00, 0b00000110); // Reset device internal registers

	/*
	//        var maxVoltage = 5000;
	//        var defaultGain = 6144;

	SAMPLES_PER_SECOND_MAP = {128: 0x0000, 250: 0x0020, 490: 0x0040, 920: 0x0060, 1600: 0x0080, 2400: 0x00A0, 3300: 0x00C0}
	CHANNEL_MAP = {0: 0x4000, 1: 0x5000, 2: 0x6000, 3: 0x7000}
	PROGRAMMABLE_GAIN_MAP = {6144: 0x0000, 4096: 0x0200, 2048: 0x0400, 1024: 0x0600, 512: 0x0800, 256: 0x0A00}

	PGA_6_144V = 6144
	PGA_4_096V = 4096
	PGA_2_048V = 2048
	PGA_1_024V = 1024
	PGA_0_512V = 512
	PGA_0_256V = 256

	config |= SAMPLES_PER_SECOND_MAP[samples_per_second]
	config |= CHANNEL_MAP[channel]
	config |= PROGRAMMABLE_GAIN_MAP[programmable_gain]
	*/
}

function Stop() { return; }

// ====================

function Get()
{
	// Trigger a single conversion of channel 0 vs GND... ("S0")
	var adsBuf = Buffer.from([0b11000001, 0b10000011]);
	I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_ADS1015, 0x01, 2, adsBuf);
	// await sleep(10); // Wait for the conversion to finish...
	I2C_BUS.readI2cBlockSync(I2C_ADDRESS_ADS1015, 0x00, 2, adsBuf);
	data[0] = ((adsBuf.readInt16BE(0) >> 4) * 6.144) / 2048;

	// Trigger a single conversion of channel 1 vs GND... ("S1")
	adsBuf = Buffer.from([0b11010001, 0b10000011]);
	I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_ADS1015, 0x01, 2, adsBuf);
	// await sleep(10); // Wait for the conversion to finish...
	I2C_BUS.readI2cBlockSync(I2C_ADDRESS_ADS1015, 0x00, 2, adsBuf);
	data[1] = ((adsBuf.readInt16BE(0) >> 4) * 6.144) / 2048;

	// Trigger a single conversion of channel 2 vs GND... ("S2")
	adsBuf = Buffer.from([0b11100001, 0b10000011]);
	I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_ADS1015, 0x01, 2, adsBuf);
	// await sleep(10); // Wait for the conversion to finish...
	I2C_BUS.readI2cBlockSync(I2C_ADDRESS_ADS1015, 0x00, 2, adsBuf);
	data[2] = ((adsBuf.readInt16BE(0) >> 4) * 6.144) / 2048;

	// Trigger a single conversion of channel 3 vs GND... ("S3")
	adsBuf = Buffer.from([0b11110001, 0b10000011]);
	I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_ADS1015, 0x01, 2, adsBuf);
	// await sleep(10); // Wait for the conversion to finish...
	I2C_BUS.readI2cBlockSync(I2C_ADDRESS_ADS1015, 0x00, 2, adsBuf);
	data[3] = ((adsBuf.readInt16BE(0) >> 4) * 6.144) / 2048;

	// Trigger a differential conversion of channel 0 vs channel 1... ("D01")
	adsBuf = Buffer.from([0b10000001, 0b10000011]);
	I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_ADS1015, 0x01, 2, adsBuf);
	// await sleep(10); // Wait for the conversion to finish...
	I2C_BUS.readI2cBlockSync(I2C_ADDRESS_ADS1015, 0x00, 2, adsBuf);
	data[4] = ((adsBuf.readInt16BE(0) >> 4) * 6.144) / 2048;

	// Trigger a differential conversion of channel 2 vs channel 3... ("D23")
	adsBuf = Buffer.from([0b10110001, 0b10000011]);
	I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_ADS1015, 0x01, 2, adsBuf);
	// await sleep(10); // Wait for the conversion to finish...
	I2C_BUS.readI2cBlockSync(I2C_ADDRESS_ADS1015, 0x00, 2, adsBuf);
	data[5] = ((adsBuf.readInt16BE(0) >> 4) * 6.144) / 2048;

    return data;
}

// ====================

function Log()
{
	console.log("Breakout Gardener -> ADS1015 -> Single ADC channels 0/1/2/3 (reference GND) at \x1b[30;106m %s V \x1b[0m / \x1b[30;106m %s V \x1b[0m / \x1b[30;106m %s V \x1b[0m / \x1b[30;106m %s V \x1b[0m.", data[0].toFixed(2), data[1].toFixed(2), data[2].toFixed(2), data[3].toFixed(2));
	console.log("Breakout Gardener -> ADS1015 -> Differential ADC channels 0/1 and 2/3 at \x1b[30;46m %s V \x1b[0m / \x1b[30;46m %s V \x1b[0m.", data[4].toFixed(2), data[5].toFixed(2));
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
			SH1107.DrawTextSmall('S0:', 4, 0, false);
			SH1107.DrawTextSmall('S1:', 4, 2, false);
			SH1107.DrawTextSmall('S2:', 4, 4, false);
			SH1107.DrawTextSmall('S3:', 4, 6, false);
			SH1107.DrawSeparatorLine(8);
			SH1107.DrawTextSmall('D01:', 4, 9, false);
			SH1107.DrawTextSmall('D23:', 4, 11, false);
			SH1107.DrawTextSmall("ANALOG (ADS1015)", 12, 16, false);
		}
	
		var tempString = data[0].toFixed(2) + ' V'; // S0
		SH1107.DrawTextSmall(tempString, 64, 0, true);
		tempString = data[1].toFixed(2) + ' V'; // S1
		SH1107.DrawTextSmall(tempString, 64, 2, true);
		tempString = data[2].toFixed(2) + ' V'; // S2
		SH1107.DrawTextSmall(tempString, 64, 4, true);
		tempString = data[3].toFixed(2) + ' V'; // S3
		SH1107.DrawTextSmall(tempString, 64, 6, true);
		tempString = data[4].toFixed(2) + ' V'; // D01
		SH1107.DrawTextSmall(tempString, 64, 9, true);
		tempString = data[5].toFixed(2) + ' V'; // D23
		SH1107.DrawTextSmall(tempString, 64, 11, true);
	
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

        // Draw load meters for each individual ADC channel S0/S1/S2/S3...
		for (var n=0; n<=3; n++)
		{
			var voltageInPercentOfMax = (data[n] / ads1015MaxVoltage) * 100;

			if (voltageInPercentOfMax > 90) icon[4+(n*5)] = 0xaaaa00;
			else if (voltageInPercentOfMax > 80) icon[4+(n*5)] = 0x444400;
			if (voltageInPercentOfMax > 70) icon[3+(n*5)] = 0xaaaa00;
			else if (voltageInPercentOfMax > 60) icon[3+(n*5)] = 0x444400;
			if (voltageInPercentOfMax > 50) icon[2+(n*5)] = 0xaaaa00;
			else if (voltageInPercentOfMax > 40) icon[2+(n*5)] = 0x444400;
			if (voltageInPercentOfMax > 30) icon[1+(n*5)] = 0xaaaa00;
			else if (voltageInPercentOfMax > 20) icon[1+(n*5)] = 0x444400;
			if (voltageInPercentOfMax > 10) icon[(n*5)] = 0xaaaa00;
			else icon[(n*5)] = 0x444400;
		}

		// ...and one for differential ADC channel D01... (sorry D23, only 5 rows to play with =] )
		var voltageInPercentOfMax = (data[5] / ads1015MaxVoltage) * 100;

        if (voltageInPercentOfMax > 90) icon[24] = 0xaa6600;
        else if (voltageInPercentOfMax > 80) icon[24] = 0x442200;
        if (voltageInPercentOfMax > 70) icon[23] = 0xaa6600;
        else if (voltageInPercentOfMax > 60) icon[23] = 0x442200;
        if (voltageInPercentOfMax > 50) icon[22] = 0xaa6600;
        else if (voltageInPercentOfMax > 40) icon[22] = 0x442200;
        if (voltageInPercentOfMax > 30) icon[21] = 0xaa6600;
        else if (voltageInPercentOfMax > 20) icon[21] = 0x442200;
        if (voltageInPercentOfMax > 10) icon[20] = 0xaa6600;
        else icon[20] = 0x442200;

		IS31FL3731.Display(icon);
	}
	
	// ====================

	if (refreshAll) Log();
}

// ================================================================================
