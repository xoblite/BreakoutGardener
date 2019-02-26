// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: SH1107 ---
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
	// -----------
	Update: Update,
	Clear: Clear,
	DisplaySetPosition: DisplaySetPosition,
	DisplaySetRow: DisplaySetRow,
	DisplaySetColumn: DisplaySetColumn,
	DrawTextSmall: DrawTextSmall,
	DrawTextMedium: DrawTextMedium,
    DrawBlock: DrawBlock,
	DrawNumberLarge: DrawNumberLarge,
	DrawSeparatorLine: DrawSeparatorLine,
	DrawMeterBar: DrawMeterBar
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === Display Future / Sino Wealth SH1107 128x128 Dot Matrix OLED Driver/Controller ===
// * Product Page -> https://shop.pimoroni.com/products/1-12-oled-breakout
// * Datasheet -> https://www.displayfuture.com/Display/datasheet/controller/SH1107.pdf
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_SH1107 = 0;
const displayContrast = 0x80; // Default display contrast per the SH1107 datasheet
const invertDisplay = false;
const flipHorizontal = false;
const flipVertical = false;
var roundedLargeChars = true;
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_SH1107 > 0) return false;

    // Identify using the information ID (0x07) of the SH1107 device...
    var deviceID = (bus.readByteSync(address, 0x00) & 0xf);
    if (deviceID == 0x07)
	{
		I2C_BUS = bus;
		I2C_ADDRESS_SH1107 = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_SH1107) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	// Initialize the display... (nb. typical settings for the
	// SH1107 OLED display used by the Pimoroni OLED Breakout)

	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xae); // Turn display off
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xd5); // Set display clock divider
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x50); // ...value (default divide ratio, default oscillator frequency)
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xa8); // Set multiplex ratio
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xff); // ...value (default multiplex ratio)

	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x20); // Set memory mode

	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x00); // Set low column (LS4B i.e. lower 4 bits)
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x10); // ...value
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x40); // ...value
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x10); // Set high column (MS4B i.e. upper 4 bits)
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xb0); // ...value
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xc8); // ...value

	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xda); // Set com pins
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x12); // ...value
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xdb); // Set com detect
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x20); // ...value

	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x8d); // Set charge pump
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x14); // ...value
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xd9); // Set pre-charge
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x22); // ...value

	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xd3); // Set display offset to zero (i.e. no display offset)
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x00); // ...value

	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x81); // // Set display contrast
	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, displayContrast); // ...value

	if (flipHorizontal) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xc8); // Flipped vertical ("Set Common Output Scan Direction")
	else I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xc0); // Non-flipped vertical

	if (flipVertical) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xa1); // Rotated display ("Set Segment Remap" enabled)
	else I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xa0); // Non-rotated display ("Set Segment Remap" disabled)

	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xa4); // ...? ("normal display")

	if (invertDisplay) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xa7); // Inverted display (i.e. black on white)
	else I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xa6); // Non-inverted display (i.e. white on black)

	I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0x2e); // No scrolling
}

function Stop() { Off(); }

// ====================

// Turn on or off the display (off typically during an update or to save power)
function On() { I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xaf); }
function Off() { I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xae); }

// ================================================================================
// ===================== DISPLAY RELATED HELPER FUNCTIONALITY =====================
// ================================================================================

// Create a display buffer with room for 16 rows of 128 bytes each
// (cf. OLED pages/columns layout) -> 128x128 pixels (white/black bitmap)
var displayBuffer = Buffer.alloc(2048, 0x00);

function Update(pattern, row)
{
    var n = 0;
    if (pattern != undefined) var patternBuffer = Buffer.alloc(32, pattern);

    var height = 16;
    if (row > 0) height = row; // Operate on a single row? (note: 1-16, to be user friendly)

    for (var y = (row-1); y < height; y++)
	{
        DisplaySetPosition(0, y);

        if (pattern === undefined)
        {
            // Copy the contents of the display buffer to the physical display... (maximum speed -> 32 bytes at a time)
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, displayBuffer[n]);
            n += 32;
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, displayBuffer[n]);
            n += 32;
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, displayBuffer[n]);
            n += 32;
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, displayBuffer[n]);
            n += 32;
        }
        else
        {
            // Fill the physical display with a uniform pattern, e.g. to clear it... (maximum speed -> 32 bytes at a time)yy
            // (i.e. pass 0x00 to function -> "zero memory" of display RAM)
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, patternBuffer);
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, patternBuffer);
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, patternBuffer);
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, patternBuffer);
        }
	}
}

function Clear() { Update(0x00, 0); } // Clear the display by zeroing its memory

// ====================

function DisplaySetRow(yoffset)
{
    I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, 0xb0+yoffset);
}

function DisplaySetColumn(xoffset)
{
    var high4bits = 0x10 + ((xoffset & 0xf0) >> 4);
    var low4bits = (xoffset & 0x0f);
    I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, low4bits);
    I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x00, high4bits);
}

function DisplaySetPosition(xoffset, yoffset)
{
    DisplaySetRow(yoffset);
    DisplaySetColumn(xoffset);
}

// ================================================================================
// ================= BLOCK GRAPHICS DRAWING RELATED FUNCTIONALITY =================
// ================================================================================

function DrawBlock(block)
{
    if (block == "1") // Regular all filled square block (8x8 pixels)
    {
        block = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "2") // Diagonal top-left block /|
    {
        if (roundedLargeChars) block = [0x00, 0xc0, 0xf0, 0xf8, 0xfc, 0xfc, 0xfe, 0xfe];
        else block = [0x80, 0xc0, 0xe0, 0xf0, 0xf8, 0xfc, 0xfe, 0xff];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "3") // Diagonal top-right block |\
    {
        if (roundedLargeChars) block = [0xfe, 0xfe, 0xfc, 0xfc, 0xf8, 0xf0, 0xc0, 0x00];
        // else block = [0xff, 0xff, 0xff, 0xff, 0xfe, 0xfc, 0xf8, 0xf0];
        else block = [0xff, 0xfe, 0xfc, 0xf8, 0xf0, 0xe0, 0xc0, 0x80];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "4") // Diagonal bottom-right block |/
    {
        if (roundedLargeChars) block = [0x7f, 0x7f, 0x3f, 0x3f, 0x1f, 0x0f, 0x03, 0x00];
        else block = [0xff, 0x7f, 0x3f, 0x1f, 0x0f, 0x07, 0x03, 0x01];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "5") // Diagonal bottom-left block \|
    {
        if (roundedLargeChars) block = [0x00, 0x03, 0x0f, 0x1f, 0x3f, 0x3f, 0x7f, 0x7f];
        else block = [0x01, 0x03, 0x07, 0x0f, 0x1f, 0x3f, 0x7f, 0xff];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (roundedLargeChars && block == "6") // Inner corner top-left
    {
        block = [0x0f, 0x03, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (roundedLargeChars && block == "7") // Inner corner top-right
    {
        block = [0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x03, 0x0f];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (roundedLargeChars && block == "8") // Inner corner bottom-right
    {
        block = [0x00, 0x00, 0x00, 0x00, 0x80, 0x80, 0xc0, 0xf0];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (roundedLargeChars && block == "9") // Inner corner bottom-left
    {
        block = [0xf0, 0xc0, 0x80, 0x80, 0x00, 0x00, 0x00, 0x00];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "(") // Endpoint left block
    {
        // block = [0x18, 0x3c, 0x7e, 0xff, 0xff, 0xff, 0xff, 0xff];
        block = [0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == ")") // Endpoint right block
    {
        // block = [0xff, 0xff, 0xff, 0xff, 0xff, 0x7e, 0x3c, 0x18];
        block = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "/") // Slash character ("/")
    {
        block = [0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "<") // < block
    {
        if (roundedLargeChars) block = [0xff, 0xff, 0xff, 0xff, 0xff, 0xe7, 0xc3, 0x00];
        else block = [0xff, 0xff, 0xff, 0xff, 0xe7, 0xc3, 0x81, 0x00];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == ">") // > block
    {
        if (roundedLargeChars) block = [0x00, 0xc3, 0xe7, 0xff, 0xff, 0xff, 0xff, 0xff];
        else block = [0x00, 0x81, 0xc3, 0xe7, 0xff, 0xff, 0xff, 0xff];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "#") // Filled "grey" block
    {
        block = [0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "a") // Rounded top-left "grey" block /| on white background
    {
        block = [0xaf, 0x57, 0xab, 0x55, 0xaa, 0x55, 0xaa, 0x55];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "b") // Rounded top-right "grey" block |\ on white background
    {
        block = [0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55, 0xab, 0x57];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "c") // Rounded bottom-right "grey" block |/ on white background
    {
        block = [0xaa, 0x55, 0xaa, 0x55, 0xaa, 0xd5, 0xea, 0xf5];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else if (block == "d") // Rounded bottom-left "grey" block \| on white background
    {
        block = [0xea, 0xd5, 0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
    else // Background == No fill
    {
        block = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
    }
}

function DrawBlocksForNumber(arguments, digit, vertical)
{
    var height = arguments.length / 8;
    var n = 0;
    var block = [];
	for (var y = 0; y < height; y++)
	{
        if (vertical == 1) DisplaySetRow(y); // Top
        else if (vertical == 3) DisplaySetRow(9+y); // Bottom
        else DisplaySetRow(4+y); // Center

        if (digit == 10) DisplaySetColumn(0); // 0x00
        else if (digit == 0) DisplaySetColumn(34); // 0x22
        else DisplaySetColumn(68); // 0x44, digit == 1

        // ====================

        if (digit == 10 || digit == 0)
        {
            // Add 4 extra pixels of padding to the left of the character(s)...
            block = [0x00, 0x00, 0x00, 0x00];
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
        }

		for (var x = 0; x < 7; x++)
		{
            if (arguments[n] == " ") n++;
            DrawBlock(arguments[n]);
			n++;
        }
	}
}

// ================================================================================

// ====== Pre-defined 7x7 pixel LARGE characters for numbers 0-9 =======
const zero    = "2111113 1600071 1000001 1000001 1000001 1900081 5111114";
//const one   = "0000011 0000001 0000001 0000001 0000001 0000001 0000001"; // Right aligned
const one     = "0011000 0001000 0001000 0001000 0001000 0001000 0001000"; // Center aligned
const two     = "(111113 0000071 0000081 2111114 1600000 1000000 1111111";
const three   = "1111113 0000071 0000081 011111< 0000071 0000081 1111114";
const four    = "1000001 1000001 1000001 1111111 0000001 0000001 0000001";
const five    = "1111111 1000000 1000000 1111113 0000071 0000081 (111114";
const six     = "211111) 1600000 1000000 1111113 1000071 1900081 5111114";
const seven   = "1111113 0000071 0000001 0000001 0000001 0000001 0000001";
const eight   = "2111113 1600071 1900081 >11111< 1600071 1900081 5111114";
const nine    = "2111113 1600071 1900001 5111111 0000001 0000081 (111114";

function DrawNumberLarge(number, digit, vertical)
{
    switch (number)
    {
        case 1: DrawBlocksForNumber(one, digit, vertical); break;
        case 2: DrawBlocksForNumber(two, digit, vertical); break;
        case 3: DrawBlocksForNumber(three, digit, vertical); break;
        case 4: DrawBlocksForNumber(four, digit, vertical); break;
        case 5: DrawBlocksForNumber(five, digit, vertical); break;
        case 6: DrawBlocksForNumber(six, digit, vertical); break;
        case 7: DrawBlocksForNumber(seven, digit, vertical); break;
        case 8: DrawBlocksForNumber(eight, digit, vertical); break;
        case 9: DrawBlocksForNumber(nine, digit, vertical); break;
        case 0: DrawBlocksForNumber(zero, digit, vertical); break;

        default: DrawBlocksForNumber(zero, digit, vertical); break; // Just in case... ;)
    }
}

// ================================================================================
// ================= OTHER GRAPHICS DRAWING RELATED FUNCTIONALITY =================
// ================================================================================

const separatorPadding = Buffer.from([0x00, 0x00, 0x00, 0x00]);
const separatorUpper = Buffer.from([0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00]);
const separatorLower = Buffer.from([0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01]);

function DrawSeparatorLine(row)
{
    var yoffset = 0;
    if (row == undefined) yoffset = 8;
    else yoffset = row;

    DisplaySetPosition(0, yoffset-1); // Upper half...
    I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 4, separatorPadding); // 4 pixels left padding
    for (var n=0; n<4; n++) I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, separatorUpper.length, separatorUpper); // 4x30 = 120 pixels separator line
    I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 4, separatorPadding); // 4 pixels right padding

    DisplaySetPosition(0, yoffset); // Lower half...
    I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 4, separatorPadding); // 4 pixels left padding
    for (var n=0; n<4; n++) I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, separatorLower.length, separatorLower); // 4x30 = 120 pixels separator line
    I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 4, separatorPadding); // 4 pixels right padding
}

// ====================

function DrawMeterBar(percentage, vertical)
{
    var meterLevel = percentage + 2; // Meter level 0-100% plus 2 pixels "always visible" -> Max 102 pixels wide

    var yoffset = 0x7;
    switch (vertical)
    {
        case 1: { yoffset = 0x1; break; }
        case 2: { yoffset = 0x4; break; }
        case 3: { yoffset = 0x7; break; }
        case 4: { yoffset = 0xa; break; }
    }

    DisplaySetPosition(0, yoffset); // Top half...
    for (var n=0; n<13; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x00); // Left padding -> (128-102)/2 = 13 pixels
    for (var n=0; n<102; n++) // 2+100 = 102 pixels meter bar
    {
        if (n < meterLevel)
        {
            if (n & 1) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0xaa);
            else I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x55);
        }
        else I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x00);
    }
    for (var n=0; n<13; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x00); // Right padding -> (128-102)/2 = 13 pixels

    DisplaySetPosition(0, yoffset+1); // Bottom half...
    for (var n=0; n<13; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x00);
    for (var n=0; n<102; n++)
    {
        if (n < meterLevel)
        {
            if (n & 1) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x2a);
            else I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x15);
        }
        else
        {
            if (n & 2) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x20);
            else I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x00);
        }
    }
    for (var n=0; n<13; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x00);
}

// ================================================================================
// ====================== TEXT DRAWING RELATED FUNCTIONALITY ======================
// ================================================================================

// 8x8 pixel characters...
const charA = [0xfc, 0x12, 0x12, 0x12, 0x12, 0x12, 0xfc, 0x00];
const charB = [0xfe, 0x92, 0x92, 0x92, 0x92, 0x92, 0x6c, 0x00];
const charC = [0x7c, 0x82, 0x82, 0x82, 0x82, 0x82, 0x82, 0x00];
const charD = [0xfe, 0x82, 0x82, 0x82, 0x82, 0x82, 0x7c, 0x00];
const charE = [0xfe, 0x92, 0x92, 0x92, 0x92, 0x92, 0x92, 0x00];
const charF = [0xfe, 0x12, 0x12, 0x12, 0x12, 0x12, 0x12, 0x00];
const charG = [0x7c, 0x82, 0x82, 0x82, 0x92, 0x92, 0x74, 0x00];
const charH = [0xfe, 0x10, 0x10, 0x10, 0x10, 0x10, 0xfe, 0x00];
const charJ = [0x40, 0x80, 0x80, 0x80, 0x80, 0x80, 0x7e, 0x00];
const charK = [0xfe, 0x10, 0x10, 0x10, 0x28, 0x44, 0x82, 0x00];
const charL = [0xfe, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x00];
const charM = [0xfe, 0x04, 0x08, 0x10, 0x08, 0x04, 0xfe, 0x00];
const charN = [0xfe, 0x04, 0x08, 0x10, 0x20, 0x40, 0xfe, 0x00];
const charO = [0x7c, 0x82, 0x82, 0x82, 0x82, 0x82, 0x7c, 0x00];
const charP = [0xfe, 0x12, 0x12, 0x12, 0x12, 0x12, 0x0c, 0x00];
const charQ = [0x7c, 0x82, 0x82, 0x82, 0xa2, 0x42, 0xbc, 0x00];
const charR = [0xfe, 0x12, 0x12, 0x12, 0x12, 0x12, 0xec, 0x00];
const charS = [0x4c, 0x92, 0x92, 0x92, 0x92, 0x92, 0x64, 0x00];
const charT = [0x02, 0x02, 0x02, 0xfe, 0x02, 0x02, 0x02, 0x00];
const charU = [0x7e, 0x80, 0x80, 0x80, 0x80, 0x80, 0x7e, 0x00];
const charV = [0x1e, 0x20, 0x40, 0x80, 0x40, 0x20, 0x1e, 0x00];
const charW = [0xfe, 0x40, 0x20, 0x10, 0x20, 0x40, 0xfe, 0x00];
const charX = [0x82, 0x44, 0x28, 0x10, 0x28, 0x44, 0x82, 0x00];
const charY = [0x02, 0x04, 0x08, 0xf0, 0x08, 0x04, 0x02, 0x00];
const charZ = [0x82, 0xc2, 0xa2, 0x92, 0x8a, 0x86, 0x82, 0x00];

const char2 = [0xe4, 0x92, 0x92, 0x92, 0x92, 0x92, 0x8c, 0x00];
const char3 = [0x44, 0x82, 0x82, 0x92, 0x92, 0x92, 0x6c, 0x00];
const char4 = [0x1e, 0x10, 0x10, 0x10, 0x10, 0x10, 0xfe, 0x00];
const char5 = [0x4e, 0x92, 0x92, 0x92, 0x92, 0x92, 0x62, 0x00];
const char6 = [0x70, 0x98, 0x94, 0x92, 0x92, 0x90, 0x60, 0x00];
const char7 = [0x02, 0x02, 0x02, 0xe2, 0x12, 0x0a, 0x06, 0x00];
const char8 = [0x6c, 0x92, 0x92, 0x92, 0x92, 0x92, 0x6c, 0x00];
const char9 = [0x0c, 0x12, 0x92, 0x92, 0x52, 0x32, 0x1c, 0x00];
const char0 = [0x7c, 0x82, 0x82, 0x82, 0x82, 0x82, 0x7c, 0x00];

const charPercentage = [0x86, 0x46, 0x20, 0x10, 0x08, 0xc4, 0xc2, 0x00];
const charSlash = [0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x00];
const charTilde = [0x08, 0x04, 0x04, 0x08, 0x10, 0x10, 0x08, 0x00];

// 7x8 pixel characters...
const charMinus = [0x10, 0x10, 0x10, 0x10, 0x10, 0x00, 0x00];
const charPlus = [0x10, 0x10, 0x7c, 0x10, 0x10, 0x00, 0x00];

// 4x8 pixel characters...
//const charDegrees = [0x03, 0x03, 0x00, 0x00];
const charDegrees = [0x04, 0x0a, 0x04, 0x00];
const charPeriod = [0x00, 0xc0, 0xc0, 0x00];
const charColon = [0x00, 0x66, 0x66, 0x00];
const charSpace = [0x00, 0x00, 0x00, 0x00];

// 3x8 pixel characters...
const char1 = [0x02, 0xfe, 0x00];
const charParenBeg = [0x7c, 0x82, 0x00];
const charParenEnd = [0x82, 0x7c, 0x00];

// 2x8 pixel characters...
const charI = [0xfe, 0x00];

var invert = 0xff; // When inverted text -> Draw black letters on white background -> Character data XOR 0xff

// ====================

function DrawCharSmall(character)
{
    const charBuffer = Buffer.from(character, 0);
    if (invert === 0xff) for (var n = 0; n < charBuffer.length; n++) charBuffer[n] ^= invert;
    I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, charBuffer.length, charBuffer);
    return charBuffer.length;
}

// ====================

function ParseTextSmall(character)
{
    switch (character)
    {
        case 'A': { return DrawCharSmall(charA); break; }
        case 'B': { return DrawCharSmall(charB); break; }
        case 'C': { return DrawCharSmall(charC); break; }
        case 'D': { return DrawCharSmall(charD); break; }
        case 'E': { return DrawCharSmall(charE); break; }
        case 'F': { return DrawCharSmall(charF); break; }
        case 'G': { return DrawCharSmall(charG); break; }
        case 'H': { return DrawCharSmall(charH); break; }
        case 'I': { return DrawCharSmall(charI); break; }
        case 'J': { return DrawCharSmall(charJ); break; }
        case 'K': { return DrawCharSmall(charK); break; }
        case 'L': { return DrawCharSmall(charL); break; }
        case 'M': { return DrawCharSmall(charM); break; }
        case 'N': { return DrawCharSmall(charN); break; }
        case 'O': { return DrawCharSmall(charO); break; }
        case 'P': { return DrawCharSmall(charP); break; }
        case 'Q': { return DrawCharSmall(charQ); break; }
        case 'R': { return DrawCharSmall(charR); break; }
        case 'S': { return DrawCharSmall(charS); break; }
        case 'T': { return DrawCharSmall(charT); break; }
        case 'U': { return DrawCharSmall(charU); break; }
        case 'V': { return DrawCharSmall(charV); break; }
        case 'W': { return DrawCharSmall(charW); break; }
        case 'X': { return DrawCharSmall(charX); break; }
        case 'Y': { return DrawCharSmall(charY); break; }
        case 'Z': { return DrawCharSmall(charZ); break; }
        case '1': { return DrawCharSmall(char1); break; }
        case '2': { return DrawCharSmall(char2); break; }
        case '3': { return DrawCharSmall(char3); break; }
        case '4': { return DrawCharSmall(char4); break; }
        case '5': { return DrawCharSmall(char5); break; }
        case '6': { return DrawCharSmall(char6); break; }
        case '7': { return DrawCharSmall(char7); break; }
        case '8': { return DrawCharSmall(char8); break; }
        case '9': { return DrawCharSmall(char9); break; }
        case '0': { return DrawCharSmall(char0); break; }
        case '*': { return DrawCharSmall(charDegrees); break; }
        case '.': { return DrawCharSmall(charPeriod); break; }
        case ':': { return DrawCharSmall(charColon); break; }
        case '%': { return DrawCharSmall(charPercentage); break; }
        case '(': { return DrawCharSmall(charParenBeg); break; }
        case ')': { return DrawCharSmall(charParenEnd); break; }
        case '-': { return DrawCharSmall(charMinus); break; }
        case '+': { return DrawCharSmall(charPlus); break; }
        case '/': { return DrawCharSmall(charSlash); break; }
        case '~': { return DrawCharSmall(charTilde); break; }
        default: { return DrawCharSmall(charSpace); break; }
    }    
}

// ====================

function DrawTextSmall(arguments, xoffset, yoffset, eraseToTheRight)
{
    if (xoffset > 127) return;

    if (yoffset == 16) // Special: Draw "inverted" black text on a white background banner at the bottom the the display (always last 3 rows)
    {
        // Draw a white background banner across the full display width... (128 pixels)
        DisplaySetPosition(0, 13);
        var bannerBuffer = Buffer.alloc(32, 0xe0);
        for (var n = 0; n < 4; n++) I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, bannerBuffer);
        DisplaySetPosition(0, 14);
        bannerBuffer.fill(0xff);
        for (var n = 0; n < 4; n++) I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, bannerBuffer);
        DisplaySetPosition(0, 15);
        bannerBuffer.fill(0x0f);
        for (var n = 0; n < 4; n++) I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, 32, bannerBuffer);
     
        invert = 0xff;
        DisplaySetPosition(xoffset, 14);
    }
    else if (yoffset >= 0 && yoffset <= 15) // Standard: Draw "regular" white text on black background (any row)
    {
        invert = 0x00;
        DisplaySetPosition(xoffset, yoffset);
    }
    else return;

    // Draw the text...
    var remaining = 128 - xoffset;
    for (var n = 0; n < arguments.length; n++)
    {
        if (remaining < 8) break; // No more room... (nb. small character bitmaps are up to 8 pixels wide)
        remaining -= ParseTextSmall(arguments[n]);
    }

    // ...and erase the remaining x columns on the row to eliminate any zombie text remnants... ;)
    if (eraseToTheRight && (remaining > 0))
    {
        var block = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        while (remaining > 8)
        {
            I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
            remaining -= 8;
        }
        for (var n=0; n<remaining; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x00);
    }
}

// ================================================================================

function DrawCharMedium(character, upperHalf)
{
    for (var n = 0; n < character.length; n++)
    {
        var medium = 0x00;
        if (upperHalf) // Upper 4 pixels of the small sized character -> Upper 8 pixels of the medium sized character
        {
            if (character[n] & 0x01) medium += 0x03;
            if (character[n] & 0x02) medium += 0x0c;
            if (character[n] & 0x04) medium += 0x30;
            if (character[n] & 0x08) medium += 0xc0;
        }
        else // Lower 4 pixels of the small sized character -> Lower 8 pixels of the medium sized character
        {
            if (character[n] & 0x10) medium += 0x03;
            if (character[n] & 0x20) medium += 0x0c;
            if (character[n] & 0x40) medium += 0x30;
            if (character[n] & 0x80) medium += 0xc0;
        }
        I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, medium^invert);
        if (character != charSpace) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, medium^invert);
    }

    return (character.length * 2);
}

// ====================

function ParseTextMedium(character, half)
{
    switch (character)
    {
        case 'A': { return DrawCharMedium(charA, half); break; }
        case 'B': { return DrawCharMedium(charB, half); break; }
        case 'C': { return DrawCharMedium(charC, half); break; }
        case 'D': { return DrawCharMedium(charD, half); break; }
        case 'E': { return DrawCharMedium(charE, half); break; }
        case 'F': { return DrawCharMedium(charF, half); break; }
        case 'G': { return DrawCharMedium(charG, half); break; }
        case 'H': { return DrawCharMedium(charH, half); break; }
        case 'I': { return DrawCharMedium(charI, half); break; }
        case 'J': { return DrawCharMedium(charJ, half); break; }
        case 'K': { return DrawCharMedium(charK, half); break; }
        case 'L': { return DrawCharMedium(charL, half); break; }
        case 'M': { return DrawCharMedium(charM, half); break; }
        case 'N': { return DrawCharMedium(charN, half); break; }
        case 'O': { return DrawCharMedium(charO, half); break; }
        case 'P': { return DrawCharMedium(charP, half); break; }
        case 'Q': { return DrawCharMedium(charQ, half); break; }
        case 'R': { return DrawCharMedium(charR, half); break; }
        case 'S': { return DrawCharMedium(charS, half); break; }
        case 'T': { return DrawCharMedium(charT, half); break; }
        case 'U': { return DrawCharMedium(charU, half); break; }
        case 'V': { return DrawCharMedium(charV, half); break; }
        case 'W': { return DrawCharMedium(charW, half); break; }
        case 'X': { return DrawCharMedium(charX, half); break; }
        case 'Y': { return DrawCharMedium(charY, half); break; }
        case 'Z': { return DrawCharMedium(charZ, half); break; }
        case '1': { return DrawCharMedium(char1, half); break; }
        case '2': { return DrawCharMedium(char2, half); break; }
        case '3': { return DrawCharMedium(char3, half); break; }
        case '4': { return DrawCharMedium(char4, half); break; }
        case '5': { return DrawCharMedium(char5, half); break; }
        case '6': { return DrawCharMedium(char6, half); break; }
        case '7': { return DrawCharMedium(char7, half); break; }
        case '8': { return DrawCharMedium(char8, half); break; }
        case '9': { return DrawCharMedium(char9, half); break; }
        case '0': { return DrawCharMedium(char0, half); break; }
        case '*': { return DrawCharMedium(charDegrees, half); break; }
        case '.': { return DrawCharMedium(charPeriod, half); break; }
        case ':': { return DrawCharMedium(charColon, half); break; }
        case '%': { return DrawCharMedium(charPercentage, half); break; }
        case '(': { return DrawCharMedium(charParenBeg, half); break; }
        case ')': { return DrawCharMedium(charParenEnd, half); break; }
        case '-': { return DrawCharMedium(charMinus, half); break; }
        case '+': { return DrawCharMedium(charPlus, half); break; }
        case '/': { return DrawCharMedium(charSlash, half); break; }
        case '~': { return DrawCharMedium(charTilde, half); break; }
        default: { return DrawCharMedium(charSpace, half); break; }
    }
}

// ====================

function DrawTextMedium(arguments, xoffset, yoffset, eraseToTheRight)
{
    invert = 0x00; // Medium sized characters are always white text on black background

    for (var half=0; half<=1; half++)
    {
        if (half == 0) DisplaySetPosition(xoffset, yoffset); // Draw upper half (8 pixels high)
        else DisplaySetPosition(xoffset, yoffset+1); // Draw lower half (8 pixels high)

        var remaining = 128 - xoffset;
        for (var n = 0; n < arguments.length; n++)
        {
            if (remaining < 16) break; // No more room... (nb. medium character bitmaps are up to 16 pixels wide)
            remaining -= ParseTextMedium(arguments[n], (half==0));
        }
    
        // ...and erase the remaining x columns on the row to eliminate any zombie text remnants... ;)
        if (eraseToTheRight && (remaining > 0))
        {
            var block = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
            while (remaining > 8)
            {
                I2C_BUS.writeI2cBlockSync(I2C_ADDRESS_SH1107, 0x40, block.length, Buffer.from(block, 0, block.length));
                remaining -= 8;
            }
            for (var n=0; n<remaining; n++) I2C_BUS.writeByteSync(I2C_ADDRESS_SH1107, 0x40, 0x00);
        }    
    }
}

// ================================================================================
