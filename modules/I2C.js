// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: I2C COMMON FUNCTIONS ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus

const ADS1015 = require('./ADS1015.js');
const ADT7410 = require('./ADT7410.js');
const ADXL343 = require('./ADXL343.js');
const BMP280 = require('./BMP280.js');
const CAP1166 = require('./CAP1166.js');
const DRV2605 = require('./DRV2605.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');
const LSM303D = require('./LSM303D.js');
const MCP9808 = require('./MCP9808.js');
const SGP30 = require('./SGP30.js');
const SH1107 = require('./SH1107.js');
const SHT31D = require('./SHT31D.js');
const TCS3472 = require('./TCS3472.js');
const TRACKBALL = require('./Trackball.js');
const VCNL4010 = require('./VCNL4010.js');
const VEML6075 = require('./VEML6075.js');

const { performance } = require('perf_hooks');
function Wait(msecs) { const start = performance.now(); while(performance.now() - start < msecs); } // Helper function

module.exports = {
	Start: Start,
	Stop: Stop
};

// ================================================================================

// -----------------------------------------------------------------------------------
// I2C addresses (as of Apr 2019) of some Pimoroni Breakouts and (p)HATs for reference
// -----------------------------------------------------------------------------------

// Breakouts:
// * ADS1015 +/-24V ADC Breakout -> 0x48 (default) or 0x49
// * AS7262 6-channel Spectral Sensor (Spectrometer) Breakout -> 0x49
// * BH1745 Luminance and Colour Sensor Breakout -> 0x38 (default) or 0x39
// * BME680 Breakout - Air Quality, Temperature, Pressure, Humidity Sensor -> 0x76 (default) or 0x77
// * BMP280 Breakout - Temperature, Pressure, Altitude Sensor -> 0x76 (default) or 0x77
// * DRV2605L Linear Actuator Haptic Breakout -> 0x5A
// * ICM20948 9DoF Motion Sensor Breakout -> 0x68 (default) or 0x69
// * IS31FL3731 5x5 RGB LED Matrix Breakout -> 0x74 (default) or 0x77
// * IS31FL3731 11x7 White LED Matrix Breakout -> 0x75 (default) or 0x77
// * LSM303D 6DoF Motion Sensor Breakout -> 0x1d (default) or 0x1E
// * LTR-559 Light & Proximity Sensor Breakout -> 0x23
// * MAX30105 High-Sensitivity Optical ("Smoke Detection") Sensor Breakout -> 0x57
// * MCP9600 Thermocouple Amplifier Breakout -> 0x38 (default?) or 0x39
// * MLX90640 Thermal Camera Breakout -> 0x33
// * N76E003AQ20 MCU Based Trackball Breakout -> 0x0A (default) or 0x0B
// * SH1107 1.12" Mono OLED (128x128, white/black) Breakout -> 0x3c (default) or 0x3d
// * VL53L1X Time of Flight (ToF) Sensor Breakout -> 0x29

// Enviro pHAT:
// * ADS1015 4-channel 5v tolerant 12-bit analog to digital sensor (ADC) -> 0x49
//   (nb. 3.3v only 12-bit ADC at address 0x48 in first production run of the board, not [yet?] supported)
// * BMP280 temperature/pressure sensor -> 0x77
// * LSM303D accelerometer/magnetometer sensor -> 0x1d 
// * TCS3472 light and RGB colour sensor -> 0x29,
//   plus two LEDs for illumination controlled by GPIO #4 (pin 7)

// Touch pHAT:
// * CAP1166 capacitive touch and LED driver chip -> 0x2c
//   (controlling 6 capacitive touch buttons + 6 bright white under-mounted LEDs)

// -----------------------------------------------------------------------------------
// I2C addresses (as of Apr 2019) of select Adafruit Sensor Breakouts for reference
// -----------------------------------------------------------------------------------

// * ADT7410 High Accuracy Temperature Sensor Breakout -> Configurable 0x48-0x4b via address pins
// * ADXL343 Triple-Axis Accelerometer Breakout -> 0x53 (default) or 0x1d
// * MCP9808 High Accuracy Temperature Sensor Breakout -> Configurable 0x18-0x1f via address pins
// * SGP30 Indoor Air Quality (TVOC and CO2eq) Gas Sensor Breakout -> 0x58
// * SHT31-D Temperature & Humidity Sensor Breakout -> 0x44
// * VCNL4010 Proximity/Light Sensor Breakout -> 0x13
// * VEML6075 UVA UVB and UV Index Sensor Breakout -> 0x10

// -----------------------------------------------------------------------------------

var I2C_BUS = 0;

// ====================

function Start(outputLogs, showDebug)
{
	// Open the I2C bus...
	I2C_BUS = i2c.openSync(1, true);

	if (showDebug)
	{
		var functions = I2C_BUS.i2cFuncsSync();
		if (functions.i2c) console.log("Breakout Gardener -> DEBUG -> The adapter can handle plain I2C-level commands.");
		else console.log("Breakout Gardener -> DEBUG -> The adapter is a pure SMBus adapter.");
		if (functions.tenBitAddr) console.log("Breakout Gardener -> DEBUG -> The adapter can handle 10-bit address extensions.");
		if (functions.smbusReadByte) console.log("Breakout Gardener -> DEBUG -> The adapter can handle SMBus read byte commands.");
		if (functions.smbusReadWord) console.log("Breakout Gardener -> DEBUG -> The adapter can handle SMBus read word commands.");
		if (functions.smbusReadI2cBlock) console.log("Breakout Gardener -> DEBUG -> The adapter can handle SMBus read I2C block commands.");
		if (functions.smbusWriteByte) console.log("Breakout Gardener -> DEBUG -> The adapter can handle SMBus write byte commands.");
		if (functions.smbusWriteWord) console.log("Breakout Gardener -> DEBUG -> The adapter can handle SMBus write word commands.");
		if (functions.smbusWriteI2cBlock) console.log("Breakout Gardener -> DEBUG -> The adapter can handle SMBus write I2C block commands.");
	}

	// ====================

	// Scan for devices on the opened I2C bus...
	var devices = I2C_BUS.scanSync();
	if (devices.length > 0)
	{
		console.log("Breakout Gardener -> INFO -> %s I2C device(s) found:\n", devices.length);
		for (var i = 0; i < devices.length; i++)
		{
			switch (devices[i])
			{
				// ====================

				case 0x0A: // ##### Pimoroni Trackball Breakout ##### (primary address) (nb. device specific N76E003AQ20 MCU based I2C implementation)
				case 0x0B: // (secondary address)
				{
					if (TRACKBALL.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mTRACKBALL\x1b[0m found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x10: // ##### Vishay Semiconductors VEML6075 #####
						   // -> Adafruit VEML6075 Sensor Breakout
				{
					if (VEML6075.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mVEML6075\x1b[0m UVA/UVB sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x13: // ##### Vishay Semiconductors VCNL4010 #####
						   // -> Adafruit VCNL4010 Sensor Breakout
				{
					if (VCNL4010.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mVCNL4010\x1b[0m proximity/light sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x18: // ##### Microchip Technology MCP9808 #####
						   // -> Adafruit MCP9808 Sensor Breakout (primary address @ pins "000" -> A2/A1/A0 == 0)
				case 0x19: // -> Adafruit MCP9808 Sensor Breakout (secondary address @ pins "001" -> A2/A1 == 0, A0 = 1)
				{
					if (MCP9808.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mMCP9808\x1b[0m high accuracy temperature sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x1d: // ##### STMicroelectronics LSM303D #####
						   // -> Pimoroni Enviro pHAT
						   // -> Pimoroni LSM303D Sensor Breakout (primary address)
				case 0x1e: // -> Pimoroni LSM303D Sensor Breakout (secondary address)
				{
					if (LSM303D.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mLSM303D\x1b[0m accelerometer/magnetometer sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x29: // ##### ams TCS3472 #####
						   // -> Pimoroni Enviro pHAT
				{
					if (TCS3472.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mTCS3472\x1b[0m light and RGB colour sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x2c: // ##### Microchip Technology CAP1166 #####
						   // -> Pimoroni Touch pHAT
				{
					if (CAP1166.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mCAP1166\x1b[0m capacitive touch and LED driver chip [Touch pHAT] found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x3c: // ##### Display Future / Sino Wealth SH1107 #####
						   // -> Pimoroni SH1107 Mono OLED Breakout (primary address)
				case 0x3d: // -> Pimoroni SH1107 Mono OLED Breakout (secondary address)
				{
					// ### Note: Supporting only the SH1107 *128x128* pixels Mono OLED display! ###
					if (SH1107.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mSH1107\x1b[0m 1.12\" Mono OLED (128x128, white/black) found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x44: // ##### Sensirion SHT31D #####
						   // -> Adafruit SHT31D Sensor Breakout (primary address)
				{
					if (SHT31D.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mSHT31D\x1b[0m humidity and temperature sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

                // ====================

				case 0x48: // ##### Analog Devices ADT7410 #####
						   // -> Adafruit ADT7410 Sensor Breakout (primary address @ pins "00" -> A1/A0 == 0)
				{
					if (ADT7410.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mADT7410\x1b[0m high accuracy temperature sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x49: // ##### Analog Devices ADT7410 #####
						   // -> Adafruit ADT7410 Sensor Breakout (secondary address @ pins "01" -> A1 == 0, A0 == 1)
						   // ##### Texas Instruments ADS1015 #####
						   // -> Pimoroni Enviro pHAT
				{
					if (ADT7410.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mADT7410\x1b[0m high accuracy temperature sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					else if (ADS1015.Identify(I2C_BUS, devices[i])) // Nb. Needs to be last since there's no way to identify this device
					{
						console.log("   • \x1b[32mADS1015\x1b[0m 4-channel 5V tolerant 12-bit analog to digital sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x53: // ##### Analog Devices ADXL343 #####
						   // -> Adafruit ADXL343 Triple-Axis Accelerometer Breakout (primary address)
				{
					if (ADXL343.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mADXL343\x1b[0m triple-axis accelerometer found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x58: // ##### Sensirion SGP30 #####
						   // -> Adafruit SGP30 Sensor Breakout
				{
					if (SGP30.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mSGP30\x1b[0m indoor air quality (TVOC and CO2eq -> IAQ) gas sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
                }
                
				// ====================

				case 0x5A: // ##### Texas Instruments DRV2605 #####
						   // -> Pimoroni DRV2605L Linear Actuator Haptic Breakout
				{
					if (DRV2605.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mDRV2605\x1b[0m haptic driver found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x74: // ##### Integrated Silicon Solution Inc (ISSI) IS31FL3731 #####
						   // -> Pimoroni 5x5 RGB LED Matrix Breakout (primary address)
				{
					if (IS31FL3731_RGB.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mIS31FL3731\x1b[0m based RGB LED matrix found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x75: // ##### Integrated Silicon Solution Inc (ISSI) IS31FL3731 #####
						   // -> Pimoroni 11x7 White LED Matrix Breakout (primary address)
				{
					if (IS31FL3731_WHITE.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mIS31FL3731\x1b[0m based White LED matrix found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x76: // ##### Bosch Sensortec BMP280 #####
						   // -> Pimoroni BMP280 Sensor Breakout (primary address)
				{
					if (BMP280.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mBMP280\x1b[0m temperature/pressure sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					break;
				}

				// ====================

				case 0x77: // ##### Bosch Sensortec BMP280 #####
						   // -> Pimoroni Enviro pHAT, Pimoroni BMP280 Sensor Breakout (secondary address)
						   // ##### Integrated Silicon Solution Inc (ISSI) IS31FL3731 #####
						   // -> Pimoroni 5x5 RGB LED Matrix Breakout (secondary address)
						   // -> Pimoroni 11x7 White LED Matrix Breakout (secondary address)
				{
					if (BMP280.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mBMP280\x1b[0m temperature/pressure sensor found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
					else if (IS31FL3731_RGB.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mIS31FL3731\x1b[0m based RGB LED matrix found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
/*
					else if (IS31FL3731_WHITE.Identify(I2C_BUS, devices[i]))
					{
						console.log("   • \x1b[32mIS31FL3731\x1b[0m based White LED matrix found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					}
*/
					break;
				}

				// ====================

				default: // UNKNOWN DEVICE
				{
					console.log("   • \x1b[31mDEBUG\x1b[0m -> Unknown device found at I2C address 0x%s (device %s on bus 1).", devices[i].toString(16), i);
					break;
				}

				// ====================
			}
		}
		console.log("");
	}
}

// ====================

function Stop(reset)
{
	if (reset) // Soft reset applicable I2C devices upon exit? (in my experience, e.g. the SGP30 becomes more reliable across restarts with this enabled)
	{
		console.log("Breakout Gardener -> INFO -> Terminating: Soft resetting applicable I2C devices...");
		I2C_BUS.sendByteSync(0x00, 0x06); // Soft reset all [supporting/applicable] devices using the I2C General Call address (0x00)...
        // setTimeout(function() { I2C_BUS.closeSync(); }, 3000); // Wait 3 seconds, then close the I2C bus...
        Wait(3000); // Wait 3 seconds, then close the I2C bus...
	}
	else I2C_BUS.closeSync(); // Close the I2C bus...
}

// ================================================================================
