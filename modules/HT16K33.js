// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: HT16K33 ---
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
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === Holtek HT16K33 LED controller driver chip ===
// * Product Page -> https://www.holtek.com/productdetail/-/vg/HT16K33
// * Datasheet -> https://www.holtek.com/documents/10179/116711/HT16K33v120.pdf
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_HT16K33 = 0;
var currentlyDisplayed = '';
var pulseInterval = null, pulseLevel = 0xe0;
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_HT16K33 > 0) return false;

	// Note: There doesn't seem to be a way to identify the
	// HT16K33 device unfortunately [?], so here we go...
	I2C_BUS = bus;
	I2C_ADDRESS_HT16K33 = address;
	return true;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_HT16K33) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	Off();

    // Configure the device...
    I2C_BUS.sendByteSync(I2C_ADDRESS_HT16K33, 0xa0); // Set to ROW driver output (default)
    I2C_BUS.sendByteSync(I2C_ADDRESS_HT16K33, 0x00); // Set display RAM data address pointer (default)

	Clear();
	On();
}

function Stop()
{
    clearInterval(pulseInterval);
    Off();
}

// ====================

function On()
{
	// Turn on the display...
    I2C_BUS.sendByteSync(I2C_ADDRESS_HT16K33, 0x21); // System setup -> Turn on system oscillator (normal operation mode)
    I2C_BUS.sendByteSync(I2C_ADDRESS_HT16K33, 0x81); // Display setup -> Turn on display + blinking off
	// if (outputLogs) console.log("Breakout Gardener -> HT16K33 -> Turning on the display.");
}
function Off()
{
	// Turn off the display...
    I2C_BUS.sendByteSync(I2C_ADDRESS_HT16K33, 0x80); // Display setup -> Turn off display
    I2C_BUS.sendByteSync(I2C_ADDRESS_HT16K33, 0x20); // System setup -> Turn off system oscillator (standby mode)
	// if (outputLogs) console.log("Breakout Gardener -> HT16K33 -> Turning off the display.");
}
function Clear()
{
	// Clear all pixels...
	var buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_HT16K33, 0x00, buffer.length, buffer);
    currentlyDisplayed = '';
	// if (showDebug) console.log("Breakout Gardener -> HT16K33 -> Clearing the display...");
}

// ================================================================================

function Pulse() // Display() helper function
{
    pulseLevel++;
    if (pulseLevel < 0xef) I2C_BUS.sendByteSync(I2C_ADDRESS_HT16K33, pulseLevel); // Increase display brightness... (in 16 steps, cf. values 0xe0-0xef -> 1/16 to 16/16 duty pulse width)
    else clearInterval(pulseInterval);
}

const char0 = [0x3f, 0x0c];
const char1 = [0x06, 0x04];
const char2 = [0xdb, 0x00];
const char3 = [0xcf, 0x00];
const char4 = [0xe6, 0x00];
const char5 = [0xed, 0x00];
const char6 = [0xfd, 0x00];
const char7 = [0x07, 0x00];
const char8 = [0xff, 0x00];
const char9 = [0xef, 0x00];

const charA = [0xf7, 0x00];
const charB = [0x8f, 0x12];
const charC = [0x39, 0x00];
const charD = [0x0f, 0x12];
const charE = [0xf9, 0x00];
const charF = [0xf1, 0x00];
const charG = [0xbd, 0x00];
const charH = [0xf6, 0x00];
const charI = [0x09, 0x12];
const charJ = [0x1e, 0x00];
const charK = [0x70, 0x24];
const charL = [0x38, 0x00];
const charM = [0x36, 0x05];
const charN = [0x36, 0x21];
const charO = [0x3f, 0x00];
const charP = [0xf3, 0x00];
const charQ = [0x3f, 0x20];
const charR = [0xf3, 0x20];
const charS = [0x8d, 0x01];
const charT = [0x01, 0x12];
const charU = [0x3e, 0x00];
const charV = [0x30, 0x0c];
const charW = [0x36, 0x28];
const charX = [0x00, 0x2d];
const charY = [0x00, 0x15];
const charZ = [0x09, 0x0c];

const charPlus = [0xc0, 0x12];
const charMinus = [0xc0, 0x00];
const charMoreThan = [0x00, 0x09];
const charLessThan = [0x00, 0x24];
const charPercent = [0x24, 0x0c];
const charSpace = [0x00, 0x00];
const charAsterisk = [0xc0, 0x3f];
const charHash = [0xff, 0x3f];
const charPipe = [0x00, 0x12];
const charSlash = [0x00, 0x0c];
const charBackslash = [0x00, 0x21];

// ====================

function Display(input)
{
    clearInterval(pulseInterval);
    I2C_BUS.sendByteSync(I2C_ADDRESS_HT16K33, 0xe0); // Set the display brightness to the lowest setting... (preparing for a new message to be displayed)

    var displayBuffer = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

    if (input.length == 0)
    {
        // if (showDebug) console.log("Breakout Gardener -> HT16K33 -> No input provided, displaying default message... (\"*BG*\")");
        currentlyDisplayed = '*BG*';
        displayBuffer = [0xc0, 0x3f, 0x8f, 0x12, 0xbd, 0x00, 0xc0, 0x3f]; // Display *BG*
    }
    else
    {
        // if (showDebug) console.log("Breakout Gardener -> HT16K33 -> Displaying \"%s\"...", input);
        currentlyDisplayed = '';

        var ptr = 0;
        for (var n=0; n<input.length; n++)
        {
            if (ptr >= 8) break; // Allow maximum 4 characters (for now at least, scrolling may come later...)

            currentlyDisplayed += input[n]; // Keep track of what's being displayed... (might later also be shown in the Dashboard)

            if (input[n] == '.') continue; // Note: Decimal points are handled along with the preceding character (see below)

            var charToDraw = charSpace;
            switch (input[n])
            {
                case '0': { charToDraw = char0; break; }
                case '1': { charToDraw = char1; break; }
                case '2': { charToDraw = char2; break; }
                case '3': { charToDraw = char3; break; }
                case '4': { charToDraw = char4; break; }
                case '5': { charToDraw = char5; break; }
                case '6': { charToDraw = char6; break; }
                case '7': { charToDraw = char7; break; }
                case '8': { charToDraw = char8; break; }
                case '9': { charToDraw = char9; break; }

                case 'A': { charToDraw = charA; break; }
                case 'B': { charToDraw = charB; break; }
                case 'C': { charToDraw = charC; break; }
                case 'D': { charToDraw = charD; break; }
                case 'E': { charToDraw = charE; break; }
                case 'F': { charToDraw = charF; break; }
                case 'G': { charToDraw = charG; break; }
                case 'H': { charToDraw = charH; break; }
                case 'I': { charToDraw = charI; break; }
                case 'J': { charToDraw = charJ; break; }
                case 'K': { charToDraw = charK; break; }
                case 'L': { charToDraw = charL; break; }
                case 'M': { charToDraw = charM; break; }
                case 'N': { charToDraw = charN; break; }
                case 'O': { charToDraw = charO; break; }
                case 'P': { charToDraw = charP; break; }
                case 'Q': { charToDraw = charQ; break; }
                case 'R': { charToDraw = charR; break; }
                case 'S': { charToDraw = charS; break; }
                case 'T': { charToDraw = charT; break; }
                case 'U': { charToDraw = charU; break; }
                case 'V': { charToDraw = charV; break; }
                case 'W': { charToDraw = charW; break; }
                case 'X': { charToDraw = charX; break; }
                case 'Y': { charToDraw = charY; break; }
                case 'Z': { charToDraw = charZ; break; }

                case '+': { charToDraw = charPlus; break; }
                case '-': { charToDraw = charMinus; break; }
                case '>': { charToDraw = charMoreThan; break; }
                case '<': { charToDraw = charLessThan; break; }
                case '%': { charToDraw = charPercent; break; }
                case '*': { charToDraw = charAsterisk; break; }
                case '#': { charToDraw = charHash; break; }
                case '|': { charToDraw = charPipe; break; }
                case '/': { charToDraw = charSlash; break; }
                case '\\': { charToDraw = charBackslash; break; }
                
                default: { charToDraw = charSpace; break; }
            }

            displayBuffer[ptr] = charToDraw[0];
            displayBuffer[ptr+1] = charToDraw[1];

            if (input[n+1] == '.') displayBuffer[ptr+1] |= 0xc0; // Add decimal point?

            ptr += 2;
        }
    }

    // Update the display...
    var buffer = Buffer.from(displayBuffer);
    I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_HT16K33, 0x00, buffer.length, buffer);

    // ...and gradually increase ("pulse") the display brightness up to the maximum!
    pulseLevel = 0xe0;
    pulseInterval = setInterval(Pulse, 100);

    // if (showDebug && !fillDisplay) console.log("Breakout Gardener -> HT16K33 -> Displaying message...");
}

// ====================

function Get() { return currentlyDisplayed; }

// ====================

function Log() { return; }

// ================================================================================
