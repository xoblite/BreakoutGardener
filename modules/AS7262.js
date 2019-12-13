// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: AS7262 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
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
// === AMS AS7262 6-channel Spectral Sensor ===
// * Product Page -> https://ams.com/AS7262
// * Datasheet -> https://ams.com/documents/20143/36005/AS7262_DS000486_2-00.pdf
// ----------------------------------------------------------------------------------------

const AS7262_STATUS_REGISTER = 0x00;
const AS7262_WRITE_REGISTER = 0x01;
const AS7262_READ_REGISTER = 0x02;
const AS7262_STATUS_RX_VALID = 0x01;
const AS7262_STATUS_TX_VALID = 0x02;

var I2C_BUS = 0, I2C_ADDRESS_AS7262 = 0;
var enableLEDs = false;
var data = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
var alternatingDisplay = false;
var outputLogs = false, showDebug = false;

// ================================================================================

// # Below: Helper functions to read/write to the virtual registers of the device #

function CheckTXready(bus, address)
{
    while (true)
    {
        var status = (bus.readByteSync(address, AS7262_STATUS_REGISTER) & AS7262_STATUS_TX_VALID);
        // if (showDebug) console.log(" --- Checking TX_VALID... -> %s", status);
        if (status == 0) break;
        else Wait(10);
    }
}

function CheckRXready(bus, address)
{
    while (true)
    {
        var status = (bus.readByteSync(address, AS7262_STATUS_REGISTER) & AS7262_STATUS_RX_VALID);
        // if (showDebug) console.log(" --- Checking RX_VALID... -> %s", status);
        if (status != 0) break;
        else Wait(10);
    }
}

function GetVirtualRegister(bus, address, virtualRegister)
{
    CheckTXready(bus, address); // Check that the device is ready...
    bus.writeByteSync(address, AS7262_WRITE_REGISTER, virtualRegister); // Select the virtual register to read...
    CheckRXready(bus, address); // Wait for the requested data to become available...
    return bus.readByteSync(address, AS7262_READ_REGISTER); // Read the requested data...
}

function SetVirtualRegister(bus, address, virtualRegister, value)
{
    CheckTXready(bus, address); // Check that the device is ready...
    bus.writeByteSync(address, AS7262_WRITE_REGISTER, (virtualRegister | 0x80)); // Select the virtual register to write, and indicate a pending write to it by setting the "write bit" flag... (0x80 i.e. bit D7)
    CheckTXready(bus, address); // Wait for the device again...
    bus.writeByteSync(address, AS7262_WRITE_REGISTER, value); // Write the supplied data...
}

function GetVirtRegMultipleValues(bus, address, virtualRegister, buffer)
{
    for (var n=0; n<=buffer.length; n++)
    {
        buffer[n] = GetVirtualRegister(bus, address, virtualRegister+n);
    }
}

// ================================================================================

function Identify(bus, address)
{
    if (I2C_ADDRESS_AS7262 > 0) return false;

    // Identify using the device ID (0x40) of the AS7262 device...
    var deviceID = GetVirtualRegister(bus, address, 0x00);
	if (deviceID == 0x40)
	{
		I2C_BUS = bus;
        I2C_ADDRESS_AS7262 = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_AS7262) return true;
	else return false;
}

// ====================

function Start(leds, logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	if (leds) enableLEDs = true;
    
    // Soft reset the device... (just in case?)
    // SetVirtualRegister(I2C_BUS, I2C_ADDRESS_AS7262, 0x04, 0x80);
    // Wait(1000);

    // Configure the device...
    // ### ANYTHING TO BE ADDED HERE? ###
}

function Stop() { return; }

// ====================

function Get()
{
    // Violet   @ 450 nm
    // Blue     @ 500 nm
    // Green    @ 550 nm
    // Yellow   @ 570 nm
    // Orange   @ 600 nm
    // Red      @ 650 nm

    if (enableLEDs)
    {
        // Turn on the illumnation LED @ 12.5 mA... (weakest setting but quite bright anyway)
        SetVirtualRegister(I2C_BUS, I2C_ADDRESS_AS7262, 0x07, 0b00001000);
        Wait(10);
    }

    // Trigger a one-shot measurement (BANK mode 3) with 64x gain...
    SetVirtualRegister(I2C_BUS, I2C_ADDRESS_AS7262, 0x04, 0b00111100);
    Wait(100); // -> Just in case?!

    if (enableLEDs)
    {
        // Turn off the illumnation LED...
        SetVirtualRegister(I2C_BUS, I2C_ADDRESS_AS7262, 0x07, 0b00000000);
    }

    // ====================

    // Read the VBGYOR calibrated measurements from the device, and recalculate 
    // them as percentages relative to the strongest spectral component...
    const buffer = Buffer.from([0.0, 0.0, 0.0, 0.0]);
    GetVirtRegMultipleValues(I2C_BUS, I2C_ADDRESS_AS7262, 0x14, buffer);
    data[0] = buffer.readFloatBE(0);
    GetVirtRegMultipleValues(I2C_BUS, I2C_ADDRESS_AS7262, 0x18, buffer);
    data[1] = buffer.readFloatBE(0);
    GetVirtRegMultipleValues(I2C_BUS, I2C_ADDRESS_AS7262, 0x1c, buffer);
    data[2] = buffer.readFloatBE(0);
    GetVirtRegMultipleValues(I2C_BUS, I2C_ADDRESS_AS7262, 0x20, buffer);
    data[3] = buffer.readFloatBE(0);
    GetVirtRegMultipleValues(I2C_BUS, I2C_ADDRESS_AS7262, 0x24, buffer);
    data[4] = buffer.readFloatBE(0);
    GetVirtRegMultipleValues(I2C_BUS, I2C_ADDRESS_AS7262, 0x28, buffer);
    data[5] = buffer.readFloatBE(0);

    var maximum = Math.max(data[0], data[1], data[2], data[3], data[4], data[5]);
    data[0] = Math.round((data[0]/maximum)*100);
    data[1] = Math.round((data[1]/maximum)*100);
    data[2] = Math.round((data[2]/maximum)*100);
    data[3] = Math.round((data[3]/maximum)*100);
    data[4] = Math.round((data[4]/maximum)*100);
    data[5] = Math.round((data[5]/maximum)*100);

    // ====================

    return data;
}

// ====================

function Log()
{
    if (outputLogs)
    {
        // ##### Below: Console output in regular 3-bit colour... :| #####
        // console.log("Breakout Gardener -> AS7262 -> Violet \x1b[97;45m %s%% \x1b[0m / Blue \x1b[97;44m %s%% \x1b[0m / Green \x1b[97;42m %s%% \x1b[0m / Yellow \x1b[97;43m %s%% \x1b[0m / Orange \x1b[97;43m %s%% \x1b[0m / Red \x1b[97;41m %s%% \x1b[0m.", data[0], data[1], data[2], data[3], data[4], data[5]);

        // ##### Below: Console output in much nicer looking 24-bit colour! :D #####
        console.log("Breakout Gardener -> AS7262 -> Violet \033[48;2;102;0;1702m %s%% \033[m / Blue \033[48;2;0;0;1702m %s%% \033[m / Green \033[48;2;0;136;02m %s%% \033[m / Yellow \033[48;2;170;136;02m %s%% \033[m / Orange \033[48;2;170;68;02m %s%% \033[m / Red \033[48;2;170;0;02m %s%% \033[m.", data[0], data[1], data[2], data[3], data[4], data[5]);

        // var deviceTemp = GetVirtualRegister(I2C_BUS, I2C_ADDRESS_AS7262, 0x06);
        // console.log("Breakout Gardener -> AS7262 -> The device temperature is %s °C.", deviceTemp);
    }
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

            SH1107.DrawTextSmall("V", 2, 1, false);
            SH1107.DrawTextSmall("B", 2, 3, false);
            SH1107.DrawTextSmall("G", 2, 5, false);
            SH1107.DrawTextSmall("Y", 2, 7, false);
            SH1107.DrawTextSmall("O", 2, 9, false);
            SH1107.DrawTextSmall("R", 2, 11, false);

			SH1107.DrawTextSmall("AS7262", 39, 16, false);
        }
        
        SH1107.DrawMeterBar(data[0], 1);
        SH1107.DrawMeterBar(data[1], 3);
        SH1107.DrawMeterBar(data[2], 5);
        SH1107.DrawMeterBar(data[3], 7);
        SH1107.DrawMeterBar(data[4], 9);
        SH1107.DrawMeterBar(data[5], 11);
        
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

        // As we have 6 channels to display, but only 5 rows available,
        // let's alternate between VBG and YOR on 3 rows instead...
		if (!alternatingDisplay)
		{
            // Violet
            if (data[0] > 10) icon[5] = 0x550099;
            else icon[5] = 0x2a004c;
            if (data[0] > 30) icon[6] = 0x550099;
            else if (data[0] > 20) icon[6] = 0x2a004c;
            if (data[0] > 50) icon[7] = 0x550099;
            else if (data[0] > 40) icon[7] = 0x2a004c;
            if (data[0] > 70) icon[8] = 0x550099;
            else if (data[0] > 60) icon[8] = 0x2a004c;
            if (data[0] > 90) icon[9] = 0x550099;
            else if (data[0] > 80) icon[9] = 0x2a004c;

            // Blue
            if (data[1] > 10) icon[10] = 0x0000aa;
            else icon[10] = 0x000055;
            if (data[1] > 30) icon[11] = 0x0000aa;
            else if (data[1] > 20) icon[11] = 0x000055;
            if (data[1] > 50) icon[12] = 0x0000aa;
            else if (data[1] > 40) icon[12] = 0x000055;
            if (data[1] > 70) icon[13] = 0x0000aa;
            else if (data[1] > 60) icon[13] = 0x000055;
            if (data[1] > 90) icon[14] = 0x0000aa;
            else if (data[1] > 80) icon[14] = 0x000055;

            // Green
            if (data[2] > 10) icon[15] = 0x008800;
            else icon[15] = 0x004400;
            if (data[2] > 30) icon[16] = 0x008800;
            else if (data[2] > 20) icon[16] = 0x004400;
            if (data[2] > 50) icon[17] = 0x008800;
            else if (data[2] > 40) icon[17] = 0x004400;
            if (data[2] > 70) icon[18] = 0x008800;
            else if (data[2] > 60) icon[18] = 0x004400;
            if (data[2] > 90) icon[19] = 0x008800;
            else if (data[2] > 80) icon[19] = 0x004400;

			alternatingDisplay = true;
		}
		else
		{
            // Yellow
            if (data[3] > 10) icon[5] = 0xaa8800;
            else icon[5] = 0x554400;
            if (data[3] > 30) icon[6] = 0xaa8800;
            else if (data[3] > 20) icon[6] = 0x554400;
            if (data[3] > 50) icon[7] = 0xaa8800;
            else if (data[3] > 40) icon[7] = 0x554400;
            if (data[3] > 70) icon[8] = 0xaa8800;
            else if (data[3] > 60) icon[8] = 0x554400;
            if (data[3] > 90) icon[9] = 0xaa8800;
            else if (data[3] > 80) icon[9] = 0x554400;

            // Orange
            if (data[4] > 10) icon[10] = 0xaa4400;
            else icon[10] = 0x552200;
            if (data[4] > 30) icon[11] = 0xaa4400;
            else if (data[4] > 20) icon[11] = 0x552200;
            if (data[4] > 50) icon[12] = 0xaa4400;
            else if (data[4] > 40) icon[12] = 0x552200;
            if (data[4] > 70) icon[13] = 0xaa4400;
            else if (data[4] > 60) icon[13] = 0x552200;
            if (data[4] > 90) icon[14] = 0xaa4400;
            else if (data[4] > 80) icon[14] = 0x552200;

            // Red
            if (data[5] > 10) icon[15] = 0xaa0000;
            else icon[15] = 0x550000;
            if (data[5] > 30) icon[16] = 0xaa0000;
            else if (data[5] > 20) icon[16] = 0x550000;
            if (data[5] > 50) icon[17] = 0xaa0000;
            else if (data[5] > 40) icon[17] = 0x550000;
            if (data[5] > 70) icon[18] = 0xaa0000;
            else if (data[5] > 60) icon[18] = 0x550000;
            if (data[5] > 90) icon[19] = 0xaa0000;
            else if (data[5] > 80) icon[19] = 0x550000;

			alternatingDisplay = false;
		}

		IS31FL3731_RGB.Display(icon);
	}

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
        IS31FL3731_WHITE.DrawMeter(data[0], 0);
        IS31FL3731_WHITE.DrawMeter(data[1], 1);
        IS31FL3731_WHITE.DrawMeter(data[2], 2);
        IS31FL3731_WHITE.DrawMeter(data[3], 3);
        IS31FL3731_WHITE.DrawMeter(data[4], 4);
        IS31FL3731_WHITE.DrawMeter(data[5], 5);
        IS31FL3731_WHITE.DrawMeter(255, 6);
    }

    // ====================
    
    if (HT16K33.IsAvailable())
    {
        var colour = 'RED';
        if (data[0] == 100) colour = 'VIOLET';
        if (data[1] == 100) colour = 'BLUE';
        if (data[2] == 100) colour = 'GREEN';
        if (data[3] == 100) colour = 'YELLOW';
        if (data[4] == 100) colour = 'ORANGE';
        if (data[5] == 100) colour = 'RED';
        HT16K33.Display(colour);
    }

	// ====================

    if (refreshAll) Log();
}

// ================================================================================
