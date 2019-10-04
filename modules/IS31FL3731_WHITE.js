// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: IS31FL3731 (WHITE) ---
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
	Display: Display,
	Get: Get,
	// -----------
	DrawChar: DrawChar,
	DrawString: DrawString,
	DrawMeter: DrawMeter
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === Integrated Silicon Solution Inc (ISSI) IS31FL3731 Matrix LED Driver ===
// * Product Page -> http://ams.issi.com/US/product-analog-fxled-driver.shtml
// * Datasheet -> http://ams.issi.com/WW/pdf/IS31FL3731.pdf
// * Pimoroni 11x7 White LED Matrix Breakout -> https://shop.pimoroni.com/products/11x7-led-matrix-breakout
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_IS31FL3731_WHITE = 0;
const DISPLAY_WIDTH = 11, DISPLAY_HEIGHT = 7;
var displayBuffer = [0,0,0,0,0,0,0,0,0,0,0,
					 0,0,0,0,0,0,0,0,0,0,0,
					 0,0,0,0,0,0,0,0,0,0,0,
					 0,0,0,0,0,0,0,0,0,0,0,
					 0,0,0,0,0,0,0,0,0,0,0,
					 0,0,0,0,0,0,0,0,0,0,0,
					 0,0,0,0,0,0,0,0,0,0,0 ];
const defaultIntensity = 40;
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_IS31FL3731_WHITE > 0) return false;

	// Note: There doesn't seem to be a way to identify the
	// IS31FL3731 device unfortunately [?], so here we go...
	I2C_BUS = bus;
	I2C_ADDRESS_IS31FL3731_WHITE = address;
	return true;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_IS31FL3731_WHITE) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	Off();

	// Configure the device...
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0xfd, 0x0b); // Point to Function (Control) Register
	// I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x0a, 0b00000000); // Shutdown Register -> Power Off ("Shutdown Mode")
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x00, 0b00000000); // Configuration Register -> Picture Mode
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x01, 0b00000000); // Picture Display Register -> Display Frame 1
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x02, 0b00000000); // Auto Play Control Register 1 -> Defaults/NA
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x03, 0b00000000); // Auto Play Control Register 2 -> Defaults/NA
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x05, 0b00000000); // Display Option Register -> Defaults
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x06, 0b00000000); // Audio Synchronization Register -> Defaults (audio synchronization disabled)
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x08, 0b00000000); // Breath Control Register 1 -> Defaults
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x09, 0b00000000); // Breath Control Register 2 -> Defaults
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x0b, 0b00000000); // AGC Control Register -> Defaults/NA
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x0c, 0b00000000); // Audio ADC Rate Register -> Defaults/NA
	// I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x0a, 0b00000001); // Shutdown Register -> Power On ("Normal Operation")

	Clear();
	On();
}

function Stop() { Off(); }

// ====================

function On()
{
	// Turn on the display...
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0xfd, 0x0b); // Point to Function (Control) Register
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x0a, 0b00000001); // Shutdown Register -> Power On ("Normal Operation")
	// if (outputLogs) console.log("Breakout Gardener -> IS31FL3731 (W) -> Turning on the display.");
}
function Off()
{
	// Turn off the display...
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0xfd, 0x0b); // Point to Function (Control) Register
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0x0a, 0b00000000); // Shutdown Register -> Power Off ("Shutdown Mode")
	// if (outputLogs) console.log("Breakout Gardener -> IS31FL3731 (W) -> Turning off the display.");
}
function Clear()
{
	// Clear all pixels...
	// (nb. for ease-of-use we do this by *dimming* them all to zero, *not* by turning them all off)
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0xfd, 0x00); // Point to Picture Frame 1 Register
	for (n = 0x24; n<=0xb3; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, n, 0x00); // (1) Dim all LEDs (R+G+B) to zero
	for (n = 0x00; n<=0x11; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, n, 0xff); // (2) Turn on all LEDs (R+G+B)
	displayBuffer.fill(0x00); // Clear the display buffer as well...
	// if (showDebug) console.log("Breakout Gardener -> IS31FL3731 (W) -> Clearing the display...");
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

function ApplyGamma(intensity) { return DEFAULT_GAMMA_TABLE[intensity]; } // Display() helper function

const PIXEL_ADDRESS_LOOKUP_TABLE = [
	6,22,38,54,70,86,14,30,46,62,78,
	5,21,37,53,69,85,13,29,45,61,77,
	4,20,36,52,68,84,12,28,44,60,76,
	3,19,35,51,67,83,11,27,43,59,75,
	2,18,34,50,66,82,10,26,42,58,74,
	1,17,33,49,65,81,9, 25,41,57,73,
	0,16,32,48,64,80,8, 24,40,56,72 ];

function GetAddressForPixel(pixel) { return PIXEL_ADDRESS_LOOKUP_TABLE[pixel]; } // Display() helper function

function SetPixel(x, y, intensity) // Display() helper function
{
	if (x >= DISPLAY_WIDTH || y >= DISPLAY_HEIGHT) return;

	var pixel = (y*DISPLAY_WIDTH) + x;
	displayBuffer[pixel] = intensity; // Copy the pixel to our display buffer for possible later use (e.g. Get())

	address = 0x24 + GetAddressForPixel(pixel);
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, address, ApplyGamma(intensity));
}

function Display(input)
{
	var fillDisplay = false;

	if (!Array.isArray(input)) fillDisplay = true;
	else if (input.length != (DISPLAY_WIDTH*DISPLAY_HEIGHT)) return;

	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0xfd, 0x00); // Point to Picture Frame 1 Register
	// for (n = 0x00; n<=0x11; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, n, 0b11111111); // Debug: Turn on all LEDs...

	for (var y=0; y<DISPLAY_HEIGHT; y++)
	{
		for (var x=0; x<DISPLAY_WIDTH; x++)
		{
			var offset = (y*DISPLAY_WIDTH) + x;
			if (fillDisplay) SetPixel(x, y, input); // Fill display with a single input LED intensity
			else SetPixel(x, y, input[offset]);	// Draw a picture from the input LED intensity pixel array
		}
	}

	// if (showDebug && !fillDisplay) console.log("Breakout Gardener -> IS31FL3731 (W) -> Drawing picture...");
}

// ====================

function Get() { return displayBuffer; }

// ====================

function Log() { return; }

// ================================================================================
// ====================== TEXT DRAWING RELATED FUNCTIONALITY ======================
// ================================================================================

// 6x7 pixel characters... (per column bitmaps)
const charA = [0b00111111, 0b01001000, 0b01001000, 0b01001000, 0b00111111, 0b00000000];
const charB = [0b01111111, 0b01001001, 0b01001001, 0b01001001, 0b00110110, 0b00000000];
const charC = [0b00111110, 0b01000001, 0b01000001, 0b01000001, 0b00100010, 0b00000000];
const charD = [0b01111111, 0b01000001, 0b01000001, 0b01000001, 0b00111110, 0b00000000];
const charE = [0b01111111, 0b01001001, 0b01001001, 0b01001001, 0b01001001, 0b00000000];
const charF = [0b01111111, 0b01001000, 0b01001000, 0b01001000, 0b01001000, 0b00000000];
const charG = [0b00111110, 0b01000001, 0b01001001, 0b01001001, 0b00101110, 0b00000000];
const charH = [0b01111111, 0b00001000, 0b00001000, 0b00001000, 0b01111111, 0b00000000];
const charL = [0b01111111, 0b00000001, 0b00000001, 0b00000001, 0b00000001, 0b00000000];
const charM = [0b01111111, 0b00100000, 0b00010000, 0b00100000, 0b01111111, 0b00000000];
const charN = [0b01111111, 0b00010000, 0b00001000, 0b00000100, 0b01111111, 0b00000000];
const charR = [0b01111111, 0b01001000, 0b01001000, 0b01001000, 0b00110111, 0b00000000];
const charS = [0b00110010, 0b01001001, 0b01001001, 0b01001001, 0b00100110, 0b00000000];
const charU = [0b01111110, 0b00000001, 0b00000001, 0b00000001, 0b01111110, 0b00000000];
const charV = [0b01110000, 0b00001110, 0b00000001, 0b00001110, 0b01110000, 0b00000000];
const charW = [0b01111111, 0b00000010, 0b00000100, 0b00000010, 0b01111111, 0b00000000];
const charX = [0b01100011, 0b00010100, 0b00001000, 0b00010100, 0b01100011, 0b00000000];
const charY = [0b01100000, 0b00010000, 0b00001111, 0b00010000, 0b01100000, 0b00000000];

const char2 = [0b00100111, 0b01001001, 0b01001001, 0b01001001, 0b00110001, 0b00000000];
const char3 = [0b00100010, 0b01001001, 0b01001001, 0b01001001, 0b00110110, 0b00000000];
const char4 = [0b01111000, 0b00001000, 0b00001000, 0b00001000, 0b01111111, 0b00000000];
const char5 = [0b01111010, 0b01001001, 0b01001001, 0b01001001, 0b01000110, 0b00000000];
const char6 = [0b00011110, 0b00101001, 0b01001001, 0b01001001, 0b00000110, 0b00000000];
const char7 = [0b01000000, 0b01000000, 0b01001111, 0b01010000, 0b01100000, 0b00000000];
const char8 = [0b00110110, 0b01001001, 0b01001001, 0b01001001, 0b00110110, 0b00000000];
const char9 = [0b00110000, 0b01001000, 0b01001001, 0b01001010, 0b00111100, 0b00000000];
const char0 = [0b00111110, 0b01000001, 0b01000001, 0b01000001, 0b00111110, 0b00000000]; // Default human-like "0" without diagonal slash (and hence similar to "O" on a low res display, but not an issue for us, so far at least...)
//const char0 = [0b00111110, 0b01000101, 0b01001001, 0b01010001, 0b00111110, 0b00000000]; // Alternative computer-like "0" with diagonal slash (just in case it will be needed - comment out as appropriate!)

const charPercentage = [0b01100010, 0b01100100, 0b00001000, 0b00010011, 0b00100011, 0b00000000];
const charHash = [0b00010100, 0b00111110, 0b00010100, 0b00111110, 0b00010100, 0b00000000];

// 5x7 pixel characters...
const charSpace = [0b00000000, 0b00000000, 0b00000000, 0b00000000, 0b00000000];

// 3x7 pixel characters...
const char1 = [0b00100000, 0b01111111, 0b00000000];

// ====================

function DrawChar(character, xoffset)
{
	I2C_BUS.writeByteSync(I2C_ADDRESS_IS31FL3731_WHITE, 0xfd, 0x00); // Point to Picture Frame 1 Register

	var charToDraw = charA;
	switch (character)
	{
		case 'A': { charToDraw = charA; break; }
		case 'B': { charToDraw = charB; break; }
		case 'C': { charToDraw = charC; break; }
		case 'D': { charToDraw = charD; break; }
		case 'E': { charToDraw = charE; break; }
		case 'F': { charToDraw = charF; break; }
		case 'G': { charToDraw = charG; break; }
		case 'H': { charToDraw = charH; break; }
		case 'L': { charToDraw = charL; break; }
		case 'M': { charToDraw = charM; break; }
		case 'N': { charToDraw = charN; break; }
		case 'R': { charToDraw = charR; break; }
		case 'S': { charToDraw = charS; break; }
		case 'U': { charToDraw = charU; break; }
		case 'V': { charToDraw = charV; break; }
		case 'W': { charToDraw = charW; break; }
		case 'X': { charToDraw = charX; break; }
		case 'Y': { charToDraw = charY; break; }
		case '1': { charToDraw = char1; break; }
		case '2': { charToDraw = char2; break; }
		case '3': { charToDraw = char3; break; }
		case '4': { charToDraw = char4; break; }
		case '5': { charToDraw = char5; break; }
		case '6': { charToDraw = char6; break; }
		case '7': { charToDraw = char7; break; }
		case '8': { charToDraw = char8; break; }
		case '9': { charToDraw = char9; break; }
		case '0': { charToDraw = char0; break; }
		case '%': { charToDraw = charPercentage; break; }
		case '#': { charToDraw = charHash; break; }
		default: { charToDraw = charSpace; break; }
	}

	var columnsToDraw = charToDraw.length;
	for (var x=0; x<6; x++)
	{
		if (x < columnsToDraw)
		{
			if (charToDraw[x] & 0b01000000) SetPixel(x+xoffset, 0, defaultIntensity);
			else SetPixel(x+xoffset, 0, 0);
			if (charToDraw[x] & 0b00100000) SetPixel(x+xoffset, 1, defaultIntensity);
			else SetPixel(x+xoffset, 1, 0);
			if (charToDraw[x] & 0b00010000) SetPixel(x+xoffset, 2, defaultIntensity);
			else SetPixel(x+xoffset, 2, 0);
			if (charToDraw[x] & 0b00001000) SetPixel(x+xoffset, 3, defaultIntensity);
			else SetPixel(x+xoffset, 3, 0);
			if (charToDraw[x] & 0b00000100) SetPixel(x+xoffset, 4, defaultIntensity);
			else SetPixel(x+xoffset, 4, 0);
			if (charToDraw[x] & 0b00000010) SetPixel(x+xoffset, 5, defaultIntensity);
			else SetPixel(x+xoffset, 5, 0);
			if (charToDraw[x] & 0b00000001) SetPixel(x+xoffset, 6, defaultIntensity);
			else SetPixel(x+xoffset, 6, 0);
		}
		else
		{
			for (var y=0; y<7; y++) SetPixel(x+xoffset, y, 0);
		}
	}
}

function DrawString(string)
{
	if (string.length < 1) return;

	if (string.length == 1) // -> String contains only one character...
	{
		DrawChar(" ", 0);
		if (string[0] == '1') DrawChar(string[0], 4);
		else DrawChar(string[0], 3);
		DrawChar(" ", 9);
	}
	else // -> String contains at least 2 characters...
	{
		DrawChar(string[0], 0);
		DrawChar(string[1], 6);
	}
}

function DrawMeter(percentage, yoffset)
{
	if (percentage > 100) for (var x=0; x<11; x++) SetPixel(x, yoffset, 0); // Clear display row
	else // Draw meter
	{
		if (percentage < 90) SetPixel(10, yoffset, 0);
		else SetPixel(10, yoffset, 50);
		if (percentage < 81) SetPixel(9, yoffset, 0);
		else SetPixel(9, yoffset, 50);
		if (percentage < 72) SetPixel(8, yoffset, 0);
		else SetPixel(8, yoffset, 50);
		if (percentage < 63) SetPixel(7, yoffset, 0);
		else SetPixel(7, yoffset, 50);
		if (percentage < 54) SetPixel(6, yoffset, 0);
		else SetPixel(6, yoffset, 50);
		if (percentage < 45) SetPixel(5, yoffset, 0);
		else SetPixel(5, yoffset, 50);
		if (percentage < 36) SetPixel(4, yoffset, 0);
		else SetPixel(4, yoffset, 50);
		if (percentage < 27) SetPixel(3, yoffset, 0);
		else SetPixel(3, yoffset, 50);
		if (percentage < 18) SetPixel(2, yoffset, 0);
		else SetPixel(2, yoffset, 50);
		if (percentage < 9) SetPixel(1, yoffset, 0);
		else SetPixel(1, yoffset, 50);
		if (percentage < 5) SetPixel(0, yoffset, 35);
		else SetPixel(0, yoffset, 50);
	}
}

// ================================================================================

function Log()
{
}

// ================================================================================
