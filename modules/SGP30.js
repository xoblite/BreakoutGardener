// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: SGP30 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');
const DRV2605 = require('./DRV2605.js');

const { performance } = require('perf_hooks');
function Wait(msecs) { const start = performance.now(); while(performance.now() - start < msecs); } // Helper function

module.exports = {
	Identify: Identify,
	IsAvailable: IsAvailable,
	Start: Start,
    Stop: Stop,
    SetHumidity: SetHumidity,
	Get: Get,
	Log: Log,
	Display: Display
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === Sensirion SGP30 Indoor Air Quality (TVOC and CO2eq) Gas Sensor ===
// * Product Page -> https://www.sensirion.com/en/environmental-sensors/gas-sensors/
// * Datasheet -> https://www.sensirion.com/fileadmin/user_upload/customers/sensirion/Dokumente/0_Datasheets/Gas/Sensirion_Gas_Sensors_SGP30_Datasheet.pdf
// * Application Note -> https://www.sensirion.com/fileadmin/user_upload/customers/sensirion/Dokumente/9_Gas_Sensors/Sensirion_Gas_Sensors_SGP3x_TVOC_Concept.pdf
// * Embedded Driver Library -> https://github.com/Sensirion/embedded-sgp
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_SGP30 = 0;
var data = [0, 0, 0, 0, 0];
var alternatingDisplay = false;
var measureIAQInterval = null;
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_SGP30 > 0) return false;

    // Identify using the product ID (unfortunately, 0x0) of the SGP30 device...
    bus.writeByteSync(address, 0x20, 0x2f); // Issue command "Get_feature_set_version"
    Wait(2); // ...wait...
    var productID = Buffer.from([0x00,0x00,0x00]);
    bus.readI2cBlockSync(address, 0x00, 3, productID); // ...and read the result
	if ((productID[0] & 0xf0) == 0x0)
	{
		I2C_BUS = bus;
		I2C_ADDRESS_SGP30 = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_SGP30) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
    if (debug) showDebug = true;
    
    // ====================
/*
    if (showDebug)
    {
        // Get device serial number...
        I2C_BUS.writeByteSync(I2C_ADDRESS_SGP30, 0x36, 0x82);
        Wait(2);
        var readBuf = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00]);
        I2C_BUS.readI2cBlockSync(I2C_ADDRESS_SGP30, 0x00, 6, readBuf);
        var serialNumber = (readBuf[0] << 16) + (readBuf[2] << 8) + readBuf[4];
        console.log("Breakout Gardener -> SGP30 -> Device serial number is %s (raw data %s %s %s %s %s %s).", serialNumber, readBuf[0].toString(), readBuf[1].toString(), readBuf[2].toString(), readBuf[3].toString(), readBuf[4].toString(), readBuf[5].toString());
    
        // Run device self-test...
        I2C_BUS.writeByteSync(I2C_ADDRESS_SGP30, 0x20, 0x32);
        Wait(221); // ...wait for the self-test to finish... (max 220 msecs as per the datasheet)
        // ...and then read the result, which should be 0xd400 if everything is OK...
        var readBuf = Buffer.from([0x00,0x00,0x00]);
        I2C_BUS.readI2cBlockSync(I2C_ADDRESS_SGP30, 0x00, 3, readBuf);
        var selfTestResult = (readBuf[0] << 8) + readBuf[1];
        if (selfTestResult == 0xd400) console.log("Breakout Gardener -> SGP30 -> Device self-test OK.");
        else console.log("Breakout Gardener -> SGP30 -> Device self-test failed!");
    }
*/
    // ====================

	// Configure the device...
    I2C_BUS.writeByteSync(I2C_ADDRESS_SGP30, 0x20, 0x03); // Initialize the IAQ measuring functions...

	// Start performing IAQ measurements asynchronously every 1 sec... (see PeriodicMeasurements() below)
	measureIAQInterval = setInterval(PeriodicMeasurements, 1000);
}

// ====================

function Stop()
{
	// Stop the asynchronous IAQ measurements...
	clearInterval(measureIAQInterval);
}

// ====================

function SetHumidity(humidity) // Helper function for the SHT31D module to send humidity data (RH%) to the SGP30 module
{
    // ### TO BE IMPLEMENTED ###

    // if (showDebug) console.log("Breakout Gardener -> SGP30 -> Humidity data received from another module: " + humidity.toFixed(0) + " %.");
}

// ====================

function PeriodicMeasurements() // Note: Asynchronously running Get() helper function
{
	// First, we trigger a new TVOC/CO2eq measurement...
    // var writeBuf = Buffer.from([0x08]);
    // I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SGP30, 0x20, 1, writeBuf);
    I2C_BUS.writeByteSync(I2C_ADDRESS_SGP30, 0x20, 0x08);

    Wait(13); // ...wait for the measurement to finish... (max 12 msecs as per the datasheet)

    // ...read the calculated TVOC and CO2eq values from the sensor...
    var readBuf = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00]);
    I2C_BUS.readI2cBlockSync(I2C_ADDRESS_SGP30, 0x00, 6, readBuf);
    data[0] = (readBuf[3] << 8) + readBuf[4]; // TVOC (ppb)
    data[1] = (readBuf[0] << 8) + readBuf[1]; // CO2eq (ppm)

    // ...and set the overall Indoor Air Quality (IAQ) Level [1-5] based on the read values
    if (data[0] > 2200) data[4] = 5; // Unhealthy
    else if (data[0] > 660) data[4] = 4; // Poor
    else if (data[0] > 220) data[4] = 3; // Moderate
    else if (data[0] > 65) data[4] = 2; // Good
    else data[4] = 1; // Excellent

    // ====================

    // Next, we trigger a new "raw values" Ethanol/Hydrogen measurement...
    // var writeBuf = Buffer.from([0x50]);
    // I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SGP30, 0x20, 1, writeBuf);
    I2C_BUS.writeByteSync(I2C_ADDRESS_SGP30, 0x20, 0x50);

    Wait(26); // ...wait for the measurement to finish... (max 25 msecs as per the datasheet)

        // ...and read the measured raw Ethanol (C2H6O) and Hydrogen (H2) values from the sensor
        var readBuf = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00]);
        I2C_BUS.readI2cBlockSync(I2C_ADDRESS_SGP30, 0x00, 6, readBuf);
        data[2] = Math.round((((readBuf[3] << 8) + readBuf[4]) * 1000) / 65536); // Ethanol (C2H6O) (ppm)
        data[3] = Math.round((((readBuf[0] << 8) + readBuf[1]) * 1000) / 65536); // Hydrogen (H2) (ppm)

        // ====================

        if (showDebug) Log(); // Note: This prints both TVOC/CO2eq/IAQ as well as Ethanol/Hydrogen values
}

function Get() { return data; } // Note: Our periodic measurements are written to the data buffer asynchronously, see PeriodicMeasurements() above

// ====================

function Log()
{
	if (outputLogs)
	{
		var tempString = "Breakout Gardener -> SGP30 -> TVOC \x1b[100;97m " + data[0] + " PPB (" +  (data[0]/220).toFixed(2) + " µg/m3) \x1b[0m / CO2eq \x1b[100;97m " + data[1] + " PPM \x1b[0m / IAQ Level \x1b[107;30m ";
		if (data[4] == 5) tempString += "5 (Unhealthy) \x1b[0m.";
		else if (data[4] == 4) tempString += "4 (Poor) \x1b[0m.";
		else if (data[4] == 3) tempString += "3 (Moderate) \x1b[0m.";
		else if (data[4] == 2) tempString += "2 (Good) \x1b[0m.";
		else tempString += "1 (Excellent) \x1b[0m.";
		console.log(tempString);

		console.log("Breakout Gardener -> SGP30 -> Ethanol " + data[2] + " ppm / Hydrogen " + data[3] + " ppm.");
	}
}

// ====================

var previousIAQ = 1;

function Display(refreshAll)
{
	Get();

	if (SH1107.IsAvailable())
	{
		if (refreshAll)
		{
			SH1107.Off();
			SH1107.Clear();
			SH1107.DrawSeparatorLine(8);
			SH1107.DrawTextSmall("SGP30", 45, 16, false);
		}

		// Indoor Air Quality (IAQ) level
		if (data[4] == 5) // Unhealthy (level 5)
		{
			SH1107.DrawNumberLarge(5, 10, 1);
			SH1107.DrawTextMedium("UNH ", 72, 1, true);
			SH1107.DrawTextMedium("EAL ", 72, 3, true);
			SH1107.DrawTextMedium("THY ", 72, 5, true);
		}
		else if (data[4] == 4) // Poor (level 4)
		{
			SH1107.DrawNumberLarge(4, 10, 1);
			SH1107.DrawTextMedium("", 72, 1, true);
			SH1107.DrawTextMedium("  PO", 72, 3, true);
			SH1107.DrawTextMedium("  OR", 72, 5, true);
		}
		else if (data[4] == 3) // Moderate (level 3)
		{
			SH1107.DrawNumberLarge(3, 10, 1);
			SH1107.DrawTextMedium("MOD ", 72, 1, true);
			SH1107.DrawTextMedium("  ER", 72, 3, true);
			SH1107.DrawTextMedium("ATE ", 72, 5, true);
		}
		else if (data[4] == 2) // Good (level 2)
		{
			SH1107.DrawNumberLarge(2, 10, 1);
			SH1107.DrawTextMedium("", 72, 1, true);
			SH1107.DrawTextMedium("  GO", 72, 3, true);
			SH1107.DrawTextMedium("  OD", 72, 5, true);
		}
		else // Excellent (level 1)
		{
			SH1107.DrawNumberLarge(1, 10, 1);
			SH1107.DrawTextMedium("EXC ", 72, 1, true);
			SH1107.DrawTextMedium("ELL ", 72, 3, true);
			SH1107.DrawTextMedium("ENT ", 72, 5, true);
		}

		if (alternatingDisplay)
		{
			// Ethanol [C2H6O] measured value (ppm)
			SH1107.DrawTextSmall('C2H6O:', 4, 9, false);
			var textString = data[2].toFixed(0) + " PPM";
			SH1107.DrawTextSmall(textString, 58, 9, true);
			// Hydrogen [H2] measured value (ppm)
			SH1107.DrawTextSmall('H2:       ', 4, 11, false);
			textString = data[3].toFixed(0) + " PPM";
			SH1107.DrawTextSmall(textString, 58, 11, true);

			alternatingDisplay = false;
		}
		else
		{
			// TVOC calculated value (ppb)
			SH1107.DrawTextSmall('TVOC:  ', 4, 9, false);
			var textString = data[0].toFixed(0) + " PPB";
			SH1107.DrawTextSmall(textString, 58, 9, true);
			// CO2eq calculated value (ppm)
			SH1107.DrawTextSmall('CO2 EQ:', 4, 11, false);
			textString = data[1].toFixed(0) + " PPM";
			SH1107.DrawTextSmall(textString, 58, 11, true);

			alternatingDisplay = true;
		}

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

		// Display Indoor Air Quality (IAQ) Level colours as per the German Federal Environmental Agency... (see e.g. the Sensirion application note linked above)
		// (green-turqoise-yellow-orange-red with decreasing air quality)

		if (data[4] == 5) // Unhealthy (level 5)
		{
			icon[0] = icon[1] = icon[2] = icon[3] = icon[4] = icon[5] = icon[10] = icon[11] = icon[12] = icon[13] = icon[19] = icon[20] = icon[21] = icon[22] = icon[23] = 0xaa0000;
		}
		else if (data[4] == 4) // Poor (level 4)
		{
			icon[0] = icon[4] = icon[5] = icon[9] = icon[10] = icon[11] = icon[12] = icon[13] = icon[14] = icon[19] = icon[24] = 0xaa4400;
		}
		else if (data[4] == 3) // Moderate (level 3)
		{
			icon[0] = icon[1] = icon[2] = icon[3] = icon[9] = icon[11] = icon[12] = icon[13] = icon[19] = icon[20] = icon[21] = icon[22] = icon[23] = 0xaa8800;
		}
		else if (data[4] == 2) // Good (level 2)
		{
			icon[0] = icon[1] = icon[2] = icon[3] = icon[9] = icon[11] = icon[12] = icon[13] = icon[15] = icon[20] = icon[21] = icon[22] = icon[23] = icon[24] = 0x008866;
		}
		else // Excellent (level 1)
		{
			icon[2] = icon[6] = icon[7] = icon[12] = icon[17] = icon[22] = 0x008800;
		}

		IS31FL3731_RGB.Display(icon);
	}

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
		// IS31FL3731_WHITE.DrawString("L" + data[4].toString());
        // if (data[4] == 1) IS31FL3731_WHITE.DrawChar(data[4].toString(), 4);
        // else IS31FL3731_WHITE.DrawChar(data[4].toString(), 3);
		IS31FL3731_WHITE.DrawString(data[4].toString());
	}

    // ====================

    if (DRV2605.IsAvailable())
    {
        if (data[4] != previousIAQ)
        {
            if (data[4] == 3) DRV2605.Play(10); // IAQ Moderate (level 3) -> Play a "Double Click 100%" buzz
            else if (data[4] == 4) DRV2605.Play(12); // IAQ Poor (level 4) -> Play a "Triple Click 100%" buzz
            else if (data[4] == 5) DRV2605.Play(16); // IAQ Unhealthy (level 5) -> Play an "Alert 1000 ms" buzz

            previousIAQ = data[4];
        }
    }

	// ====================

	if (refreshAll) Log();
}

// ================================================================================
