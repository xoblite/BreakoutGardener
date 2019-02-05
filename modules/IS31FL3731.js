// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: IS31FL3731 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus

module.exports = {
	Identify: Identify,
	IsAvailable: IsAvailable,
	Start: Start,
	Stop: Stop,
	On: On,
	Off: Off,
	Clear: Clear,
	// -----------
	SetPixel: SetPixel,
	Display: Display,
	Get: Get,
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === Integrated Silicon Solution Inc (ISSI) IS31FL3731 Matrix LED Driver ===
// * Product Page -> http://ams.issi.com/US/product-analog-fxled-driver.shtml
// * Datasheet -> http://ams.issi.com/WW/pdf/IS31FL3731.pdf
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_IS31FL3731 = 0;
const DISPLAY_WIDTH = 5, DISPLAY_HEIGHT = 5;
var displayBuffer = [0x0000ff, 0x0000ff, 0xcc8800, 0x0000ff, 0x0000ff,
					 0x0000ff, 0x0000ff, 0xcc8800, 0x0000ff, 0x0000ff,
					 0xcc8800, 0xcc8800, 0xcc8800, 0xcc8800, 0xcc8800,
					 0x0000ff, 0x0000ff, 0xcc8800, 0x0000ff, 0x0000ff,
					 0x0000ff, 0x0000ff, 0xcc8800, 0x0000ff, 0x0000ff ];
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	// Note: There doesn't seem to be a way to identify the
	// IS31FL3731 device unfortunately [?], so here we go...
	I2C_BUS = bus;
	I2C_ADDRESS_IS31FL3731 = address;
	return true;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_IS31FL3731) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	// Configure the device...
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0xfd, 0x0b); // Point to Function (Control) Register
//	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x0a, 0b00000000); // Shutdown Register -> Power Off ("Shutdown Mode")
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x00, 0b00000000); // Configuration Register -> Picture Mode
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x01, 0b00000000); // Picture Display Register -> Display Frame 1
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x02, 0b00000000); // Auto Play Control Register 1 -> Defaults/NA
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x03, 0b00000000); // Auto Play Control Register 2 -> Defaults/NA
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x05, 0b00000000); // Display Option Register -> Defaults
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x06, 0b00000000); // Audio Synchronization Register -> Defaults (audio synchronization disabled)
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x08, 0b00000000); // Breath Control Register 1 -> Defaults
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x09, 0b00000000); // Breath Control Register 2 -> Defaults
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x0b, 0b00000000); // AGC Control Register -> Defaults/NA
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x0c, 0b00000000); // Audio ADC Rate Register -> Defaults/NA
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x0a, 0b00000001); // Shutdown Register -> Power On ("Normal Operation")
}

function Stop() { Off(); }

// ====================

function On()
{
	// Turn on the display...
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0xfd, 0x0b); // Point to Function (Control) Register
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x0a, 0b00000001); // Shutdown Register -> Power On ("Normal Operation")
	// if (outputLogs) console.log("Breakout Gardener -> IS31FL3731 -> Turning on the display.");
}
function Off()
{
	// Turn off the display...
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0xfd, 0x0b); // Point to Function (Control) Register
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0x0a, 0b00000000); // Shutdown Register -> Power Off ("Shutdown Mode")
	// if (outputLogs) console.log("Breakout Gardener -> IS31FL3731 -> Turning off the display.");
}
function Clear()
{
	// Clear all pixels...
	// (nb. for ease-of-use we do this by *dimming* them all to zero, *not* by turning them all off)
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0xfd, 0x00); // Point to Picture Frame 1 Register
	for (n = 0x00; n<=0x11; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, n, 0xff); // (1) Turn on all LEDs (R+G+B)
	for (n = 0x24; n<=0xb3; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, n, 0x00); // (2) Dim all LEDs (R+G+B) to zero
	displayBuffer.fill(0x000000); // Clear the display buffer as well...
	// if (showDebug) console.log("Breakout Gardener -> IS31FL3731 -> Clearing the display...");
}

// ====================

const DEFAULT_GAMMA_TABLE = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2,
    2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5,
    6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 11, 11,
    11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18,
    19, 19, 20, 21, 21, 22, 22, 23, 23, 24, 25, 25, 26, 27, 27, 28,
    29, 29, 30, 31, 31, 32, 33, 34, 34, 35, 36, 37, 37, 38, 39, 40,
    40, 41, 42, 43, 44, 45, 46, 46, 47, 48, 49, 50, 51, 52, 53, 54,
    55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
    71, 72, 73, 74, 76, 77, 78, 79, 80, 81, 83, 84, 85, 86, 88, 89,
    90, 91, 93, 94, 95, 96, 98, 99, 100, 102, 103, 104, 106, 107, 109, 110,
    111, 113, 114, 116, 117, 119, 120, 121, 123, 124, 126, 128, 129, 131, 132, 134,
    135, 137, 138, 140, 142, 143, 145, 146, 148, 150, 151, 153, 155, 157, 158, 160,
    162, 163, 165, 167, 169, 170, 172, 174, 176, 178, 179, 181, 183, 185, 187, 189,
    191, 193, 194, 196, 198, 200, 202, 204, 206, 208, 210, 212, 214, 216, 218, 220,
	222, 224, 227, 229, 231, 233, 235, 237, 239, 241, 244, 246, 248, 250, 252, 255];

function ApplyGamma(color) { return DEFAULT_GAMMA_TABLE[color]; }

function GetAddressForPixelRed(n) // Display() helper function for RED LEDs
{
	const lookupRed = [ 118, 117, 116, 115, 114, 132, 133, 134, 112, 113, 131, 130, 129, 128, 127, 125, 124, 123, 122, 121, 126, 15, 8, 9, 10, 11, 12, 13 ];
	return lookupRed[n];
}
function GetAddressForPixelGreen(n) // Display() helper function for GREEN LEDs
{
	const lookupGreen = [ 69, 68, 84, 83, 82, 19, 20, 21, 80, 81, 18, 17, 33, 32, 47, 28, 27, 26, 25, 41, 29, 95, 89, 90, 91, 92, 76, 77 ];
	return lookupGreen[n];
}
function GetAddressForPixelBlue(n) // Display() helper function for BLUE LEDs
{
	const lookupBlue = [ 85, 101, 100, 99, 98, 35, 36, 37, 96, 97, 34, 50, 49, 48, 63, 44, 43, 42, 58, 57, 45, 111, 105, 106, 107, 108, 109, 93 ];
	return lookupBlue[n];
}

function SetPixel(x, y, color) // Display() helper function for all pixels i.e. the combined R+G+B LEDs
{
	if (x > DISPLAY_WIDTH || x > DISPLAY_HEIGHT) return;
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0xfd, 0x00); // Point to Picture Frame 1 Register
	SetPixelRGB(x, y, color);
}

function SetPixelRGB(x, y, color) // Display() helper function for all pixels i.e. the combined R+G+B LEDs
{
	var pixel = (y*DISPLAY_WIDTH) + x;
	displayBuffer[pixel] = color; // Copy the pixel to our display buffer for possible later use (e.g. Get())

	address = 0x24 + GetAddressForPixelRed(pixel);
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, address, ApplyGamma((color & 0xff0000) >> 16));
	address = 0x24 + GetAddressForPixelGreen(pixel);
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, address, ApplyGamma((color & 0x00ff00) >> 8));
	address = 0x24 + GetAddressForPixelBlue(pixel);
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, address, ApplyGamma((color & 0x0000ff)));
}

function Display(input)
{
	var fillDisplay = false;

	if (!Array.isArray(input)) fillDisplay = true;
	else if (input.length != (DISPLAY_WIDTH*DISPLAY_HEIGHT)) return;

	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, 0xfd, 0x00); // Point to Picture Frame 1 Register
	// for (n = 0x00; n<=0x11; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731, n, 0b11111111); // Turn on all LEDs... (R+G+B)

	for (var y=0; y<DISPLAY_HEIGHT; y++)
	{
		for (var x=0; x<DISPLAY_WIDTH; x++)
		{
			var offset = (y*DISPLAY_WIDTH) + x;
			if (fillDisplay) SetPixelRGB(x, y, input); // Fill display with a single input RGB color
			else SetPixelRGB(x, y, input[offset]);	// Draw a picture from the input RGB pixel array
		}
	}

	// if (showDebug) console.log("Breakout Gardener -> IS31FL3731 -> Drawing picture...");
}

// ====================

function Get() { return displayBuffer; }

// ====================

function Log()
{
}

// ================================================================================
