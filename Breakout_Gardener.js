// ============================================================================================
// --- BREAKOUT GARDENER ---
// "A nice little playground for miscellaneous (p)HAT/Breakout/Sensor/OLED/etc tinkering" ;)
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const softwareName = "Breakout Gardener";
const softwareVersion = "19.10.4 (R2B)";

const I2C = require('./modules/I2C.js'); // Requires the i2c-bus library -> https://github.com/fivdi/i2c-bus

const ADS1015 = require('./modules/ADS1015.js');
const ADT7410 = require('./modules/ADT7410.js');
const ADXL343 = require('./modules/ADXL343.js');
const BMP280 = require('./modules/BMP280.js');
const CAP1166 = require('./modules/CAP1166.js');
const DRV2605 = require('./modules/DRV2605.js');
const DS18B20 = require('./modules/DS18B20.js');
const IS31FL3731_RGB = require('./modules/IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./modules/IS31FL3731_WHITE.js');
const KEBA_P30 = require('./modules/KEBA_P30.js');
const LSM303D = require('./modules/LSM303D.js');
const MCP9808 = require('./modules/MCP9808.js');
const SGP30 = require('./modules/SGP30.js');
const SH1107 = require('./modules/SH1107.js');
const SHT31D = require('./modules/SHT31D.js');
const TRACKBALL = require('./modules/Trackball.js');
const TCS3472 = require('./modules/TCS3472.js');
const VCNL4010 = require('./modules/VCNL4010.js');
const VEML6075 = require('./modules/VEML6075.js');

const SYSTEM = require('./modules/System.js');
const CLOCK = require('./modules/Clock.js');
const KOMPIS = require('./modules/Kompis.js');
const DASHBOARD = require('./modules/Dashboard.js');
const PROMETHEUS = require('./modules/Prometheus.js');

// ================================================================================
// ========================= USER CONFIGURABLE SETTINGS ===========================
// ================================================================================

// General settings
const outputLogs = true;
const showDebug = false;
const resetI2CDevicesOnExit = true; // Soft reset applicable I2C devices upon exit? (in my experience, e.g. the SGP30 becomes more reliable across restarts with this enabled)

// DASHBOARD related settings
const dashboardEnabled = true; // Enable dashboard server?
const dashboardPort = 8080; // Dashboard server port (when enabled)
var dashboardMultipleRows = true; // Display modules on multiple rows? (10 on each row)

// PROMETHEUS related settings
const prometheusEnabled = true; // Enable Prometheus exposure server?
const prometheusPort = 9091; // Prometheus exposure server port (when enabled)

// DS18B20 related settings
// -> Identity of any DS18B20 1-Wire sensor device(s) we're interested in
// (nb. each sensor has a unique 28-xxxxxxxxxxxx serial number ~ ID string,
// for further information see e.g. https://pinout.xyz/pinout/1_wire )
var ds18b20Sensors = ['28-01183392d2ff', '28-011833915dff'];

// LSM303D related settings
var lsm303dDisplayRaw = false; // Display motion data as raw sensor values instead of as scale adjusted g/gauss units?
var lsm303dHeadingCalibration = 0; // Manual compass heading calibration (in case it's needed [?])

// TCS3472 related settings
var tcs3472LEDEnable = false; // Enable the TCS3472 illumination LEDs on the Enviro pHAT?

// KEBA P30 related settings
var kebap30Enable = false; // Enable the KEBA P30 wallbox charger module?
var kebap30IPAddress = '192.168.1.23'; // Wallbox IP address

// ================================================================================
// ================= DISCOVER, START AND INITIALIZE ALL MODULES ===================
// ================================================================================

console.log("%s -> INFO -> Starting: Version %s, running on Node.js %s.", softwareName, softwareVersion, process.version);

// Open the I2C bus and scan for devices...
I2C.Start(outputLogs, showDebug);

// Start and initialize all supporting subsystems...
SYSTEM.Start(outputLogs, showDebug);
CLOCK.Start(outputLogs, showDebug);
KOMPIS.Start(outputLogs, showDebug);
if (SH1107.IsAvailable()) SH1107.Start(outputLogs, showDebug);
if (IS31FL3731_RGB.IsAvailable()) IS31FL3731_RGB.Start(outputLogs, showDebug);
if (IS31FL3731_WHITE.IsAvailable()) IS31FL3731_WHITE.Start(outputLogs, showDebug);
if (DRV2605.IsAvailable()) DRV2605.Start(outputLogs, showDebug);

if (ADS1015.IsAvailable()) ADS1015.Start(outputLogs, showDebug);
if (ADT7410.IsAvailable()) ADT7410.Start(outputLogs, showDebug);
if (ADXL343.IsAvailable()) ADXL343.Start(outputLogs, showDebug);
if (BMP280.IsAvailable()) BMP280.Start(outputLogs, showDebug);
if (CAP1166.IsAvailable()) CAP1166.Start(outputLogs, showDebug);
if (LSM303D.IsAvailable()) LSM303D.Start(lsm303dHeadingCalibration, lsm303dDisplayRaw, outputLogs, showDebug);
if (MCP9808.IsAvailable()) MCP9808.Start(outputLogs, showDebug);
if (SGP30.IsAvailable()) SGP30.Start(outputLogs, showDebug);
if (SHT31D.IsAvailable()) SHT31D.Start(outputLogs, showDebug);
if (TCS3472.IsAvailable()) TCS3472.Start(tcs3472LEDEnable, outputLogs, showDebug);
if (VCNL4010.IsAvailable()) VCNL4010.Start(outputLogs, showDebug);
if (VEML6075.IsAvailable()) VEML6075.Start(outputLogs, showDebug);

DS18B20.Identify(ds18b20Sensors);
if (DS18B20.IsAvailable()) DS18B20.Start(outputLogs, showDebug);

if (kebap30Enable && (kebap30IPAddress.length > 0)) KEBA_P30.Start(kebap30Enable, kebap30IPAddress, outputLogs, showDebug);

if (TRACKBALL.IsAvailable()) TRACKBALL.Start(outputLogs, showDebug);

if (dashboardEnabled) DASHBOARD.Start(dashboardPort, dashboardMultipleRows, softwareVersion, outputLogs, showDebug);
if (prometheusEnabled) PROMETHEUS.Start(prometheusPort, outputLogs, showDebug);

// ================================================================================
// ================ OLED ROTATING DISPLAY MODE AND RELATED FUNCTIONS ==============
// ================================================================================

// Definition of display modes... (nb. just assigning simple identities, enum-style)
const DISPLAY_MODE_CPU_LOAD_BARS = 1;
const DISPLAY_MODE_SYSTEM_LOAD = 2;
const DISPLAY_MODE_24H_CLOCK = 3;
const DISPLAY_MODE_KOMPIS_FRIEND = 4;
const DISPLAY_MODE_ADS1015 = 5;
const DISPLAY_MODE_ADT7410 = 6;
const DISPLAY_MODE_ADXL343 = 7;
const DISPLAY_MODE_BMP280 = 8;
const DISPLAY_MODE_DS18B20 = 9;
const DISPLAY_MODE_KEBAP30 = 10;
const DISPLAY_MODE_LSM303D = 11;
const DISPLAY_MODE_MCP9808 = 12;
const DISPLAY_MODE_SGP30 = 13;
const DISPLAY_MODE_SHT31D = 14;
const DISPLAY_MODE_TCS3472 = 15;
const DISPLAY_MODE_VCNL4010 = 16;
const DISPLAY_MODE_VEML6075 = 17;

// The actual order of the display modes... (auto-rotating unless locked)
const displayModes = [
    DISPLAY_MODE_24H_CLOCK,
    DISPLAY_MODE_CPU_LOAD_BARS,
    DISPLAY_MODE_MCP9808,
    DISPLAY_MODE_ADT7410,
    DISPLAY_MODE_DS18B20,
    DISPLAY_MODE_SHT31D,
    DISPLAY_MODE_BMP280,
    DISPLAY_MODE_SGP30,
    DISPLAY_MODE_VEML6075,
    DISPLAY_MODE_VCNL4010,
    DISPLAY_MODE_TCS3472,
    DISPLAY_MODE_LSM303D,
    DISPLAY_MODE_ADXL343,
    DISPLAY_MODE_ADS1015,
    DISPLAY_MODE_KEBAP30,
    DISPLAY_MODE_SYSTEM_LOAD,
    DISPLAY_MODE_KOMPIS_FRIEND
];

// Initialize various display mode related settings at startup...
var currentDisplayMode = 0;
var previousDisplayMode = 0xffff;
var displayModeInterval = null;
var displayModeAutoRotate = true;
var displayModeFastRefresh = true;
var displaysTurnedOff = false;

// ====================

function updateDisplayMode()
{
    clearInterval(displayModeInterval);

    var refreshAll = true;
    if (currentDisplayMode == previousDisplayMode) refreshAll = false;

    // ====================

    var moduleIsAvailable = false;

    switch (displayModes[currentDisplayMode])
    {
        case DISPLAY_MODE_CPU_LOAD_BARS:
        case DISPLAY_MODE_SYSTEM_LOAD:
        case DISPLAY_MODE_24H_CLOCK:
        case DISPLAY_MODE_KOMPIS_FRIEND: { moduleIsAvailable = true; break; }
        case DISPLAY_MODE_ADS1015: { if (ADS1015.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_ADT7410: { if (ADT7410.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_ADXL343: { if (ADXL343.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_BMP280: { if (BMP280.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_DS18B20: { if (DS18B20.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_KEBAP30: { if (KEBA_P30.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_LSM303D: { if (LSM303D.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_MCP9808: { if (MCP9808.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_SGP30: { if (SGP30.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_SHT31D: { if (SHT31D.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_TCS3472: { if (TCS3472.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_VCNL4010: { if (VCNL4010.IsAvailable()) moduleIsAvailable = true; break; }
        case DISPLAY_MODE_VEML6075: { if (VEML6075.IsAvailable()) moduleIsAvailable = true; break; }
        default: { break; }
    }

    // ====================

    if (moduleIsAvailable)
    {
        switch (displayModes[currentDisplayMode])
        {
            case DISPLAY_MODE_CPU_LOAD_BARS: { SYSTEM.DisplayLoad(refreshAll); break; }
            case DISPLAY_MODE_SYSTEM_LOAD: { SYSTEM.DisplayInfo(refreshAll); break; }
            case DISPLAY_MODE_24H_CLOCK: { CLOCK.Display(refreshAll); break; }
            case DISPLAY_MODE_KOMPIS_FRIEND: { KOMPIS.Display(refreshAll); break; }
            case DISPLAY_MODE_ADS1015: { ADS1015.Display(refreshAll); break; }
            case DISPLAY_MODE_ADT7410: { ADT7410.Display(refreshAll); break; }
            case DISPLAY_MODE_ADXL343: { ADXL343.Display(refreshAll); break; }
            case DISPLAY_MODE_BMP280: { BMP280.Display(refreshAll); break; }
            case DISPLAY_MODE_DS18B20: { DS18B20.Display(refreshAll); break; }
            case DISPLAY_MODE_KEBAP30: { KEBA_P30.Display(refreshAll); break; }
            case DISPLAY_MODE_LSM303D: { LSM303D.Display(refreshAll); break; }
            case DISPLAY_MODE_MCP9808: { MCP9808.Display(refreshAll); break; }
            case DISPLAY_MODE_SGP30: { SGP30.Display(refreshAll); break; }
            case DISPLAY_MODE_SHT31D: { SHT31D.Display(refreshAll); break; }
            case DISPLAY_MODE_TCS3472: { TCS3472.Display(refreshAll); break; }
            case DISPLAY_MODE_VCNL4010: { VCNL4010.Display(refreshAll); break; }
            case DISPLAY_MODE_VEML6075: { VEML6075.Display(refreshAll); break; }
            default: { break; }
        }
    
        previousDisplayMode = currentDisplayMode;
    }

    // ====================

    if (displayModeAutoRotate) // Display mode auto-rotating
    {
        currentDisplayMode++;
        if (currentDisplayMode == displayModes.length) currentDisplayMode = 0;
        if (moduleIsAvailable) displayModeInterval = setInterval(updateDisplayMode, 5000); // Display mode rotating -> Lower refresh rate
        else displayModeInterval = setInterval(updateDisplayMode, 10); // Module not available -> Switch to the next display mode immediately
    }
    else // Display mode locked
    {
        if (displayModes[currentDisplayMode] == DISPLAY_MODE_KOMPIS_FRIEND) displayModeInterval = setInterval(updateDisplayMode, 250); // Animation @ 4 FPS! :)
        else if (displayModeFastRefresh) displayModeInterval = setInterval(updateDisplayMode, 1000); // -> Higher refresh rate, updating every second
        else displayModeInterval = setInterval(updateDisplayMode, 10000); // -> Lower refresh rate, updating every 30 seconds
    }
}

updateDisplayMode();

// ================================================================================
// =============== TRACKBALL BREAKOUT / INPUT RELATED FUNCTIONALITY ===============
// ================================================================================

var trackballClickCounter = 0;

function pollTrackball() // Periodic trackball polling function (see setInterval() call below)
{
    var status = TRACKBALL.Get();

    if (status != 5) trackballClickCounter = 0; // (this variable is used to detect short and long press clicks)

    if (status > 0)
    {
        if (status == 1 || status == 3) // ===== Left or Up movement detected! =====
        {
            if (!displaysTurnedOff)
            {
                // -> Disable auto-rotate and shift to the previous display mode
                clearInterval(displayModeInterval);
                displayModeAutoRotate = false;
                if (currentDisplayMode == 0) currentDisplayMode = (displayModes.length - 1);
                else currentDisplayMode--;
                previousDisplayMode = 0xffff;
            }
        }
        else if (status == 2 || status == 4) // ===== Right or Down movement detected! =====
        {
            if (!displaysTurnedOff)
            {
                // -> Disable auto-rotate and shift to the next display mode
                clearInterval(displayModeInterval);
                displayModeAutoRotate = false;
                currentDisplayMode++;
                if (currentDisplayMode == displayModes.length) currentDisplayMode = 0;
                previousDisplayMode = 0xffff;
            }
        }
        else if (status == 5) // ===== Click detected! =====
        {
            trackballClickCounter++; // Count any sequential click events in order to detect both short and long press clicks...

            if (trackballClickCounter == 1) // Short press -> Go "home" to our default display mode (turn displays on if they are off) and turn on auto-rotate
            {
                clearInterval(displayModeInterval);
                currentDisplayMode = 0;
                previousDisplayMode = 0xffff;
                displayModeAutoRotate = true;
                if (displaysTurnedOff)
                {
                    displaysTurnedOff = false;
                    SH1107.On();
                    IS31FL3731_RGB.On();
                    IS31FL3731_WHITE.On();
                }
            }
            else if (trackballClickCounter == 3) // Long press -> Turn off/on displays
            {
                if (outputLogs) console.log("Breakout Gardener -> TRACKBALL -> Clicked: \x1b[30;42m Long press detected \x1b[0m.");

                if (displaysTurnedOff)
                {
                    displaysTurnedOff = false;
                    previousDisplayMode = 0xffff;
                    SH1107.On();
                    IS31FL3731_RGB.On();
                    IS31FL3731_WHITE.On();
                }
                else
                {
                    clearInterval(displayModeInterval);
                    displaysTurnedOff = true;
                    SH1107.Off();
                    IS31FL3731_RGB.Off();
                    IS31FL3731_WHITE.Off();
                }
            }
        }

        // And finally, update the display mode...
        if (!displaysTurnedOff) updateDisplayMode();
        // ...and any applicable Touch pHAT LEDs...
        if (CAP1166.IsAvailable()) updateTouchLEDs(0b000000);
    }
}

// ====================

var trackballPollingInterval = null;
if (TRACKBALL.IsAvailable())
{
    trackballPollingInterval = setInterval(pollTrackball, 500); // Start trackball polling, 500 msec interval (nb. this relatively slow polling is mainly to allow time for clearly readable directional swipes)
}

// ================================================================================
// =================== TOUCH PHAT / INPUT RELATED FUNCTIONALITY ===================
// ================================================================================

function updateTouchLEDs(current) // Helper function to pollTouchButtons()
{
    var leds = current;
    if (displaysTurnedOff) leds |= 0b010000;
    else leds &= 0b101111;
    if (displayModeAutoRotate) leds |= 0b001000;
    else leds &= 0b110111;
    if (displayModeFastRefresh) leds |= 0b000100;
    else leds &= 0b111011;
    CAP1166.SetLEDs(leds);
}

function pollTouchButtons() // Periodic touch polling function (see setInterval() call below)
{
    var data = CAP1166.Get();

    if (data[0] > 0) // ===== Touch detected! =====
    {
        if (data[0] & 32) // Button "<" -> Previous display mode
        {
            if (!displayModeAutoRotate)
            {
                clearInterval(displayModeInterval);
                if (currentDisplayMode == 0) currentDisplayMode = (displayModes.length - 1);
                else currentDisplayMode--;
                previousDisplayMode = 0xffff;
            }
        }

        if (data[0] & 1) // Button ">" -> Next display mode
        {
            if (!displayModeAutoRotate)
            {
                clearInterval(displayModeInterval);
                currentDisplayMode++;
                if (currentDisplayMode == displayModes.length) currentDisplayMode = 0;
                previousDisplayMode = 0xffff;
            }
        }

        // ====================

        if (data[0] & 16) // Button "A" -> Turn off/on displays
        {
            if (displaysTurnedOff)
            {
                displaysTurnedOff = false;
                previousDisplayMode = 0xffff;
                SH1107.On();
                IS31FL3731_RGB.On();
                IS31FL3731_WHITE.On();
            }
            else
            {
                clearInterval(displayModeInterval);
                displaysTurnedOff = true;
                SH1107.Off();
                IS31FL3731_RGB.Off();
                IS31FL3731_WHITE.Off();
            }
        }

        if (data[0] & 8) // Button "B" -> Lock the current display mode (i.e. disable auto-rotate)
        {
            clearInterval(displayModeInterval);
            if (displayModeAutoRotate)
            {
                displayModeAutoRotate = false;
                if (currentDisplayMode == 0) currentDisplayMode = displayModes.length - 1;
                else currentDisplayMode--; // We need to do this as updateDisplayMode() increases on every loop in preparation for the next loop...
                previousDisplayMode = currentDisplayMode;
            }
            else displayModeAutoRotate = true;
        }

        if (data[0] & 4) // Button "C" -> Toggle fast/slow update frequency for locked mode
        {
            clearInterval(displayModeInterval);
            if (displayModeFastRefresh) displayModeFastRefresh = false;
            else displayModeFastRefresh = true;
        }
/*
        if (data[0] & 2) // Button "D" -> Currently unassigned...
        {
            clearInterval(displayModeInterval);
        }
*/
        // ====================

        // Update the LEDs if a button was pressed... (otherwise nothing has changed)
        if (data[0] > 0b00000000) updateTouchLEDs(data[1]);
        // And finally, update the display mode...
        if (!displaysTurnedOff) updateDisplayMode();
    }
}

// ====================

var touchPollingInterval = null;
if (CAP1166.IsAvailable())
{
    updateTouchLEDs(0b000000); // Update LEDs to initial state
    touchPollingInterval = setInterval(pollTouchButtons, 250); // Start touch polling, 250 msec interval
}

// ================================================================================
// ===================== STOP ALL MODULES & CLEAN UP ON EXIT ======================
// ================================================================================

function StopAll()
{
    console.log("%s -> INFO -> Terminating: Stopping all modules and cleaning up...", softwareName);

    clearInterval(trackballPollingInterval);
    clearInterval(touchPollingInterval);
    clearInterval(displayModeInterval);

    // Let's stop the modules and add-ons in the opposite
    // order of how we started them, just in case... ;)
    if (prometheusEnabled) PROMETHEUS.Stop();
    if (dashboardEnabled) DASHBOARD.Stop();

    if (TRACKBALL.IsAvailable()) TRACKBALL.Stop();

    if (KEBA_P30.IsAvailable()) KEBA_P30.Stop();

    if (DS18B20.IsAvailable()) DS18B20.Stop();

    if (VEML6075.IsAvailable()) VEML6075.Stop();
    if (VCNL4010.IsAvailable()) VCNL4010.Stop();
    if (TCS3472.IsAvailable()) TCS3472.Stop();
    if (SHT31D.IsAvailable()) SHT31D.Stop();
    if (SGP30.IsAvailable()) SGP30.Stop();
    if (MCP9808.IsAvailable()) MCP9808.Stop();
    if (LSM303D.IsAvailable()) LSM303D.Stop();
    if (CAP1166.IsAvailable()) CAP1166.Stop();
    if (BMP280.IsAvailable()) BMP280.Stop();
    if (ADXL343.IsAvailable()) ADXL343.Stop();
    if (ADT7410.IsAvailable()) ADT7410.Stop();
    if (ADS1015.IsAvailable()) ADS1015.Stop();

    if (DRV2605.IsAvailable()) DRV2605.Stop();
    if (IS31FL3731_WHITE.IsAvailable()) IS31FL3731_WHITE.Stop();
    if (IS31FL3731_RGB.IsAvailable()) IS31FL3731_RGB.Stop();
    if (SH1107.IsAvailable()) SH1107.Stop();
    KOMPIS.Stop();
    CLOCK.Stop();
    SYSTEM.Stop();
	I2C.Stop(resetI2CDevicesOnExit);
}

process.on('SIGINT', (code) => {
    StopAll();
});
process.on('SIGTERM', (code) => {
    StopAll();
});

// ================================================================================
