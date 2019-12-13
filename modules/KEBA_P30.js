// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: KEBA P30 ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');
const DRV2605 = require('./DRV2605.js');
const HT16K33 = require('./HT16K33.js');

module.exports = {
	IsAvailable: IsAvailable,
	Start: Start,
	Stop: Stop,
	Get: Get,
	Log: Log,
	Display: Display
};

// ================================================================================

// ----------------------------------------------------------------------------------------
// === KEBA KeContact P30 series wallbox charging station ===
// * Product Page -> https://www.keba.com/en/emobility/products/product-overview/product_overview
// * Programmer's Guide -> https://www.keba.com/download/x/fff263235e/kecontactp30udp_pgen.pdf
// ----------------------------------------------------------------------------------------

var IP_ADDRESS_KEBA_P30 = "";
var moduleEnabled = false;
var kebaClientSocket = null;
var kebaClientPort = 7090; // Wallbox + API client port (non-configurable)
var wallboxPollingInterval = null;
var data = [9,0,0,0,0,0,0,0,0,0,0];
var outputLogs = false, showDebug = false;

// ====================

function IsAvailable()
{
	if (moduleEnabled) return true;
	else return false;
}

// ====================

function Start(enabled, ip, logs, debug)
{
    if (enabled) moduleEnabled = true;
    else return;

    if (logs) outputLogs = true;
    if (debug) showDebug = true;
    
    // ====================

    IP_ADDRESS_KEBA_P30 = ip;
    if (outputLogs) console.log("Breakout Gardener -> INFO -> Module enabled:\n\n   • \x1b[32mKEBA P30\x1b[0m wallbox charging station's IP address set to %s.\n", IP_ADDRESS_KEBA_P30);

    var dgram = require('dgram');
    kebaClientSocket = dgram.createSocket('udp4');
    kebaClientSocket.bind(kebaClientPort);

    // ====================

    kebaClientSocket.on('listening', function ()
    {
        if (outputLogs) console.log("Breakout Gardener -> KEBA P30 -> Starting: Wallbox API client bound to and listening on port %s.", kebaClientSocket.address().port);
    });

    // ====================

    kebaClientSocket.on('message', function (message, remote)
    {
        const buffer = Buffer.from(message);
        if (buffer.indexOf('{') == 0) // JSON (the wallbox also sends a few non-JSON messages that we're not interested in)
        {
            var obj = JSON.parse(message);

            // ====================

            if (obj.ID == 2) // Wallbox report type 2
            {
                data[0] = obj.State;
                // ### HMM, SHOULD WE PERHAPS SAVE THE PLUG STATE (obj.Plug) HERE AS WELL? ###
                data[10] = obj["Curr HW"];
                data[11] = obj["Curr user"];
            }

            // ====================

            else if (obj.ID == 3) // Wallbox report type 3
            {
                data[1] = (obj.P/1000000).toFixed(1); // Power

                var maxAllowedCurrent = Math.min(data[10], data[11]); // The lower value of "Curr HW" and "Curr user" sets the upper current limit
                if (maxAllowedCurrent > 0) data[2] = Math.round((Math.max(obj.I1, obj.I2, obj.I3) / maxAllowedCurrent) * 100); // Power in % of maximum
                else data[2] = 0;

                data[3] = (obj["E pres"] / 10000).toFixed(2); // Energy transferred in kWh

                data[4] = obj.U1;
                data[5] = obj.U2;
                data[6] = obj.U3;
                data[7] = (obj.I1 / 1000).toFixed(1);
                data[8] = (obj.I2 / 1000).toFixed(1);
                data[9] = (obj.I3 / 1000).toFixed(1);
            }

            // ====================

            if (showDebug) Log();
        }
    });

    // ====================

	// Start polling the wallbox status asynchronously every 10 seconds... (see PollWallbox() below)
    wallboxPollingInterval = setInterval(PollWallbox, 10000);
    PollWallbox();
}

var alternatingReports = true;
function PollWallbox() // Note: Asynchronously running helper function (see above)
{
    if (alternatingReports)
    {
        if (kebaClientSocket) kebaClientSocket.send('report 3', 7090, IP_ADDRESS_KEBA_P30, function(err, bytes) {
            if (err) throw err;
        });
        alternatingReports = false;
    }
    else
    {
        if (kebaClientSocket) kebaClientSocket.send('report 2', 7090, IP_ADDRESS_KEBA_P30, function(err, bytes) {
            if (err) throw err;
        });
        alternatingReports = true;
    }
}

// ====================

function Stop()
{
   	// Stop the periodic polling of the wallbox status...
	clearInterval(wallboxPollingInterval);
    // Close the wallbox API client socket...
    if (kebaClientSocket) kebaClientSocket.close();
}

// ====================

function Get() { return data; }

// ====================

function Log()
{
    if (outputLogs)
    {
        console.log("Breakout Gardener -> KEBA P30 -> Current status:\n");
        if (data[0] == 0) console.log('   \x1b[90m--> State: \x1b[7m Starting \x1b[0m\n');
        if (data[0] == 1) console.log('   \x1b[90m--> State: \x1b[7m Unplugged \x1b[0m \x1b[90m(not ready)\x1b[0m\n');
        if (data[0] == 2) console.log('   \x1b[90m--> State: \x1b[7m Plugged \x1b[0m \x1b[90m(not charging)\x1b[0m\n');
        if (data[0] == 3) console.log('   \x1b[90m--> State: \x1b[7m Charging \x1b[0m\n');
        if (data[0] == 4) console.log('   \x1b[90m--> State: \x1b[7m Error \x1b[0m\n');
        if (data[0] == 5) console.log('   \x1b[90m--> State: \x1b[7m Interrupted \x1b[0m\n');
        if (data[0] == 9) console.log('   \x1b[90m--> State: (Checking)\n');
        
        if ((data[10] > 0) && (data[11] > 0))
        {
            console.log('   \x1b[90m--> Max current (HW restriction) : %s A\x1b[0m', (data[10] / 1000));
            console.log('   \x1b[90m--> Max current (SW configured)  : %s A\x1b[0m\n', (data[11] / 1000));
        }
    
        console.log("   \x1b[90m--> Voltage: " + data[4] + " / " + data[5] + " / " + data[6] + " V\x1b[0m");
        console.log("   \x1b[90m--> Current: " + data[7] + " / " + data[8] + " / " + data[9] + " A\x1b[0m");
        console.log("   \x1b[90m--> Power: " + data[1] + " kW\x1b[0m");
        console.log("   \x1b[90m--> Power in % of maximum: \x1b[7m " + data[2] + "% \x1b[0m\n");
        console.log("   \x1b[90m--> Energy transferred: \x1b[7m " + data[3] + " kWh \x1b[0m\n");
    }
}

// ====================

var previousState = 9;

function Display(refreshAll)
{
    Get();

	if (SH1107.IsAvailable())
	{
		if (refreshAll)
		{
			SH1107.Off();
			SH1107.Clear();
			SH1107.DrawTextSmall("STATE:", 4, 1, false);
            SH1107.DrawSeparatorLine(5);
            SH1107.DrawTextSmall("POWER & ENERGY:", 4, 6, false);
			SH1107.DrawTextSmall("KEBA P30", 34, 16, false);
        }

        var textString = '';
        if (data[0] == 0) textString = '+ STARTING'; // Starting
        if (data[0] == 1) textString = '- UNPLUGGED'; // Unplugged (not ready)
        if (data[0] == 2) textString = '+ PLUGGED'; // Plugged (not charging)
        if (data[0] == 3) textString = '+ CHARGING'; // Charging
        if (data[0] == 4) textString = '! ERROR'; // Error
        if (data[0] == 5) textString = '! INTERRUPTED'; // Interrupted
        if (data[0] == 9) textString = '(CHECKING)'; // (Checking)

        SH1107.DrawTextSmall(textString, 12, 3, true);
		textString = data[1].toString() + ' KW (' + data[2].toString() + '%)';
		SH1107.DrawTextSmall(textString, 12, 8, true);
		textString = data[3].toString();
        SH1107.DrawTextMedium(textString, 12, 10, true);
        if (data[3] == 0) SH1107.DrawTextSmall("KWH", 36, 11, true);
        else if (data[3] >= 10) SH1107.DrawTextSmall("KWH", 88, 11, true);
        else SH1107.DrawTextSmall("KWH", 72, 11, true);

        if (refreshAll) SH1107.On();
	}

	// ====================

	if (IS31FL3731_RGB.IsAvailable())
	{
		const icon = [0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
					  0x000000, 0x000000, 0x000000, 0x000000, 0x000000 ];

		var stateColor;
        if (data[0] == 0) stateColor = 0x003366; // Starting
        if (data[0] == 1) stateColor = 0x222222; // Unplugged (not ready)
        if (data[0] == 2) stateColor = 0x0066cc; // Plugged (not charging)
        if (data[0] == 3) stateColor = 0x008800; // Charging
        if (data[0] == 4) stateColor = 0xaa0000; // Error
        if (data[0] == 5) stateColor = 0xaa8800; // Interrupted

        if (data[0] == 9) icon[12] = 0x554400; // (Checking)
        else icon[6] = icon[7] = icon[8] = icon[11] = icon[12] = icon[13] = icon[16] = icon[17] = icon[18] = stateColor;

		IS31FL3731_RGB.Display(icon);
	}

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
		const img = [ 0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
					  0,0,0,0,0,0,0,0,0,0,0,
                      0,0,0,0,0,0,0,0,0,0,0 ];
        
        // Let's draw a simple horizontal bar meter based on
        // the current power output in percentage of the maximum...
        if (data[2] > 85) { for (var n=0; n<11; n++) img[n] = 120; }
        else if (data[2] > 70) { for (var n=11; n<22; n++) img[n] = 105; }
        else if (data[2] > 56) { for (var n=22; n<33; n++) img[n] = 90; }
        else if (data[2] > 42) { for (var n=33; n<44; n++) img[n] = 75; }
        else if (data[2] > 28) { for (var n=44; n<55; n++) img[n] = 60; }
        else if (data[2] > 15) { for (var n=55; n<66; n++) img[n] = 45; }
        else { for (var n=66; n<77; n++) img[n] = 30; }

        IS31FL3731_WHITE.Display(img);
    }

    // ====================
    
    if (HT16K33.IsAvailable())
    {
        var state = 'CHECKING';
        if (data[0] == 0) state = 'STARTING'; // Starting
        if (data[0] == 1) state = 'UNPLUGGED'; // Unplugged (not ready)
        if (data[0] == 2) state = 'PLUGGED'; // Plugged (not charging)
        if (data[0] == 3) state = 'CHARGING'; // Charging
        if (data[0] == 4) state = 'ERROR'; // Error
        if (data[0] == 5) state = 'INTERRUPTED'; // Interrupted

        HT16K33.Display(state);
    }

    // ====================

    if (DRV2605.IsAvailable())
    {
        if (data[0] == 2) // Current state -> Plugged (not charging)
        {
            if (previousState == 3) // Previous state -> Charging
            {
                // -> Charging session has finished!!!
                DRV2605.Play(16); // -> Play an "Alert 1000 ms" buzz
            }

            previousState = data[0];
        }
    }

	// ====================

    if (refreshAll) Log();
}

// ================================================================================
