// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: LSM303D ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');
const HT16K33 = require('./HT16K33.js');

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
// === STMicroelectronics LSM303D eCompass 3D Accelerometer and 3D Magnetometer ===
// * Product Page -> Discontinued (i.e. replaced by newer versions/products)
// * Datasheet -> http://www.farnell.com/datasheets/1841032.pdf
// ----------------------------------------------------------------------------------------

var I2C_BUS = 0, I2C_ADDRESS_LSM303D = 0;
var lsm303dHeadingCalibration = 0;
var lsm303dDisplayRaw = false;
var lsm303dRotateXY = true;
var XisZ = false, YisZ = false;
var data = [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0];
var outputLogs = false, showDebug = false;

// ====================

function Identify(bus, address)
{
	if (I2C_ADDRESS_LSM303D > 0) return false;

	// Identify using the product ID (0x49) of the LSM303D device...
	// (by the way, note that the device on the Pimoroni Enviro pHAT is the older (today obsolete) *LSM303D* specifically,
	// and that later LSM303* variants from STMicroelectronics may differ significantly in terms of I2C addressing etc.)
	var deviceID = bus.readByteSync(address, 0x0f);
	if (deviceID == 0x49)
	{
		I2C_BUS = bus;
		I2C_ADDRESS_LSM303D = address;
		return true;
	}
	else return false;
}

// ====================

function IsAvailable()
{
	if (I2C_ADDRESS_LSM303D) return true;
	else return false;
}

// ====================

function Start(calibration, raw, logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;

	lsm303dHeadingCalibration = calibration;
	lsm303dDisplayRaw = raw;

	// Configure the device...
	I2C_BUS.writeByteSync(I2C_ADDRESS_LSM303D, 0x1f, 0b00000000); // CTRL0: Default settings (disable FIFO and high-pass filters)
	I2C_BUS.writeByteSync(I2C_ADDRESS_LSM303D, 0x20, 0b00100111); // CTRL1: Accelerator set to normal mode @ 6.25 Hz, continuous data update, all axes X/Y/Z enabled
	I2C_BUS.writeByteSync(I2C_ADDRESS_LSM303D, 0x21, 0b00000000); // CTRL2: Default settings (acceleration full scale ±2 g, anti-alias filter bandwidth 773 Hz)
	I2C_BUS.writeByteSync(I2C_ADDRESS_LSM303D, 0x22, 0b00000000); // CTRL3: Default settings (disable interrupts etc)
	I2C_BUS.writeByteSync(I2C_ADDRESS_LSM303D, 0x23, 0b00000000); // CTRL4: Default settings (disable interrupts etc)
	I2C_BUS.writeByteSync(I2C_ADDRESS_LSM303D, 0x24, 0b01100100); // CTRL5: Magnetometer set to high resolution mode @ 6.25 Hz, temperature sensor disabled
	I2C_BUS.writeByteSync(I2C_ADDRESS_LSM303D, 0x25, 0b00100000); // CTRL6: Default settings (magnetic full scale ±4 gauss)
	I2C_BUS.writeByteSync(I2C_ADDRESS_LSM303D, 0x26, 0b00000000); // CTRL7: Magnetometer set to continuous conversion mode

	// ====================

	// Try to auto-detect the device orientation by looking for the likely Z-axis (-> the one best aligned
	// with gravity [==1g] i.e. closest to a raw (65536/2)*(1g/2g) = 16384 for our chosen full scale of ±2 g),
	// assuming we're starting our device on an otherwise reasonably flat surface...
	// # DISCLAIMER: THIS IS LARGELY UNTESTED AS I ONLY HAVE A FLAT MOUNTED ENVIRO PHAT TO PLAY WITH... ;) #
	var readBuffer = Buffer.alloc(6, 0x00);
	var bytesRead = I2C_BUS.readI2cBlockSync(I2C_ADDRESS_LSM303D, 0x28|0x80, 6, readBuffer); // |0x80 -> Read multiple bytes
	var rawAX = readBuffer.readInt16LE(0);
	var rawAY = readBuffer.readInt16LE(2);
	var rawAZ = readBuffer.readInt16LE(4);

	if (rawAZ > 12000) return; // Z is Z
	else if (rawAX > 12000) XisZ = true; // X is Z
	else if (rawAY > 12000) YisZ = true; // Y is Z
	// else console.log("Breakout Gardener -> \x1b[31mERROR\x1b[0m -> Could not detect LSM3030D device orientation automatically.");
}

function Stop() { return; }

// ====================

function Get()
{
	// Read accelerometer data...
	var readBuffer = Buffer.alloc(6, 0x00);
	var bytesRead = I2C_BUS.readI2cBlockSync(I2C_ADDRESS_LSM303D, 0x28|0x80, 6, readBuffer); // |0x80 -> Read multiple bytes
	var rawAX = 0, rawAY = 0, rawAZ = 0;
/*
	if (XisZ) // X is Z
	{
		rawAZ = readBuffer.readInt16LE(0); // Sensor X -> Actual Z
		rawAY = readBuffer.readInt16LE(2); // Sensor Y -> Actual 
		rawAX = readBuffer.readInt16LE(4); // Sensor Z -> Actual 
	}
	else if (YisZ) // Y is Z
	{
		rawAZ = readBuffer.readInt16LE(2); // Sensor Y -> Actual Z
		rawAX = readBuffer.readInt16LE(0); // Sensor X -> Actual 
		rawAY = readBuffer.readInt16LE(4); // Sensor Z -> Actual 
	}
	else // Z is Z
*/
	{
		if (lsm303dRotateXY)
		{
			rawAX = readBuffer.readInt16LE(2);
			rawAY = readBuffer.readInt16LE(0);
		}
		else
		{
			rawAX = readBuffer.readInt16LE(0);
			rawAY = readBuffer.readInt16LE(2);
		}
		rawAZ = readBuffer.readInt16LE(4);	
	}

	// Adjust the accelerometer data readings to the
	// configured acceleration full scale of ±2 g ...
	var adjAX = (rawAX * 2.0) / 32768;
	var adjAY = (rawAY * 2.0) / 32768;
	var adjAZ = (rawAZ * 2.0) / 32768;

	// ====================

	// Read magnetometer data...
	var readBuffer = Buffer.alloc(6, 0x00);
	var bytesRead = I2C_BUS.readI2cBlockSync(I2C_ADDRESS_LSM303D, 0x08|0x80, 6, readBuffer); // |0x80 -> Read multiple bytes
	var rawMX = 0, rawMY = 0, rawMZ = 0;

	// SEE ABOVE, TO BE ADDED...
/*
	if (XisZ) // X is Z
	{
	}
	else if (YisZ) // Y is Z
	{
	}
	else // Z is Z
*/
	{
		if (lsm303dRotateXY)
		{
			rawMX = readBuffer.readInt16LE(2);
			rawMY = readBuffer.readInt16LE(0);
		}
		else
		{
			rawMX = readBuffer.readInt16LE(0);
			rawMY = readBuffer.readInt16LE(2);
		}
		var rawMZ = readBuffer.readInt16LE(4);
	}

	// Adjust the magnetometer data readings to the
	// configured magnetic full scale of ±4 gauss ...
	var adjMX = (rawMX * 4.0) / 32768;
	var adjMY = (rawMY * 4.0) / 32768;
	var adjMZ = (rawMZ * 4.0) / 32768;

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
	// * Turning left and right on the Z-axis. (Yaw)" [...and in turn then also Heading.]

	// However, from our perspective as per how the Enviro pHAT and its LSM303D device as well
	// as how any supporting (p)HATs (e.g. Breakout Garden OLED display) are typically mounted,
	// the X-axis should then be considered perpendicular and the Y-axis parallel to the pHAT's
	// longer side and the printed "Enviro pHAT" text, and then...
	// * Roll -> Rotation around the device X-axis (R=±180°, effectively though ±90°)
	// * Pitch -> Rotation around the device Y-axis (P=±180°, effectively though ±90°)
	// * Heading -> Rotation around the device Z-axis [parallel to the gravity] (0>=H<360°)

//        var rollRadians = Math.atan2(adjAY, Math.sqrt(adjAX*adjAX + adjAZ*adjAZ));
//        var signAccZ = 1.0;
//        if (adjAZ < 0) signAccZ = -1.0;
//        var pitchRadians = Math.atan2(adjAX, (signAccZ * Math.sqrt(adjAY*adjAY + adjAZ*adjAZ)));
	var pitchRadians = Math.atan2(adjAX, Math.sqrt(adjAY*adjAY + adjAZ*adjAZ));
	var pitchDegrees = pitchRadians * 180 / Math.PI;
	var rollRadians = Math.atan2(adjAY, adjAZ);
	var rollDegrees = rollRadians * 180 / Math.PI;




var pitchDegrees = 180 * Math.atan(adjAX / Math.sqrt(adjAY*adjAY + adjAZ*adjAZ)) / Math.PI;
var rollDegrees = 180 * Math.atan(adjAY / Math.sqrt(adjAX*adjAX + adjAZ*adjAZ)) / Math.PI;

//var pitchDegrees = Math.atan2(-adjAX, Math.sqrt(adjAY*adjAY + adjAZ*adjAZ)) * 180 / Math.PI;
//var rollDegrees = Math.atan2(adjAY, adjAZ) * 180 / Math.PI;


/*
	var R = Math.atan2(-adjAY, -adjAZ);  // positive roll is left wing up
	var P = Math.atan2(+adjAX, Math.sqrt(adjAY*adjAY + adjAZ*adjAZ));  // positive pitch is nose up
	var H = Math.atan2(-adjMY*Math.cos(R) + adjMZ*Math.sin(R), adjMX*Math.cos(P) + adjMY*Math.sin(P)*Math.sin(R) + adjMZ*Math.sin(P)*Math.cos(R));  // positive heading is nose right
	R *= 180/Math.PI;
	P *= 180/Math.PI;
	H *= 180/Math.PI;

//        H -= 180;
	if (H < 0) H += 360;
	if (H > 360) H -= 360;
*/
	
	// ====================

	// Calculate *raw* heading... (-> non tilt compensated)
	var headingDegrees = ((Math.atan2(rawMX, rawMY) * 180) / Math.PI) + 90;

	//        if (radians < 0) radians += (2*Math.PI);
//        else if (radians > (2*Math.PI)) radians -= (2*Math.PI);
//        var degrees = radians * 180 / Math.PI;

	// Calculate *true* heading (-> tilt compensated), assuming the [assumed] Z axis is
	// parallel to the gravity... (math credit: Adafruit's "9DOF" Python library)
	// Heading -> Rotation around the Z-axis (±180°)
	var cosRoll = Math.cos(rollRadians);
	var sinRoll = Math.sin(rollRadians);
	var cosPitch = Math.cos(-1*pitchRadians);
	var sinPitch = Math.sin(-1*pitchRadians);
//        var compMagX = (rawMX * cosPitch) + (rawMZ * sinPitch);
//        var compMagY = (rawMX * sinRoll * sinPitch) + (rawMY * cosRoll) - (rawMZ * sinRoll * cosPitch);
//        var compMagZ = (rawMX * cosRoll * sinPitch) + (rawMY * sinRoll) + (rawMZ * cosRoll * cosPitch);
//        headingDegrees = Math.atan2(compMagY, compMagX) * 180 / Math.PI;

//        headingDegrees = Math.atan2((rawMZ * sinRoll - rawMY * cosRoll), (rawMX * cosPitch + rawMY * sinPitch * sinRoll + rawMZ * sinPitch * cosRoll)) * 180 / Math.PI;





	// Apply any compass heading calibration... (see the top of this file)
	headingDegrees += lsm303dHeadingCalibration;
	// ...and adjust output to 360 degrees full scale...
	if (headingDegrees < 0) headingDegrees += 360;
	else if (headingDegrees >= 360) headingDegrees -= 360;

	// ====================

	data = [rawAX, rawAY, rawAZ, adjAX, adjAY, adjAZ, rawMX, rawMY, rawMZ, adjMX, adjMY, adjMZ, rollDegrees, pitchDegrees, headingDegrees];
    return data;
}

// ====================

function Log()
{
    if (outputLogs)
    {
        console.log("Breakout Gardener -> LSM303D -> Accelerometer -> X %d / Y %d / Z %d.", data[0], data[1], data[2]);
        console.log("Breakout Gardener -> LSM303D -> Magnetometer -> X %d / Y %d / Z %d.", data[6], data[7], data[8]);
        console.log("Breakout Gardener -> LSM303D -> Combined -> Roll \x1b[97;45m %d \x1b[0m / Pitch \x1b[97;45m %d \x1b[0m / Heading \x1b[97;45m %d° \x1b[0m.", data[12].toFixed(0), data[13].toFixed(0), data[14].toFixed(0));
    }
}

// ====================

function Display(refreshAll)
{
	Get();

	// ====================

	if (SH1107.IsAvailable())
	{
		var tempString = '';

		if (refreshAll)
		{
			SH1107.Off();
			SH1107.Clear();
			SH1107.DrawTextSmall('ACCELEROMETER:', 4, 0, false);
			SH1107.DrawTextSmall('MAGNETOMETER:', 4, 4, false);
			SH1107.DrawTextSmall('HEADING:', 4, 8, false);
			SH1107.DrawTextSmall("LSM303D", 37, 16, false);
		}

		if (lsm303dDisplayRaw)
		{
			// Display raw accelerometer data
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
			// Display accelerometer values in g (adjusted to scale)
			tempString = '';
			if (data[3] >= 0) tempString += '+'; // adjAX
			tempString += data[3].toFixed(2) + ' ';
			if (data[4] >= 0) tempString += '+'; // adjAY
			tempString += data[4].toFixed(2) + ' ';
			if (data[5] >= 0) tempString += '+'; // adjAZ
			tempString += data[5].toFixed(2);
		}
		SH1107.DrawTextSmall(tempString, 4, 2, true);

		if (lsm303dDisplayRaw)
		{
			// Display raw magnetometer data
			tempString = data[6] + ' ' + data[7] + ' ' + data[8]; // rawMX, rawMY, rawMZ
/*
			// NOTE: LEFT OUT DUE TO RISK OF LINE OVERFLOW
			// (THERE IS ROOM FOR MAXIMUM 16 SMALL SIZE CHARS PER ROW)
			tempString = ' ';
			if (rawMX >= 0) tempString += '+';
			tempString += rawMX + ' ';
			if (rawMY >= 0) tempString += '+';
			tempString += rawMY + ' ';
			if (rawMZ >= 0) tempString += '+';
			tempString += rawMZ;
*/
		}
		else
		{
			// Display magnetometer values in gauss (adjusted to scale)
			tempString = '';
			if (data[9] >= 0) tempString += '+'; // adjMX
			tempString += data[9].toFixed(2) + ' ';
			if (data[10] >= 0) tempString += '+'; // adjMY
			tempString += data[10].toFixed(2) + ' ';
			if (data[11] >= 0) tempString += '+'; // adjMZ
			tempString += data[11].toFixed(2);
		}
		SH1107.DrawTextSmall(tempString, 4, 6, true);

		tempString = 'R ';
		if (data[12] >= 0) tempString += '+'; // rollDegrees
		tempString += data[12].toFixed(0) + '*';
		SH1107.DrawTextSmall(tempString, 84, 10, true);
		tempString = 'P ';
		if (data[13] >= 0) tempString += '+'; // pitchDegrees
		tempString += data[13].toFixed(0) + '*';
		SH1107.DrawTextSmall(tempString, 84, 11, true);
		tempString = ' ' + data[14].toFixed(0) + '*   '; // headingDegrees
		if (data[14] < 100) tempString += '  ';
		if (data[14] < 10) tempString += '  ';
		SH1107.DrawTextMedium(tempString, 0, 10, false);

		if (refreshAll) SH1107.On();
	}

	// ====================

	if (IS31FL3731_RGB.IsAvailable())
	{
		// Let's draw a simplified attitude indicator (see e.g. https://en.wikipedia.org/wiki/Attitude_indicator ) and compass!

		const icon = [0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000 ];

		// Add a simple roll indicator...
		if (data[12] > 30) icon[4] = icon[9] = icon[14] = icon[19] = icon[24] = 0x0000aa;
		else if (data[12] > 10) icon[3] = icon[8] = icon[13] = icon[18] = icon[23] = 0x0000aa;
		else if (data[12] < -30) icon[0] = icon[5] = icon[10] = icon[15] = icon[20] = 0x0000aa;
		else if (data[12] < -10) icon[1] = icon[6] = icon[11] = icon[16] = icon[21] = 0x0000aa;
		else icon[2] = icon[7] = icon[12] = icon[17] = icon[22] = 0x0000aa;

		// Add a simple pitch indicator...
		if (data[13] > 30) icon[20] = icon[21] = icon[22] = icon[23] = icon[24] = 0x0000aa;
		else if (data[13] > 10) icon[15] = icon[16] = icon[17] = icon[18] = icon[19] = 0x0000aa;
		else if (data[13] < -30) icon[0] = icon[1] = icon[2] = icon[3] = icon[4] = 0x0000aa;
		else if (data[13] < -10) icon[5] = icon[6] = icon[7] = icon[8] = icon[9] = 0x0000aa;
		else icon[10] = icon[11] = icon[12] = icon[13] = icon[14] = 0x0000aa;

		// Add a simple heading indicator... (aka compass)
		var hdng = data[14];
		if (hdng > 349) icon[2] = 0xaa0000;       // N
		else if (hdng > 327) icon[1] = 0xaa0000;  // NNW
		else if (hdng > 303) icon[0] = 0xaa0000;  // NW
		else if (hdng > 281) icon[5] = 0xaa0000;  // WNW
		else if (hdng > 259) icon[10] = 0xaa0000; // W
		else if (hdng > 237) icon[15] = 0xaa0000; // WSW
		else if (hdng > 213) icon[20] = 0xaa0000; // SW
		else if (hdng > 191) icon[21] = 0xaa0000; // SSW
		else if (hdng > 169) icon[22] = 0xaa0000; // S
		else if (hdng > 147) icon[23] = 0xaa0000; // SSE
		else if (hdng > 123) icon[24] = 0xaa0000; // SE
		else if (hdng > 101) icon[19] = 0xaa0000; // ESE
		else if (hdng > 79) icon[14] = 0xaa0000; // E
		else if (hdng > 57) icon[14] = 0xaa0000; // ENE
		else if (hdng > 33) icon[14] = 0xaa0000; // NE
		else if (hdng > 11) icon[14] = 0xaa0000; // NNE
		else icon[2] = 0xaa0000;                  // N

		IS31FL3731_RGB.Display(icon);
	}

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
		// Display the rough compass heading...
		if (hdng <= 23) IS31FL3731_WHITE.DrawString("N");
		else if (hdng <= 68) IS31FL3731_WHITE.DrawString("NE");
		else if (hdng <= 113) IS31FL3731_WHITE.DrawString("E");
		else if (hdng <= 158) IS31FL3731_WHITE.DrawString("SE");
		else if (hdng <= 203) IS31FL3731_WHITE.DrawString("S");
		else if (hdng <= 248) IS31FL3731_WHITE.DrawString("SW");
		else if (hdng <= 293) IS31FL3731_WHITE.DrawString("W");
		else if (hdng <= 338) IS31FL3731_WHITE.DrawString("NW");
		else IS31FL3731_WHITE.DrawString("N");
    }

    // ====================
    
    if (HT16K33.IsAvailable())
    {
		// Display the rough compass heading...
		if (hdng <= 23) HT16K33.Display("-N-");
		else if (hdng <= 68) HT16K33.Display("-NE-");
		else if (hdng <= 113) HT16K33.Display("-E-");
		else if (hdng <= 158) HT16K33.Display("-SE-");
		else if (hdng <= 203) HT16K33.Display("-S-");
		else if (hdng <= 248) HT16K33.Display("-SW-");
		else if (hdng <= 293) HT16K33.Display("-W-");
		else if (hdng <= 338) HT16K33.Display("-NW-");
		else HT16K33.Display("-N-");
    }

	// ====================

	if (refreshAll) Log();
}

// ================================================================================
