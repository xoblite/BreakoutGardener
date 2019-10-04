// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: DRV2605 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus

module.exports = {
	Identify: Identify,
	IsAvailable: IsAvailable,
	Start: Start,
	Stop: Stop,
	Play: Play
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === Texas Instruments DRV2605 Haptic Driver ===
// * Product Page -> http://www.ti.com/product/DRV2605
// * Datasheet -> http://www.ti.com/lit/ds/symlink/drv2605.pdf
// * Device Setup Guide -> http://www.ti.com/lit/an/sloa189/sloa189.pdf
// ----------------------------------------------------------------------------------------
// === Pimoroni DRV2605L Linear Actuator Haptic Breakout ===
// * Product Page -> https://shop.pimoroni.com/products/drv2605l-linear-actuator-haptic-breakout
// * Python Library -> https://github.com/pimoroni/drv2605-python
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_DRV2605 = 0;
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
    if (I2C_ADDRESS_DRV2605 > 0) return false;

    // Identify using the device ID (0xe0) of the DRV2605L device...
    // (i.e. the low-voltage version of the DRV2605 as used by Pimoroni)
	var deviceID = bus.readByteSync(address, 0x00) & 0b11100000;
	if (deviceID == 0xe0)
	{
		I2C_BUS = bus;
		I2C_ADDRESS_DRV2605 = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_DRV2605) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

    // Configure the device... (nb. this module only supports and uses pre-defined library waveforms)
    I2C_BUS.writeByteSync(I2C_ADDRESS_DRV2605, 0x01, 0b00000000); // Device ready mode, Internal trigger
    I2C_BUS.writeByteSync(I2C_ADDRESS_DRV2605, 0x1a, 0b10000000); // LRA feedback control
    I2C_BUS.writeByteSync(I2C_ADDRESS_DRV2605, 0x03, 0b00000111); // LRA waveform library
    var writeBuf = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]);
    I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_DRV2605, 0x04, 8, writeBuf); // Erase any prior waveform selections or wait times
}

function Stop()
{
    I2C_BUS.writeByteSync(I2C_ADDRESS_DRV2605, 0x01, 0b10000000); // Reset device (used mainly for debug purposes)
    return;
}

// ====================

function Play(waveform)
{
    // Example waveforms mentioned in the DRV2605 device setup guide (see link above):
    // Clicks:  1 -> Single Click 100%, 10 -> Double Click 100%, 12 -> Triple Click 100%
    // Alerts:  15 -> Alert 750 ms, 16 -> Alert 1000 ms
    // Ramps:   73 -> Transition Ramp Down Medium Smooth2 100% to 0%

    if (waveform > 1 && waveform <= 255)
    {
        if (outputLogs) console.log("Breakout Gardener -> DRV2605 -> Playing waveform #%s.", waveform);

        I2C_BUS.writeByteSync(I2C_ADDRESS_DRV2605, 0x04, waveform); // Select waveform...
        I2C_BUS.writeByteSync(I2C_ADDRESS_DRV2605, 0x0c, 0b00000001); // ...and play it! =]
    }
}

// ================================================================================
