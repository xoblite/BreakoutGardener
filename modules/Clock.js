// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: CLOCK ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');
const DRV2605 = require('./DRV2605.js');

module.exports = {
	Start: Start,
	Stop: Stop,
	Get: Get,
	Log: Log,
	Display: Display
};

// ================================================================================

var outputLogs = false, showDebug = false;

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
	if (debug) showDebug = true;
}

function Stop() { return; }

// ====================

function Get()
{
	var date = new Date();
	return date.toTimeString();
}

// ====================

function Log()
{
    if (outputLogs) console.log("Breakout Gardener -> CLOCK -> The time is %s.", Get());
}

// ====================

var previousTime = 'XX:XX';

function Display(refreshAll)
{
	var time = Get();

	var hourChanged = false, minuteChanged = false;
	if (time[1] != previousTime[1]) hourChanged = true;
	if (time[4] != previousTime[4]) minuteChanged = true;

	// ====================

	if (refreshAll || hourChanged || minuteChanged)
	{
		if (SH1107.IsAvailable())
		{
			if (refreshAll)
			{
				SH1107.Off();
				SH1107.Clear();
				SH1107.DrawSeparatorLine();
			}

			if (refreshAll || hourChanged)
			{
				SH1107.DrawNumberLarge(parseInt(time[0]), 10, 1);
				SH1107.DrawNumberLarge(parseInt(time[1]), 1, 1);
			}
			if (refreshAll || minuteChanged)
			{
				SH1107.DrawNumberLarge(parseInt(time[3]), 10, 3);
				SH1107.DrawNumberLarge(parseInt(time[4]), 1, 3);
			}
		
			if (refreshAll) SH1107.On();
		}
	
		// ====================
	
		if (IS31FL3731_RGB.IsAvailable())
		{
			// Let's display a 24-hour bit clock! 8)
	
			const icon = [0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
						  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
						  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
						  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
						  0x000000, 0x000000, 0x000000, 0x000000, 0x000000 ];
	
			// Hour first digit... (0-2 -> 2 bits)
			icon[20] = icon[15] = 0x000044;
			if (time[0] & 1) icon[20] = 0xff0000;
			if (time[0] & 2) icon[15] = 0xff0000;
	
			// Hour second digit... (0-9 -> 4 bits)
			icon[21] = icon[16] = icon[11] = icon[6] = 0x000044;
			if (time[1] & 1) icon[21] = 0xff0000;
			if (time[1] & 2) icon[16] = 0xff0000;
			if (time[1] & 4) icon[11] = 0xff0000;
			if (time[1] & 8) icon[6] = 0xff0000;
	
			// Minute first digit... (0-5 -> 3 bits)
			icon[23] = icon[18] = icon[13] = 0x000044;
			if (time[3] & 1) icon[23] = 0xff0000;
			if (time[3] & 2) icon[18] = 0xff0000;
			if (time[3] & 4) icon[13] = 0xff0000;
	
			// Minute second digit... (0-9 -> 4 bits)
			icon[24] = icon[19] = icon[14] = icon[9] = 0x000044;
			if (time[4] & 1) icon[24] = 0xff0000;
			if (time[4] & 2) icon[19] = 0xff0000;
			if (time[4] & 4) icon[14] = 0xff0000;
			if (time[4] & 8) icon[9] = 0xff0000;
	
			// Hour:Minute separator...
			// icon[22] = icon[12] = 0x004400;
	
			IS31FL3731_RGB.Display(icon);
		}

		// ====================

		if (IS31FL3731_WHITE.IsAvailable())
		{
			// Let's display a 24-hour bit clock! 8)

			const icon = [ 20,20,20,20,20,20,20,20,20,20,20,
						   20,20,20,20,20,20,20,20,20,20,20,
						   20,20,20,20,20,20,20,20,20,20,20,
						   20,20,20,35,35,20,20,20,20,35,35,
						   20,20,20,35,35,20,35,35,20,35,35,
						   35,35,20,35,35,20,35,35,20,35,35,
						   35,35,20,35,35,20,35,35,20,35,35 ];

			// Hour first digit... (0-2 -> 2 bits)
			if (time[0] & 1) icon[66] = icon[67] = 70;
			if (time[0] & 2) icon[55] = icon[56] = 70;

			// Hour second digit... (0-9 -> 4 bits)
			if (time[1] & 1) icon[69] = icon[70] = 70;
			if (time[1] & 2) icon[58] = icon[59] = 70;
			if (time[1] & 4) icon[47] = icon[48] = 70;
			if (time[1] & 8) icon[36] = icon[37] = 70;

			// Minute first digit... (0-5 -> 3 bits)
			if (time[3] & 1) icon[72] = icon[73] = 70;
			if (time[3] & 2) icon[61] = icon[62] = 70;
			if (time[3] & 4) icon[50] = icon[51] = 70;

			// Minute second digit... (0-9 -> 4 bits)
			if (time[4] & 1) icon[75] = icon[76] = 70;
			if (time[4] & 2) icon[64] = icon[65] = 70;
			if (time[4] & 4) icon[53] = icon[54] = 70;
			if (time[4] & 8) icon[42] = icon[43] = 70;

			IS31FL3731_WHITE.Display(icon);
        }

		// ====================

        if (DRV2605.IsAvailable())
        {
            // Play a short buzz when the hour changes... (-> hopefully unobtrusive enough? ;] )
            if (hourChanged) DRV2605.Play(13);
        }
	}

	// ====================

	if (refreshAll) console.log("Breakout Gardener -> CLOCK -> The time is %s.", time);

	previousTime = time;
}

// ================================================================================
