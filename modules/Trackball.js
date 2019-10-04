// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: TRACKBALL ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus

module.exports = {
	Identify: Identify,
	IsAvailable: IsAvailable,
	Start: Start,
	Stop: Stop,
	Get: Get
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === Pimoroni Trackball Breakout ===
// * Product Page -> https://shop.pimoroni.com/products/trackball-breakout
// * Python Library -> https://github.com/pimoroni/matrix11x7-python
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_TRACKBALL = 0;
var data = [0,0,0,0,0];
var disableLEDIndication = false;
var setDefaultLEDsNextTime = false;
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_TRACKBALL > 0) return false;

	// Identify using the device ID (0xba11)
	// of the Pimoroni Trackball Breakout...
	var deviceID = bus.readWordSync(address, 0xfa);
	if (deviceID == 0xba11)
	{
		I2C_BUS = bus;
		I2C_ADDRESS_TRACKBALL = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_TRACKBALL) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	// Configure the device...
	SetRGBW(0,0,0,64); // Set trackball colour to "waiting for input" dark grey...
	I2C_BUS.writeByteSync(I2C_ADDRESS_TRACKBALL, 0xf9, 0b00000000); // Disable GPIO interrupts... (we don't use them)
	I2C_BUS.readI2cBlockSync(I2C_ADDRESS_TRACKBALL, 0x04, 5, Buffer.alloc(5, 0x00)); // Perform a "dummy read" to flush any movement/click events detected by the device prior to startup...

	if (showDebug)
	{
		var version = I2C_BUS.readByteSync(I2C_ADDRESS_TRACKBALL, 0xfc);
		console.log("Breakout Gardener -> TRACKBALL -> The current device firmware version is 0x%s.", version.toString(16));
	}
}

function Stop() { return; }

// ====================

function Get()
{
	var readBuffer = Buffer.alloc(5, 0x00);
	var bytesRead = I2C_BUS.readI2cBlockSync(I2C_ADDRESS_TRACKBALL, 0x04, 5, readBuffer);

	if (bytesRead == 5)
	{
		data[0] = readBuffer[0]; // Left
		data[1] = readBuffer[1]; // Right
		data[2] = readBuffer[2]; // Up
		data[3] = readBuffer[3]; // Down
		data[4] = readBuffer[4]; // Click ("switch")
//		data[4] = readBuffer[4] & 0b10000000; // Click ("switch")

		var msg = "";

		// ====================

		if (data[4] > 0) // -> Has the trackball been clicked since we last checked? (nb. in this implementation, clicking has precedence over movement, due to the difficulty of clicking without moving such a small trackball)
		{
			if (!disableLEDIndication)
			{
				SetRGBW(255,192,255,255); // Set the trackball colour to bright white... (nb. the green LED is a bit dominant on my breakout at least, so dialing it down a bit to avoid it green-tinting the wanted bright white)
				setDefaultLEDsNextTime = true;
			}
			msg = "Breakout Gardener -> TRACKBALL -> Direction: Left " + data[0] + " Right " + data[1] + " Up " + data[2] + " Down " + data[3] + " / Clicked? \x1b[30;107m Yes \x1b[0m.";
			if (outputLogs) console.log(msg);
			return 5; // Return "clicked" signal
		}

		// ====================

		else // -> The trackball has not been clicked, let's focus on any directional scrolling movements instead...
		{
			if (data[0] > 10 && data[0] > data[1] && data[0] > data[2] && data[0] > data[3]) // Predominantly moving ===LEFT===
			{
				if (!disableLEDIndication)
				{
					SetRGBW(255,0,0,0); // Set the trackball colour to red...
					setDefaultLEDsNextTime = true;
				}
				if (outputLogs)
				{
					msg = "Breakout Gardener -> TRACKBALL -> Direction: \x1b[30;107m Left " + data[0] + " \x1b[0m Right " + data[1] + " Up " + data[2] + " Down " + data[3] + " / Clicked: No.";
					console.log(msg);
				}
				return 1; // Return "left" signal
			}

			// ====================

			else if (data[1] > 10 && data[1] > data[0] && data[1] > data[2] && data[1] > data[3]) // Predominantly moving ===RIGHT===
			{
				if (!disableLEDIndication)
				{
					SetRGBW(0,255,0,0); // Set the trackball colour to green...
					setDefaultLEDsNextTime = true;
				}
				if (outputLogs)
				{
					msg = "Breakout Gardener -> TRACKBALL -> Direction: Left " + data[0] + " \x1b[30;107m Right " + data[1] + " \x1b[0m Up " + data[2] + " Down " + data[3] + " / Clicked: No.";
					console.log(msg);
				}
				return 2; // Return "right" signal
			}

			// ====================

			else if (data[2] > 10 && data[2] > data[0] && data[2] > data[1] && data[2] > data[3]) // Predominantly moving ===UP===
			{
				if (!disableLEDIndication)
				{
					SetRGBW(255,192,0,0); // Set the trackball colour to yellow... (nb. the green LED is a bit dominant on my breakout at least, so dialing it down a bit to avoid it green-tinting the wanted yellow)
					setDefaultLEDsNextTime = true;
				}
				if (outputLogs)
				{
					msg = "Breakout Gardener -> TRACKBALL -> Direction: Left " + data[0] + " Right " + data[1] + " \x1b[30;107m Up " + data[2] + " \x1b[0m Down " + data[3] + " / Clicked: No.";
					console.log(msg);
				}
				return 3; // Return "up" signal
			}

			// ====================

			else if (data[3] > 10 && data[3] > data[0] && data[3] > data[1] && data[3] > data[2]) // Predominantly moving ===DOWN===
			{
				if (!disableLEDIndication)
				{
					SetRGBW(0,0,255,0); // Set the trackball colour to blue...
					setDefaultLEDsNextTime = true;
				}
				if (outputLogs)
				{
					msg = "Breakout Gardener -> TRACKBALL -> Direction: Left " + data[0] + " Right " + data[1] + " Up " + data[2] + " \x1b[30;107m Down " + data[3] + " \x1b[0m / Clicked: No.";
					console.log(msg);
				}
				return 4; // Return "down" signal
			}

			// ====================

			else // === No predominant movement detected ===
			{
				if (setDefaultLEDsNextTime)
				{
					SetRGBW(0,0,0,64); // Set the trackball colour to "waiting for input" dark grey... (if it wasn't already; we do this filtering to avoid unnecessary writes to the device)
					setDefaultLEDsNextTime = false;
				}
				if (showDebug)
				{
					msg = "Breakout Gardener -> TRACKBALL -> Direction: Left " + data[0] + " Right " + data[1] + " Up " + data[2] + " Down " + data[3] + " / Clicked: No.";
					console.log(msg);
				}
				return 0; // Return "waiting for input" signal
			}
		}
	}

	// ====================

	else // -> ERROR detected!
	{
		data = [0,0,0,0,0]; // Zero the internal data buffer (i.e. erasing any old entries)
		SetRGBW(64,0,0,0); // Set the trackball colour to "error" dark red... (think HAL 9000 ;) )
		if (showDebug) console.log("Breakout Gardener -> TRACKBALL -> \x1b[31mERROR\x1b[0m -> Failed to read status from the device!");
	}

	return 0; // Failsafe: Return "waiting for input" signal
}

// ====================

function SetRGBW(r,g,b,w)
{
	I2C_BUS.writeByteSync(I2C_ADDRESS_TRACKBALL, 0x00, r); // Red LED intensity (0-255)
	I2C_BUS.writeByteSync(I2C_ADDRESS_TRACKBALL, 0x01, g); // Green LED intensity (0-255) (nb. the green LED is a bit dominant on my breakout at least, so you may have to dial it down a bit in order to get the exact colour you're after, i.e. to avoid a green-tinted appearance)
	I2C_BUS.writeByteSync(I2C_ADDRESS_TRACKBALL, 0x02, b); // Blue LED intensity (0-255)
	I2C_BUS.writeByteSync(I2C_ADDRESS_TRACKBALL, 0x03, w); // White LED intensity (0-255)
}

// ================================================================================
