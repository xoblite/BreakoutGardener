// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: ADXL343 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');

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
// === Analog Devices ADXL343 Triple-Axis Accelerometer ===
// * Product Page -> https://www.analog.com/en/products/adxl343.html
// * Datasheet -> https://www.analog.com/media/en/technical-documentation/data-sheets/ADXL343.pdf
// * Adafruit Learn -> https://learn.adafruit.com/adxl343-breakout-learning-guide/
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_ADXL343 = 0;
var adxl343DisplayRaw = false;
var data = [0.0,0.0,0.0, 0.0,0.0,0.0, 0.0, 0.0, 0];
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_ADXL343 > 0) return false;

	// Identify using the device ID (0xe5) of the ADXL343 device...
	var deviceID = bus.readByteSync(address, 0x00);
	if (deviceID == 0xe5)
	{
		I2C_BUS = bus;
		I2C_ADDRESS_ADXL343 = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_ADXL343) return true;
	else return false;
}

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	// Configure the device...
	I2C_BUS.writeByteSync(I2C_ADDRESS_ADXL343, 0x2d, 0b00001011);
	I2C_BUS.writeByteSync(I2C_ADDRESS_ADXL343, 0x31, 0b00001000);

	I2C_BUS.writeByteSync(I2C_ADDRESS_ADXL343, 0x1d, 1); // Tap threshold
	I2C_BUS.writeByteSync(I2C_ADDRESS_ADXL343, 0x21, 50); // Tap duration (625 μs/LSB)
	I2C_BUS.writeByteSync(I2C_ADDRESS_ADXL343, 0x22, 200); // Tap latency (1.25 ms/LSB) -> 200*1.25 = 250 msec
	I2C_BUS.writeByteSync(I2C_ADDRESS_ADXL343, 0x23, 200); // Tap window (1.25 ms/LSB)
	I2C_BUS.writeByteSync(I2C_ADDRESS_ADXL343, 0x2a, 0b00000001); // Tap axes
	I2C_BUS.writeByteSync(I2C_ADDRESS_ADXL343, 0x2e, 0b01100100); // Enable single tap, double tap and free fall interrupts
}

function Stop() { return; }

// ====================

function Get()
{
	// Read accelerometer data... (nb. the directions of the X/Y/Z axes are helpfully printed on the Adafruit breakout's circuit board)
	var readBuffer = Buffer.alloc(6, 0x00);
	var bytesRead = I2C_BUS.readI2cBlockSync(I2C_ADDRESS_ADXL343, 0x32, 6, readBuffer);

	var rawAX = 0, rawAY = 0, rawAZ = 0;
	rawAX = readBuffer.readInt16LE(0);
	rawAY = readBuffer.readInt16LE(2);
	rawAZ = readBuffer.readInt16LE(4);	

	// Adjust the accelerometer data readings to the
	// configured acceleration full scale of ±2 g ...
	var adjAX = (rawAX * 2.0) / 512;
	var adjAY = (rawAY * 2.0) / 512;
	var adjAZ = (rawAZ * 2.0) / 512;

//	var adjAX = rawAX;
//	var adjAY = rawAY;
//	var adjAZ = rawAZ;

	// ====================

	// Calculate roll and pitch... But first, some background courtesy of Wikipedia:

	// From https://en.wikipedia.org/wiki/Ship_motions :
	// "* The vertical/Z axis, or yaw axis, is an imaginary line running
	// vertically through the ship and through its centre of gravity.
	// A yaw motion is a side-to side movement of the bow and stern of the ship.
	// * The transverse/Y axis, lateral axis, or pitch axis is an imaginary line running
	// horizontally across the ship and through the centre of gravity.
	// A pitch motion is an up-or-down movement of the bow and stern of the ship.
	// * The longitudinal/X axis, or roll axis, is an imaginary line running horizontally through
	// the length of the ship, through its centre of gravity, and parallel to the waterline.
	// A roll motion is a side-to-side or port-starboard tilting motion of the superstructure around this axis."

	// From https://en.wikipedia.org/wiki/Aircraft_principal_axes :
	// "The roll axis (or longitudinal axis) has its origin at the center of gravity and is
	// directed forward, parallel to the fuselage reference line. Motion about this axis is
	// called roll. A positive rolling motion lifts the left wing and lowers the right wing."
	// "The pitch axis (also called transverse or lateral axis) has its origin at the
	// center of gravity and is directed to the right, parallel to a line drawn from
	// wingtip to wingtip. Motion about this axis is called pitch. A positive pitching
	// motion raises the nose of the aircraft and lowers the tail."
	// "The yaw axis has its origin at the center of gravity and is directed towards the
	// bottom of the aircraft, perpendicular to the wings and to the fuselage reference line.
	// Motion about this axis is called yaw. A positive yawing motion moves the nose of
	// the aircraft to the right."

	// From https://en.wikipedia.org/wiki/Six_degrees_of_freedom :
	// "Rotational envelopes :
	// * Tilting side to side on the X-axis. (Roll)
	// * Tilting forward and backward on the Y-axis. (Pitch)
	// * Turning left and right on the Z-axis. (Yaw)"
/*
	var pitchRadians = Math.atan2(adjAX, Math.sqrt(adjAY*adjAY + adjAZ*adjAZ));
	var pitchDegrees = pitchRadians * 180 / Math.PI;
	var rollRadians = Math.atan2(adjAY, adjAZ);
	var rollDegrees = rollRadians * 180 / Math.PI;
*/
	var rollDegrees = 180 * Math.atan(adjAY / Math.sqrt(adjAX*adjAX + adjAZ*adjAZ)) / Math.PI;
	var pitchDegrees = 180 * Math.atan(adjAX / Math.sqrt(adjAY*adjAY + adjAZ*adjAZ)) / Math.PI;

	// ====================

	// Read the tap interrupts register...
	var tapsDetected = 0;
	var taps = I2C_BUS.readByteSync(I2C_ADDRESS_ADXL343, 0x30);

	if (taps & 0b00000100) // Free fall detected!
	{
		tapsDetected = 3;
		if (outputLogs) console.log("Breakout Gardener -> ADXL343 -> \x1b[30;107m Free fall \x1b[0m detected!");
	}
	else if (taps & 0b00100000) // Double tap detected!
	{
		tapsDetected = 2;
		if (outputLogs) console.log("Breakout Gardener -> ADXL343 -> \x1b[30;107m Double tap \x1b[0m detected!");
	}
	else if (taps & 0b01000000) // Single tap detected!
	{
		tapsDetected = 1;
		if (outputLogs) console.log("Breakout Gardener -> ADXL343 -> \x1b[30;107m Single tap \x1b[0m detected!");
	}

	// ====================

	// if (showDebug) Log();

	data = [rawAX, rawAY, rawAZ, adjAX, adjAY, adjAZ, rollDegrees, pitchDegrees, tapsDetected];
    return data;
}

// ====================

function Log()
{
    if (outputLogs)
    {
        console.log("Breakout Gardener -> ADXL343 -> Accelerometer -> X %d / Y %d / Z %d.", data[0], data[1], data[2]);
        console.log("Breakout Gardener -> ADXL343 -> Roll \x1b[97;45m %d \x1b[0m / Pitch \x1b[97;45m %d \x1b[0m.", data[6].toFixed(0), data[7].toFixed(0));
    }
}

// ====================

function Display(refreshAll)
{
	Get();

	if (SH1107.IsAvailable())
	{
		var tempString = '';

		if (refreshAll)
		{
			SH1107.Off();
			SH1107.Clear();
			SH1107.DrawTextSmall('ACCELEROMETER:', 4, 0, false);
			SH1107.DrawSeparatorLine(4);
			SH1107.DrawTextSmall('TAPS:', 4, 5, false);
			SH1107.DrawTextSmall('ROLL:', 4, 7, false);
			SH1107.DrawTextSmall('PITCH:', 4, 10, false);
			SH1107.DrawTextSmall("ADXL343", 39, 16, false);
		}

		if (adxl343DisplayRaw)
		{
			// Display raw accelerometer data...
			tempString = data[0] + ' ' + data[1] + ' ' + data[2]; // rawAX, rawAY, rawAZ
/*
			// NOTE: LEFT OUT DUE TO RISK OF LINE OVERFLOW
			// (THERE IS ROOM FOR MAXIMUM 16 SMALL SIZE CHARS PER ROW)
			if (rawAX >= 0) tempString += '+';
			tempString += rawAX + ' ';
			if (rawAY >= 0) tempString += '+';
			tempString += rawAY + ' ';
			if (rawAZ >= 0) tempString += '+';
			tempString += rawAZ;
*/
		}
		else
		{
			// Display accelerometer values in g... (adjusted to scale)
			tempString = '';
			if (data[3] >= 0) tempString += '+'; // adjAX
			tempString += data[3].toFixed(2) + ' ';
			if (data[4] >= 0) tempString += '+'; // adjAY
			tempString += data[4].toFixed(2) + ' ';
			if (data[5] >= 0) tempString += '+'; // adjAZ
			tempString += data[5].toFixed(2);
		}
		SH1107.DrawTextSmall(tempString, 4, 2, true);

		// Display any detected single/double taps...
		if (data[8] == 1) SH1107.DrawTextSmall("SINGLE", 64, 5, true);
		else if (data[8] == 2) SH1107.DrawTextSmall("DOUBLE", 64, 5, true);
		else if (data[8] == 3) SH1107.DrawTextSmall("FALLING", 64, 5, true);
		else SH1107.DrawTextSmall("---", 64, 5, true);

		// Display roll in degrees...
		tempString = '';
		if (data[6] >= 0) tempString += '+';
		tempString += data[6].toFixed(0) + '*';
		SH1107.DrawTextMedium(tempString, 64, 7, true);

		// Display pitch in degrees...
		tempString = '';
		if (data[7] >= 0) tempString += '+';
		tempString += data[7].toFixed(0) + '*';
		SH1107.DrawTextMedium(tempString, 64, 10, true);

		if (refreshAll) SH1107.On();
	}

	// ====================

	if (IS31FL3731_RGB.IsAvailable())
	{
		// Let's draw a simplified attitude indicator! (see e.g. https://en.wikipedia.org/wiki/Attitude_indicator )

		const img = [0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					 0x000000, 0x000000, 0x000000, 0x000000, 0x000000 ];

		// Add a simple roll indicator... (vertical bar)
		if (data[6] > 45) img[4] = img[9] = img[14] = img[19] = img[24] = 0x0000ff; // -> More than 45 degrees is visually emphasized
		else if (data[6] > 22) img[3] = img[8] = img[13] = img[18] = img[23] = 0x000044;
		else if (data[6] < -45) img[0] = img[5] = img[10] = img[15] = img[20] = 0x0000ff; // -> More than 45 degrees is visually emphasized
		else if (data[6] < -22) img[1] = img[6] = img[11] = img[16] = img[21] = 0x000044;
		else img[2] = img[7] = img[12] = img[17] = img[22] = 0x000044;

		// Add a simple pitch indicator... (horizontal bar)
		if (data[7] > 45) img[20] = img[21] = img[22] = img[23] = img[24] = 0x0000ff; // -> More than 45 degrees is visually emphasized
		else if (data[7] > 22) img[15] = img[16] = img[17] = img[18] = img[19] = 0x000044;
		else if (data[7] < -45) img[0] = img[1] = img[2] = img[3] = img[4] = 0x0000ff; // -> More than 45 degrees is visually emphasized
		else if (data[7] < -22) img[5] = img[6] = img[7] = img[8] = img[9] = 0x000044;
		else img[10] = img[11] = img[12] = img[13] = img[14] = 0x000044;

		// Fix any overlap between pitch and roll if the angle is in the visually emphasized range (i.e. more than ±45 degrees of roll)
		if (data[6] > 45) img[4] = img[9] = img[14] = img[19] = img[24] = 0x0000ff;
		if (data[6] < -45) img[0] = img[5] = img[10] = img[15] = img[20] = 0x0000ff;

		// Any taps or free fall detected? If so, light up the center pixel in green!
		if (data [8] > 0) img[12] = 0x00ff00;

		IS31FL3731_RGB.Display(img);
	}

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
		// Let's draw a simplified attitude indicator! (see e.g. https://en.wikipedia.org/wiki/Attitude_indicator )

		const img = [ 0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0 ];

		// Add a simple roll indicator... (vertical bar)
		if (data[6] > 45) img[10] = img[21] = img[32] = img[43] = img[54] = img[65] = img[76] = 90; // -> More than 45 degrees is visually emphasized
		else if (data[6] > 36) img[9] = img[20] = img[31] = img[42] = img[53] = img[64] = img[75] = 30;
		else if (data[6] > 27) img[8] = img[19] = img[30] = img[41] = img[52] = img[63] = img[74] = 30;
		else if (data[6] > 18) img[7] = img[18] = img[29] = img[40] = img[51] = img[62] = img[73] = 30;
		else if (data[6] > 9) img[6] = img[17] = img[28] = img[39] = img[50] = img[61] = img[72] = 30;
		else if (data[6] < -45) img[0] = img[11] = img[22] = img[33] = img[44] = img[55] = img[66] = 90; // -> More than 45 degrees is visually emphasized
		else if (data[6] < -36) img[1] = img[12] = img[23] = img[34] = img[45] = img[56] = img[67] = 30;
		else if (data[6] < -27) img[2] = img[13] = img[24] = img[35] = img[46] = img[57] = img[68] = 30;
		else if (data[6] < -18) img[3] = img[14] = img[25] = img[36] = img[47] = img[58] = img[69] = 30;
		else if (data[6] < -9) img[4] = img[15] = img[26] = img[37] = img[48] = img[59] = img[70] = 30;
		else img[5] = img[16] = img[27] = img[38] = img[49] = img[60] = img[71] = 30;

		// Add a simple pitch indicator... (horizontal bar)
		if (data[7] > 45) for (var i=66; i<77; i++) img[i] = 90; // -> More than 45 degrees is visually emphasized
		else if (data[7] > 30) for (var i=55; i<66; i++) img[i] = 30;
		else if (data[7] > 15) for (var i=44; i<55; i++) img[i] = 30;
		else if (data[7] < -45) for (var i=0; i<11; i++) img[i] = 90; // -> More than 45 degrees is visually emphasized
		else if (data[7] < -30) for (var i=11; i<22; i++) img[i] = 30;
		else if (data[7] < -15) for (var i=22; i<33; i++) img[i] = 30;
		else for (var i=33; i<=43; i++) img[i] = 30;

		// Fix any overlap between pitch and roll if the angle is in the visually emphasized range (i.e. more than ±45 degrees of roll)
		if (data[6] > 45) img[10] = img[21] = img[32] = img[43] = img[54] = img[65] = img[76] = 90;
		if (data[6] < -45) img[0] = img[11] = img[22] = img[33] = img[44] = img[55] = img[66] = 90;

		// Any taps or free fall detected? If so, light up the center pixel in bright white!
		if (data [8] > 0) img[38] = 180;

		IS31FL3731_WHITE.Display(img);
	}

	// ====================

	if (refreshAll) Log();
}

// ================================================================================
