// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: CLOCK ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const SH1107 = require('./SH1107.js');
const IS31FL3731 = require('./IS31FL3731.js');

module.exports = {
	Log: Log,
	Display: Display
};

// ================================================================================

function Log()
{
	var date = new Date();
	var time = date.toTimeString();

	console.log("Breakout Gardener -> CLOCK -> The time is %s.", time);
}

// ====================

var previousTime = 'XX:XX';

function Display(refreshAll)
{
	var date = new Date();
	var time = date.toTimeString();

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
	
		if (IS31FL3731.IsAvailable())
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
	
			IS31FL3731.Display(icon);
		}
	}

	// ====================

	if (refreshAll) console.log("Breakout Gardener -> CLOCK -> The time is %s.", time);

	previousTime = time;
}

// ================================================================================
