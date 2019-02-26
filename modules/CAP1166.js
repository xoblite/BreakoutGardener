// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: CAP1166 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus

module.exports = {
	Identify: Identify,
	IsAvailable: IsAvailable,
	Start: Start,
	Stop: Stop,
	Get: Get,
	SetLEDs: SetLEDs
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === Microchip Technology CAP1166 Capacitive Touch Controller ===
// * Product Page -> https://www.microchip.com/wwwproducts/en/CAP1166
// * Datasheet -> http://ww1.microchip.com/downloads/en/DeviceDoc/00001621B.pdf
// * Application Notes -> https://www.microchip.com/wwwproducts/en/CAP1166
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_CAP1166 = 0;
var touchBlocked = false;
var touchBlockedInterval = null;
var buttonsTouched = 0b00000000;
var buttonsLEDs = 0b00000000;
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_CAP1166 > 0) return false;

	// Identify using the manufacturer (0x5d) and product (0x51) IDs of the CAP1166 device...
	var manufacturerID = bus.readByteSync(address, 0xfe);
	var deviceID = bus.readByteSync(address, 0xfd);
	if ((manufacturerID == 0x5d) && (deviceID == 0x51))
	{
		I2C_BUS = bus;
		I2C_ADDRESS_CAP1166 = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_CAP1166) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x00, 0b00000000); // Main Control -> Default (active state == power on == no standby, gain 1x)
	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x1f, 0b00101111); // Sensitivity control -> Default (32x multiplier)
	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x20, 0b00100000); // Configuration #1 -> Default
	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x44, 0b01000000); // Configuration #2 -> Default
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x21, 0b00111111); // Sensor Input Enable -> Default (all touch sensors enabled)
	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x22, 0b10100100); // Sensor Input Configuration #1 -> Default
	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x23, 0b00001111); // Sensor Input Configuration #2 -> Max amount of time before "press and hold" detected (we don't use it)
	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x24, 0b00111001); // Averaging and Sampling Configuration -> Default
	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x27, 0b00000000); // Interrupt Enable -> Disable all interrupts
	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x28, 0b00000000); // Repeat Rate Enable -> Disable all repeat rates
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x2a, 0b10000000); // Multiple Touch Config -> Default (disable multitouch)
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x2b, 0b00000000); // Multiple Touch Pattern Config -> Default
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x2d, 0b00111111); // Multiple Touch Pattern -> Default
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x2f, 0b10001010); // Recalibration Configuration -> Default

	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x74, 0b00000000); // Turn off all 6 button LEDs (just in case)
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x72, 0b00000000); // Sensor Input LED Linking -> No LEDs linked to their inputs (nb. the actual inputs and LEDs on the Touch pHAT seem to be swapped, so we can't use this anyway)
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x77, 0b00000000); // Linked LED Transition Control -> Default
	I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x81, 0b00000000); // LED 4-1 behaviour (2 bits each) -> Programmed active/inactive
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x82, 0b00000000); // LED 6-5 behavious (2 bits each) -> Programmed active/inactive
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x93, 0b00110000); // LED Direct Duty Cycle (brightness) -> 14% (dimmed)

    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x26, 0b00111111); // Calibration Activate -> Recalibrate all sensor inputs CS1-CS6 (takes up to 600 msec but this is not an issue for us)
}

function Stop()
{
    clearInterval(touchBlockedInterval);
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x74, 0b00000000); // Turn off all 6 button LEDs
}

// ====================

function touchUnblock() // Helper function to Get()
{
    // Allow touch again... (unblock input)
    clearInterval(touchBlockedInterval);
    touchBlocked = false;
}

function Get()
{
	// if (!IsAvailable()) return [0b11111111, 0b00000000]; // Signal error

    if (touchBlocked)
    {
        // Touch input is temporarily blocked to avoid double
        // triggering (see below), reset the touch interrupt flag...
        I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x00, 0x00);
        return [0b00000000, buttonsLEDs];
    }

    // ====================

    // Read touch status...
    var touchStatus = I2C_BUS.readByteSync(I2C_ADDRESS_CAP1166, 0x02);

    if (touchStatus & 1) // ===== Touch detected! =====
    {
        buttonsTouched = 0b00000000;

        touchStatus = I2C_BUS.readByteSync(I2C_ADDRESS_CAP1166, 0x03); // Check *which* button was touched... (note: flipped bit order compared to physical order left-right on Enviro pHAT)

        if (touchStatus & 1)
        {
            if (outputLogs) console.log("Breakout Gardener -> CAP1166 -> \x1b[97;100m Button #1 (<) \x1b[0m touched.");
            buttonsTouched |= 0b00100000;
        }
        if (touchStatus & 2)
        {
            if (outputLogs) console.log("Breakout Gardener -> CAP1166 -> \x1b[97;100m Button #2 (A) \x1b[0m touched.");
            buttonsTouched |= 0b00010000;
        }
        if (touchStatus & 4)
        {
            if (outputLogs) console.log("Breakout Gardener -> CAP1166 -> \x1b[97;100m Button #3 (B) \x1b[0m touched.");
            buttonsTouched |= 0b00001000;
        }
        if (touchStatus & 8)
        {
            if (outputLogs) console.log("Breakout Gardener -> CAP1166 -> \x1b[97;100m Button #4 (C) \x1b[0m touched.");
            buttonsTouched |= 0b00000100;
        }
        if (touchStatus & 16)
        {
            if (outputLogs) console.log("Breakout Gardener -> CAP1166 -> \x1b[97;100m Button #5 (D) \x1b[0m touched.");
            buttonsTouched |= 0b00000010;
        }
        if (touchStatus & 32)
        {
            if (outputLogs) console.log("Breakout Gardener -> CAP1166 -> \x1b[97;100m Button #6 (>) \x1b[0m touched.");
            buttonsTouched |= 0b00000001;
        }

        // Block new touches for a while to avoid double/repeated triggering...
        touchBlocked = true;
        touchBlockedInterval = setInterval(touchUnblock, 1000); // -> 1 second

        // Finally, we reset the touch interrupt flag...
		I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x00, 0x00);

	    return [buttonsTouched, buttonsLEDs];
	}
	else return [0b00000000, buttonsLEDs]; // ===== No touch detected =====
}

// ====================

function SetLEDs(leds)
{
	// Update the button LED status:
    // LED output state 0b00nnnnnn -> Turn button LED on if n is 1 / off if n is 0
    I2C_BUS.writeByteSync(I2C_ADDRESS_CAP1166, 0x74, leds);
    buttonsLEDs = leds;
}

// ================================================================================
