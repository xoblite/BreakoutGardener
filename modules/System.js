// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: SYSTEM (CPU/MEMORY) ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const os = require('os');
const { performance } = require('perf_hooks');
const { execSync } = require('child_process');
const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');

module.exports = {
    Start: Start,
    Stop: Stop,
    GetCPULoad: GetCPULoad,
    GetCPUTemperature: GetCPUTemperature,
    GetMemoryUsageInPercent: GetMemoryUsageInPercent,
    DisplayLoad: DisplayLoad,
    DisplayInfo: DisplayInfo
};

// ================================================================================

var outputLogs = false, showDebug = false;
var busyUpdating = false;
var cpuLoadCurrent = [], cpuLoadIdleTime = [], currentIdleTime = [];
var cpuLoadAverageAllCores = 0.0;
var cpuLoadTimeStamp = 0;
var updateInterval = null;

// ====================

function Start(logs, debug)
{
    if (logs) outputLogs = true;
    if (debug) showDebug = true;

    for (var n = 0; n < os.cpus().length; n++)
    {
        // Add array entries for all available CPU cores...
        cpuLoadCurrent.push(0.0);
        cpuLoadIdleTime.push(0);
        currentIdleTime.push(0);
    }

    Update(); // Perform a first update to have valid readings from the start
    updateInterval = setInterval(Update, 3000); // Update readings every 3 seconds
}

function Stop() { clearInterval(updateInterval); }

// ====================

function Update()
{
    busyUpdating = true;

    // The following loop iterates over the number of available CPU cores, which means it
    // should work both on the Pi Zero (1 core ARMv6) as well as the Pi 3 (4 core ARMv7) ...
    for (var n = 0; n < os.cpus().length; n++) {
        currentIdleTime[n] = os.cpus()[n].times.idle / 10;
    }

    // Get the current timestamp...
    var currentTimeStamp = performance.now();

    if (cpuLoadTimeStamp == 0) // This is the first measurement, so we have no delta(s) to use in our load calculations...
    {
        for (var n = 0; n < os.cpus().length; n++)
        {
            cpuLoadCurrent[n] = 0.0;
            cpuLoadIdleTime[n] = currentIdleTime[n];
        }
        cpuLoadAverageAllCores = 0.0;
    }
    else // We have a previous measurement to use for delta(s) in our load calculations...
    {
        var deltaIdleTime = 0;
        cpuLoadAverageAllCores = 0.0;
        for (var n = 0; n < os.cpus().length; n++)
        {
            deltaIdleTime = currentIdleTime[n] - cpuLoadIdleTime[n];
            cpuLoadIdleTime[n] = currentIdleTime[n];
            cpuLoadCurrent[n] = (1 - (deltaIdleTime / (currentTimeStamp - cpuLoadTimeStamp))) * 100;
            // if (showDebug) console.log(" --- Core %d load: %d %", n, cpuLoadCurrent[n].toFixed(1));
            cpuLoadAverageAllCores += cpuLoadCurrent[n];
        }
        // Next we calculate the average CPU load across all cores, rounded to the nearest integer...
        cpuLoadAverageAllCores /= os.cpus().length;
        cpuLoadAverageAllCores = Math.round(cpuLoadAverageAllCores);
        // if (showDebug) console.log(" --- All cores: ~%d %\n----------", cpuLoadAverageAllCores);
    }
    // Save the current timestamp to use as input to delta calculations the next time...
    cpuLoadTimeStamp = currentTimeStamp;

    busyUpdating = false;
}

// ====================

function GetCPULoad()
{
    // while (busyUpdating) await sleep(10);
    var obj = {};
    obj.Cores = cpuLoadCurrent;
    obj.AllCores = cpuLoadAverageAllCores;
    return obj;
}

// ====================

function GetCPUTemperature()
{
    var degrees = execSync('cat /sys/class/thermal/thermal_zone0/temp', (err, stdout, stderr) => {
        if (err) {
          console.log("%s -> ERROR -> CPU temperature could not be read!", softwareName);
          return 0;
        }
    });
    return Math.round(parseFloat(degrees) / 100) / 10;
}

// ====================

function GetMemoryUsageInPercent()
{
    return memoryUsageInPercent = Math.round((1 - (os.freemem() / os.totalmem())) * 100);
}

// ====================

function DisplayLoad(refreshAll)
{
    var cpuLoad = GetCPULoad();

    if (SH1107.IsAvailable())
    {
        if (refreshAll)
        {
            SH1107.Off();
            SH1107.Clear();
            SH1107.DrawTextSmall("CPU LOAD %", 29, 16, false);
        }
    
        if (cpuLoad.Cores.length == 4)
        {
            SH1107.DrawMeterBar(parseInt(cpuLoad.Cores[0]), 1);
            SH1107.DrawMeterBar(parseInt(cpuLoad.Cores[1]), 4);
            SH1107.DrawMeterBar(parseInt(cpuLoad.Cores[2]), 7);
            SH1107.DrawMeterBar(parseInt(cpuLoad.Cores[3]), 10);
        }
        else SH1107.DrawMeterBar(cpuLoad.AllCores, 7);
    
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

        // Draw load meters for each individual core...
        if (cpuLoad.Cores.length <= 4)
        {
            for (var n=0; n<cpuLoad.Cores.length; n++)
            {
                if (cpuLoad.Cores[n] > 90) icon[4+(n*5)] = 0x0000aa;
                else if (cpuLoad.Cores[n] > 80) icon[4+(n*5)] = 0x000044;
                if (cpuLoad.Cores[n] > 70) icon[3+(n*5)] = 0x0000aa;
                else if (cpuLoad.Cores[n] > 60) icon[3+(n*5)] = 0x000044;
                if (cpuLoad.Cores[n] > 50) icon[2+(n*5)] = 0x0000aa;
                else if (cpuLoad.Cores[n] > 40) icon[2+(n*5)] = 0x000044;
                if (cpuLoad.Cores[n] > 30) icon[1+(n*5)] = 0x0000aa;
                else if (cpuLoad.Cores[n] > 20) icon[1+(n*5)] = 0x000044;
                if (cpuLoad.Cores[n] > 10) icon[(n*5)] = 0x0000aa;
                else icon[(n*5)] = 0x000044;
            }
        }

        // ...and one for the average load across all cores...
        if (cpuLoad.AllCores > 90) icon[24] = 0x00aa00;
        else if (cpuLoad.AllCores > 80) icon[24] = 0x004400;
        if (cpuLoad.AllCores > 70) icon[23] = 0x00aa00;
        else if (cpuLoad.AllCores > 60) icon[23] = 0x004400;
        if (cpuLoad.AllCores > 50) icon[22] = 0x00aa00;
        else if (cpuLoad.AllCores > 40) icon[22] = 0x004400;
        if (cpuLoad.AllCores > 30) icon[21] = 0x00aa00;
        else if (cpuLoad.AllCores > 20) icon[21] = 0x004400;
        if (cpuLoad.AllCores > 10) icon[20] = 0x00aa00;
        else icon[20] = 0x004400;

		IS31FL3731_RGB.Display(icon);
    }

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
        // IS31FL3731_WHITE.DrawString((Math.round(cpuLoad.AllCores).toString() + '%')); // Average CPU load across all cores

        var memoryUsageInPercent = GetMemoryUsageInPercent();

        if (cpuLoad.Cores.length == 4) // Quad core CPU, e.g. Raspberry Pi 3
        {
            // Draw load meters for each individual core...
            for (var n=0; n<cpuLoad.Cores.length; n++) IS31FL3731_WHITE.DrawMeter(cpuLoad.Cores[n], n);
            // ...clear the row in between...
            IS31FL3731_WHITE.DrawMeter(255, 4);
            // ...draw a meter for the average load across all cores...
//            IS31FL3731_WHITE.DrawMeter(cpuLoad.AllCores, 6);
            IS31FL3731_WHITE.DrawMeter(cpuLoad.AllCores, 5);
            // ...and finally a meter showing the relative memory usage...
            IS31FL3731_WHITE.DrawMeter(memoryUsageInPercent, 6);
        }
        else // Single core CPU, e.g. Raspberry Pi Zero, and everything else... (yeah I'm lazy ;] )
        {
            // Draw a fatter, vertically centered load meter for the single core...
            IS31FL3731_WHITE.DrawMeter(255, 0);
            IS31FL3731_WHITE.DrawMeter(cpuLoad.AllCores, 1);
            IS31FL3731_WHITE.DrawMeter(cpuLoad.AllCores, 2);
            IS31FL3731_WHITE.DrawMeter(cpuLoad.AllCores, 3);
            IS31FL3731_WHITE.DrawMeter(cpuLoad.AllCores, 4);
            IS31FL3731_WHITE.DrawMeter(255, 5);
            // ...and a meter showing the relative memory usage...
            IS31FL3731_WHITE.DrawMeter(memoryUsageInPercent, 6);
       }
	}

    // ====================

    if (refreshAll)
    {
        var msg = 'Breakout Gardener -> SYSTEM -> CPU load per core: ';
        for (var n=0; n<cpuLoad.Cores.length; n++)
        {
            msg += '[' + (n+1) + '] \x1b[97;100m ' + cpuLoad.Cores[n].toFixed(1) + '% \x1b[0m';
            if (n<cpuLoad.Cores.length-1) msg +=  ' / ';
            else msg += '.';
        }
        console.log(msg);
    }
}

// ====================

function DisplayInfo(refreshAll)
{
    var cpuLoad = GetCPULoad();
    var cpuTemperature = GetCPUTemperature();
    var memoryUsageInPercent = GetMemoryUsageInPercent();

    // ====================

    if (SH1107.IsAvailable())
    {
        if (refreshAll)
        {
            SH1107.Off();
            SH1107.Clear();
            SH1107.DrawTextMedium(' CPU', 0, 0, false);
            SH1107.DrawSeparatorLine(7);
            SH1107.DrawTextMedium(' MEMORY', 0, 8, false);
            SH1107.DrawTextSmall("SYSTEM", 41, 16, false);
        }

        var tempString = 'AVG LOAD:   ' + cpuLoad.AllCores.toString() + ' %';
        SH1107.DrawTextSmall(tempString, 4, 3, true);
        tempString = 'CPU TEMP:   ' + cpuTemperature.toString() + ' *C';
        SH1107.DrawTextSmall(tempString, 4, 5, true);
        tempString = 'MEM LOAD:   ' + memoryUsageInPercent.toString() + ' %';
        SH1107.DrawTextSmall(tempString, 4, 11, true);

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

        // Draw a really simple indicator for memory usage in percent...
        // (nb. we already displayed the CPU load on the previous page =] )
        for (var n=1; n<4; n++)
        {
            if (memoryUsageInPercent > 90) icon[4+(n*5)] = 0x002222;
            else if (memoryUsageInPercent > 80) icon[4+(n*5)] = 0x001111;
            if (memoryUsageInPercent > 70) icon[3+(n*5)] = 0x002222;
            else if (memoryUsageInPercent > 60) icon[3+(n*5)] = 0x001111;
            if (memoryUsageInPercent > 50) icon[2+(n*5)] = 0x002222;
            else if (memoryUsageInPercent > 40) icon[2+(n*5)] = 0x001111;
            if (memoryUsageInPercent > 30) icon[1+(n*5)] = 0x002222;
            else if (memoryUsageInPercent > 20) icon[1+(n*5)] = 0x001111;
            if (memoryUsageInPercent > 10) icon[(n*5)] = 0x002222;
            else icon[(n*5)] = 0x001111;
        }

        IS31FL3731_RGB.Display(icon);
    }

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
        // PLACEHOLDER: DISPLAY "BG" PICTURE
        const pictBG = [ 20,20,20,20,20,20,20,20,20,20,20,
                         20,40,40,40,20,20,20,40,40,20,20,
                         20,40,20,20,40,20,40,20,20,20,20,
                         20,40,40,40,20,20,40,20,40,40,20,
                         20,40,20,20,40,20,40,20,20,40,20,
                         20,40,40,40,20,20,20,40,40,20,20,
                         20,20,20,20,20,20,20,20,20,20,20 ];
        IS31FL3731_WHITE.Display(pictBG);
	}

    // ====================

    if (refreshAll)
    {
        var msg = 'Breakout Gardener -> SYSTEM -> CPU load ';
        if (cpuLoad.Cores.length > 1) msg += '(average across ' + cpuLoad.Cores.length + ' cores) ';
        else msg += '(average) ';
        msg += '\x1b[97;100m ' + cpuLoad.AllCores.toString() + ' \% \x1b[0m / CPU temperature \x1b[97;100m ' + cpuTemperature.toString() + ' °C \x1b[0m / Memory usage \x1b[97;100m ' + memoryUsageInPercent.toString() + ' \% \x1b[0m.';
        console.log(msg);
    }
}

// ================================================================================
