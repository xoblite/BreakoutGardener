// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: DASHBOARD WEB SERVER ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const http = require('http');

const ADS1015 = require('./ADS1015.js');
const ADT7410 = require('./ADT7410.js');
const ADXL343 = require('./ADXL343.js');
const BMP280 = require('./BMP280.js');
const CAP1166 = require('./CAP1166.js');
const DRV2605 = require('./DRV2605.js');
const DS18B20 = require('./DS18B20.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');
const KEBA_P30 = require('./KEBA_P30.js');
const LSM303D = require('./LSM303D.js');
const MCP9808 = require('./MCP9808.js');
const SGP30 = require('./SGP30.js');
const SHT31D = require('./SHT31D.js');
const SH1107 = require('./SH1107.js');
const TCS3472 = require('./TCS3472.js');
const VCNL4010 = require('./VCNL4010.js');
const VEML6075 = require('./VEML6075.js');

const TRACKBALL = require('./Trackball.js');

const SYSTEM = require('./System.js');
const CLOCK = require('./Clock.js');

module.exports = {
	Start: Start,
	Stop: Stop,
};

// ================================================================================

var webServerInstance = null;
var dashboardPort = 8080;
var dashboardMultipleRows = true;
var softwareVersion = '';
var outputLogs = false, showDebug = false;

// ====================

function Start(port, multiple, version, logs, debug)
{
    if (logs) outputLogs = true;
    if (debug) showDebug = true;

    dashboardPort = port;
    dashboardMultipleRows = multiple;
    softwareVersion = version;

    console.log("Breakout Gardener -> INFO -> Starting:\n\n     \x1b[7m Dashboard server listening on port %s. \x1b[0m\n", dashboardPort);

    webServerInstance = http.createServer(function (request, response)
    {
        var fs = require('fs');

        if (request.url.includes(".png"))
        {
            var file = process.cwd() + '/bg.png';
            if (fs.existsSync(file))
            {
                var image = fs.readFileSync(file);
                response.writeHead(200, {'Content-Type': 'image/png'});
                response.end(image, 'binary');
            }
            else
            {
                // console.log("%s -> INFO -> PNG background image requested, but not available at the pre-configured path [%s].", MultipleButtons.name, MultipleButtons.serverImagePath);
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.end();
            }
        }
        else if (request.url.includes(".jpg"))
        {
            var file = process.cwd() + '/bg.jpg';
            if (fs.existsSync(file))
            {
                var image = fs.readFileSync(file);
                response.writeHead(200, {'Content-Type': 'image/jpg'});
                response.end(image, 'binary');
            }
            else
            {
                // console.log("%s -> INFO -> JPG background image requested, but not available at the pre-configured path [%s].", MultipleButtons.name, MultipleButtons.serverImagePath);
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.end();
            }
        }
        else if (request.url.includes(".css"))
        {
            response.writeHead(200, {'Content-Type': 'text/css'});
            response.write("\nhtml { width: 100%; height: 100%; background-color: #222222; background-image: url('bg.jpg'); background-repeat: no-repeat; background-size: 100% 100%; color: #ffffff; font-family: \"San Francisco\", \"Roboto\", \"Helvetica Neue\", \"Arial\", sans-serif; font-size: small; text-align: center; }\na:link, a:visited, a:hover, a:active, a:focus {color: #ffffff;}");
            response.write("\ndiv.main { background-color: #000000; width: auto; height: auto; position: absolute; top: 30px; left: 30px; padding-top: 20px; padding-bottom: 20px; padding-left: 50px; padding-right: 50px; border-radius: 12px; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19); }");
            response.write("\ndiv.reload { position: absolute; top: 30px; left: 82px; padding: 10px; background-color: #114411; }");
            response.write("\ndiv.visualize { position: absolute; top: 30px; left: 162px; padding: 10px; background-color: #111144; }");
            response.write("\ndiv.shop { position: absolute; top: 30px; right: 82px; padding: 10px; background-color: #441111; }");
            response.write("\ndiv.popup { visibility: hidden; opacity: 0; transition: opacity 1s; position: absolute; top: 22px; right: 152px; padding: 10px; background-color: #771111; text-align: left; }");
            response.write("\nspan.title { font-size: 350%; font-weight: bold; color: #ffffff; }");
            response.write("\nspan.highlightG { font-weight: bold; color: #228822; }");
            response.write("\nspan.highlightR { font-weight: bold; color: #bb1111; }");
            response.write("\nspan.highlightB { font-weight: bold; color: #3333cc; }");
            response.write("\ntable { margin-left: auto; margin-right: auto; text-align: left; }");
            response.write("\ntd { background-color: #111111; padding: 20px; font-size: small; white-space: nowrap; vertical-align: top; } td:hover {background-color: #080808; }");
            response.write("\ntd.system { background-color: #222222; color: #ffffff; }");
            response.write("\ntd.disabled { color: #222222; }");
            response.write("\ntd.addons { background-color: #222222; color: #555555; }");
            response.write("\n");
            response.end();
        }
        else if (request.url.includes(".ico"))
        {
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.end();
        }
        else
        {
            if (showDebug) console.log("Breakout Gardener -> DASHBOARD -> HTTP %s %s -> Serving up dashboard web page on port %s...", request.method, request.url, dashboardPort);

            response.writeHead(200, {'Content-Type': 'text/html'});
//            response.write("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<title>Breakout Gardener</title>\n<meta charset=\"UTF-8\">\n<meta http-equiv=\"refresh\" content=\"5\" >\n<style>");
            response.write("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<title>Breakout Gardener</title>\n<meta charset=\"UTF-8\">\n<link rel=\"stylesheet\" type=\"text/css\" href=\"bg.css\">");

            response.write("\n<script type=\"text/javascript\">\n   function reloadPage() { location.reload(); }\n");
//            response.write("   function popupShops() { document.getElementById(\"popup\").style.visibility = \"visible\"; document.getElementById(\"popup\").style.opacity = \"1\"; }\n</script>\n");
            response.write("   function popupShops() { var e = document.getElementById(\"popup\"); if (e.style.visibility == \"visible\") { e.style.opacity = \"0\"; e.style.visibility = \"hidden\"; } else { e.style.visibility = \"visible\"; e.style.opacity = \"1\"; }}\n</script>\n");

            response.write("</head>\n<body>\n");

            // ====================

            response.write("<div class=\"main\">\n<span class=\"title\">Breakout Gardener</span>\n");

            response.write("   <div class=\"reload\"><a href=\"javascript:reloadPage();\">Reload</a></div>");
            response.write("\n   <div class=\"visualize\"><a href=\"/\" target=\"_blank\" onmouseover=\"javascript:event.target.port=3000\">Visualize</a></div>"); // -> Open Grafana [host:3000] in a new window/tab
            response.write("\n   <div class=\"shop\"><a href=\"javascript:popupShops();\">Shop</a></div>");
            response.write("\n   <div id=\"popup\" class=\"popup\">&#x25cf; <a href=\"https://shop.pimoroni.com/collections/breakout-garden\" target=\"_blank\">Pimoroni</a> (UK)<br>&#x25cf; <a href=\"https://www.adafruit.com/?q=I2C%20Breakout\" target=\"_blank\">Adafruit Industries</a> (US)</div>");

            // ### TO-DO / POSSIBLE FUTURE ENHANCEMENT: OPEN GRAFANA IN AN EMBEDDED IFRAME INSTEAD OF IN A NEW TAB/WINDOW ? ###
            // response.write("\n   <div id=\"grafana\" class=\"grafana\"><iframe src=\"http://google.se/\" width=\"1680\" height=\"720\" marginheight=\"0\" frameborder=\"no\" scrolling=\"yes\"># ...ERROR... #</iframe></div>");

            response.write("\n<p><table>\n");

            // ====================

            var columnSpanning = 10;
            if (!dashboardMultipleRows) columnSpanning = 20;

            var cpuLoad = SYSTEM.GetCPULoad();
            var cpuTemperature = SYSTEM.GetCPUTemperature();
            var memoryUsageInPercent = SYSTEM.GetMemoryUsageInPercent();
            if (cpuLoad.Cores.length == 4) response.write("<tr><td colspan=\"" + columnSpanning + "\" class=\"system\"><b><u>SYSTEM</u></b>&emsp;&ensp;CPU load per core:&nbsp;&nbsp;&nbsp;&#x2460; " + cpuLoad.Cores[0].toFixed(1) + "%&nbsp;&nbsp;&nbsp;&#x2461; " + cpuLoad.Cores[1].toFixed(1) + "%&nbsp;&nbsp;&nbsp;&#x2462; " + cpuLoad.Cores[2].toFixed(1) + "%&nbsp;&nbsp;&nbsp;&#x2463; " + cpuLoad.Cores[3].toFixed(1) + "%&nbsp;&nbsp;&nbsp;&#x2502;&nbsp;&nbsp;&nbsp;Across all cores:&nbsp;&nbsp;&nbsp;" + cpuLoad.AllCores.toFixed(0) + "%&nbsp;&nbsp;&nbsp;&#x2502;&nbsp;&nbsp;&nbsp;CPU temperature:&nbsp;&nbsp;&nbsp;" + cpuTemperature.toFixed(1) + " °C&nbsp;&nbsp;&nbsp;&#x2502;&nbsp;&nbsp;&nbsp;Memory usage:&nbsp;&nbsp;&nbsp;" + memoryUsageInPercent.toFixed(0) + "%&nbsp;&nbsp;&nbsp;&#x2502;&nbsp;&nbsp;&nbsp;Timestamp:&nbsp;&nbsp;&nbsp;" + CLOCK.Get() + "</td></tr>\n<tr>\n");
            else response.write("<tr><td colspan=\"" + columnSpanning + "\" class=\"system\"><b><u>SYSTEM</u></b>&emsp;&ensp;CPU load across all cores:&nbsp;&nbsp;&nbsp;" + cpuLoad.AllCores.toFixed(0) + "%&nbsp;&nbsp;&nbsp;&#x2502;&nbsp;&nbsp;&nbsp;CPU temperature:&nbsp;&nbsp;&nbsp;" + cpuTemperature.toFixed(1) + " °C&nbsp;&nbsp;&nbsp;&#x2502;&nbsp;&nbsp;&nbsp;Memory usage:&nbsp;&nbsp;&nbsp;" + memoryUsageInPercent.toFixed(0) + "%&nbsp;&nbsp;&nbsp;&#x2502;&nbsp;&nbsp;&nbsp;Timestamp:&nbsp;&nbsp;&nbsp;" + CLOCK.Get() + "</td></tr>\n");

            response.write("<tr>\n");

            // ====================

            if (ADS1015.IsAvailable())
            {
                var ads1015 = ADS1015.Get();
                response.write("   <td><b><u>ADS1015</u></b><br><br>S0:&nbsp;&nbsp;&nbsp;" + ads1015[0].toFixed(2) + " V<br>S1:&nbsp;&nbsp;&nbsp;" + ads1015[1].toFixed(2) + " V<br>S2:&nbsp;&nbsp;&nbsp;" + ads1015[2].toFixed(2) + " V<br>S3:&nbsp;&nbsp;&nbsp;" + ads1015[3].toFixed(2) + " V<br><br>D01:&nbsp;&nbsp;&nbsp;" + ads1015[4].toFixed(2) + " V<br>D23:&nbsp;&nbsp;&nbsp;" + ads1015[5].toFixed(2) + " V</td>");    
            }
            else response.write("   <td class=\"disabled\"><b><u>ADS1015</u></b>");

            // ====================

            if (ADT7410.IsAvailable())
            {
                var adt7410 = ADT7410.Get();
                response.write("\n   <td><b><u>ADT7410</u></b><br><br>Temperature:<br>" + adt7410[0].toFixed(1) + " °C</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>ADT7410</u></b>");

            // ====================

            if (ADXL343.IsAvailable())
            {
                var adxl343 = ADXL343.Get();
                response.write("\n   <td><b><u>ADXL343</u></b><br><br>Accelerometer:<br>X " + adxl343[3].toFixed(2) + "<br>Y " + adxl343[4].toFixed(2) + "<br>Z " + adxl343[5].toFixed(2) + "<br>Roll " + adxl343[6].toFixed(0) + "<br>Pitch " + adxl343[7].toFixed(0) + "<br><br>Actions:");
                if (adxl343[8] > 0)
                {
                    if (adxl343[8] == 1) response.write("<br>Single tap<br>detected!</td>");
                    else if (adxl343[8] == 2) response.write("<br>Double tap<br>detected!</td>");
                    else if (adxl343[8] == 3) response.write("<br>Free fall<br>detected!</td>");
                }
                else response.write("<br>None</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>ADXL343</u></b>");

            // ====================

            if (BMP280.IsAvailable())
            {
                var bmp280 = BMP280.Get();
                response.write("\n   <td><b><u>BMP280</u></b><br><br>Pressure:<br>" + bmp280[1].toFixed(0) + " hPa<br><br>Temperature:<br>" + bmp280[0].toFixed(1) + " °C</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>BMP280</u></b>");

            // ====================

            if (CAP1166.IsAvailable())
            {
                var cap1166 = CAP1166.Get();

                var touch = '';
                if (cap1166[0] & 32) touch += '&#x25cf;';
                else touch += '&#x25cb;';
                if (cap1166[0] & 16) touch += '&#x25cf;';
                else touch += '&#x25cb;';
                if (cap1166[0] & 8) touch += '&#x25cf;';
                else touch += '&#x25cb;';
                if (cap1166[0] & 4) touch += '&#x25cf;';
                else touch += '&#x25cb;';
                if (cap1166[0] & 2) touch += '&#x25cf;';
                else touch += '&#x25cb;';
                if (cap1166[0] & 1) touch += '&#x25cf;';
                else touch += '&#x25cb;';

                var leds = '';
                if (cap1166[1] & 32) leds += '&#x25cf;';
                else leds += '&#x25cb;';
                if (cap1166[1] & 16) leds += '&#x25cf;';
                else leds += '&#x25cb;';
                if (cap1166[1] & 8) leds += '&#x25cf;';
                else leds += '&#x25cb;';
                if (cap1166[1] & 4) leds += '&#x25cf;';
                else leds += '&#x25cb;';
                if (cap1166[1] & 2) leds += '&#x25cf;';
                else leds += '&#x25cb;';
                if (cap1166[1] & 1) leds += '&#x25cf;';
                else leds += '&#x25cb;';

                response.write("\n   <td><b><u>CAP1166</u></b><br><br>Touch:<br>" + touch + "<br><br>LEDs:<br>" + leds + "</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>CAP1166</u></b>");

            // ====================

            if (DRV2605.IsAvailable())
            {
                response.write("\n   <td><b><u>DRV2605</u></b><br><br>Device<br>enabled</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>DRV2605</u></b>");

            // ====================

            if (DS18B20.IsAvailable())
            {
                var ds18b20 = DS18B20.Get();
                if (ds18b20.length > 1) response.write("\n   <td><b><u>DS18B20</u></b><br><br>Indoors:<br>" + ds18b20[0] + " °C<br><br>Outdoors:<br>" + ds18b20[1] + " °C</td>");
                else response.write("\n   <td><b><u>DS18B20</u></b><br><br>Temperature:<br>" + ds18b20[0] + " °C</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>DS18B20</u></b>");

            // ====================

            if (IS31FL3731_RGB.IsAvailable())
            {
                const DISPLAY_WIDTH = 5, DISPLAY_HEIGHT = 5;
                var is31fl3731_rgb = IS31FL3731_RGB.Get();
                var tempString = "\n   <td><b><u>IS31FL3731 (RGB)</u></b><br><br>";
                for (var y=0; y<DISPLAY_HEIGHT; y++)
                {
                    // Convert the pixel RGB hexadecimal value (0xRRGGBB) to a HTML color string (#RRGGBB)...
                    for (var x=0; x<DISPLAY_WIDTH; x++)
                    {
                        tempString += "<font color=\"#" + (0x1000000 + is31fl3731_rgb[(y*DISPLAY_WIDTH)+x]).toString(16).slice(1) + "\">&#x25a0;</font>";
                    }
                    tempString += "<br>";
                }
                tempString += "</td>";
                response.write(tempString);
            }
            else response.write("   <td class=\"disabled\"><b><u>IS31FL3731 (RGB)</u></b>");

            // ====================

            if (IS31FL3731_WHITE.IsAvailable())
            {
                const DISPLAY_WIDTH = 11, DISPLAY_HEIGHT = 7;
                var is31fl3731_white = IS31FL3731_WHITE.Get();
                var tempString = "\n   <td><b><u>IS31FL3731 (W)</u></b><br><br>";
                for (var y=0; y<DISPLAY_HEIGHT; y++)
                {
                    // Convert the pixel intensity value (0-255) to a HTML color string (#NNNNNN)...
                    for (var x=0; x<DISPLAY_WIDTH; x++)
                    {
                        var intensity = (0x100 + is31fl3731_white[(y*DISPLAY_WIDTH)+x]).toString(16).slice(1);
                        tempString += "<font color=\"#" + intensity + intensity + intensity + "\">&#x25a0;</font>";
                    }
                    tempString += "<br>";
                }
                tempString += "</td>";
                response.write(tempString);
            }
            else response.write("   <td class=\"disabled\"><b><u>IS31FL3731 (W)</u></b>");

            // ====================

            if (KEBA_P30.IsAvailable())
            {
                var kebap30 = KEBA_P30.Get();
                var state = '';
                if (kebap30[0] == 0) state = 'Starting';
                if (kebap30[0] == 1) state = 'Unplugged<br>(not ready)';
                if (kebap30[0] == 2) state = '<font color=\"#0066cc\">Plugged</font><br>(not charging)';
                if (kebap30[0] == 3) state = '<font color=\"#008800\">Charging</font>';
                if (kebap30[0] == 4) state = '<font color=\"#aa0000\">Error</font>';
                if (kebap30[0] == 5) state = '<font color=\"#aa8800\">Interrupted</font>';
                if (kebap30[0] == 9) state = '(Checking)';

                response.write("\n   <td><b><u>KEBA P30</u></b><br><br>State:<br>" + state + "<br><br>Power:<br>" + kebap30[1] + " kW (" + kebap30[2] + "%)<br><br>Energy transferred:<br>" + kebap30[3] + " kWh");
                response.write("\n<br><br>Per phase:<br>" + kebap30[4] + " / " + kebap30[5] + " / " + kebap30[6] + " V<br>" + kebap30[7] + " / " + kebap30[8] + " / " + kebap30[9] + " A</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>KEBA P30</u></b>");

            // ====================

            // ### MOVE TO THE NEXT ROW IF DASHBOARD MULTIPLE ROW DISPLAY MODE IS ENABLED ###
            if (dashboardMultipleRows) response.write("</tr>\n<tr>\n");

            // ====================

            if (LSM303D.IsAvailable())
            {
                var lsm303d = LSM303D.Get();
                response.write("\n   <td><b><u>LSM303D</u></b><br><br>Accelerometer:<br>X " + lsm303d[3].toFixed(2) + "<br>Y " + lsm303d[4].toFixed(2) + "<br>Z " + lsm303d[5].toFixed(2) + "<br>Roll " + lsm303d[12].toFixed(0) + "<br>Pitch " + lsm303d[13].toFixed(0) + "<br><br>Magnetometer:<br>X " + lsm303d[9].toFixed(2) + "<br>Y " + lsm303d[10].toFixed(2) + "<br>Z " + lsm303d[11].toFixed(2) + "<br>Heading " + lsm303d[14].toFixed(0) + "°</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>LSM303D</u></b>");

            // ====================

            if (MCP9808.IsAvailable())
            {
                var mcp9808 = MCP9808.Get();
                response.write("\n   <td><b><u>MCP9808</u></b><br><br>Temperature:<br>" + mcp9808[0].toFixed(1) + " °C</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>MCP9808</u></b>");

            // ====================

            if (SGP30.IsAvailable())
            {
                var sgp30 = SGP30.Get();

                var iaq = '';
                if (sgp30[0] > 2200) iaq = "<font color=\"#aa0000\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&nbsp;&nbsp;<b>5</b></font><br>Unhealthy";
                else if (sgp30[0] > 660) iaq = "<font color=\"#aa4400\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&nbsp;&nbsp;<b>4</b></font><br>Poor";
                else if (sgp30[0] > 220) iaq = "<font color=\"#aa8800\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&nbsp;&nbsp;<b>3</b></font><br>Moderate";
                else if (sgp30[0] > 65) iaq = "<font color=\"#008866\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&nbsp;&nbsp;<b>2</b></font><br>Good";
                else iaq = "<font color=\"#008800\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&nbsp;&nbsp;<b>1</b></font><br>Excellent";

                response.write("\n   <td><b><u>SGP30</u></b><br><br>TVOC:<br>" + sgp30[0].toFixed(0) + " PPB<br>CO<sub>2</sub>eq:<br>" + sgp30[1].toFixed(0) + " PPM<br><br>Ethanol (C<sub>2</sub>H<sub>6</sub>O):<br>" + sgp30[2].toFixed(0) + " PPM<br>Hydrogen (H<sub>2</sub>):<br>" + sgp30[3].toFixed(0) + " PPM<br><br>" + iaq + "</td>\n");
            }
            else response.write("   <td class=\"disabled\"><b><u>SGP30</u></b>");

            // ====================

            if (SH1107.IsAvailable())
            {
                response.write("\n   <td><b><u>SH1107</u></b><br><br>Device<br>enabled</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>SH1107</u></b>");

            // ====================

            if (SHT31D.IsAvailable())
            {
                var sht31d = SHT31D.Get();
                response.write("\n   <td><b><u>SHT31D</u></b><br><br>Humidity:<br>" + sht31d[0].toFixed(0) + " %<br><br>Temperature:<br>" + sht31d[1].toFixed(1) + " °C</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>SHT31D</u></b>");

            // ====================

            response.write("   <td class=\"disabled\"><b><u>SOUNDS</u></b><br><br>(upcoming<br>module)");

            // ====================

            if (TCS3472.IsAvailable())
            {
                var tcs3472 = TCS3472.Get();
                var rgb = (tcs3472[1] << 16) + (tcs3472[2] << 8) + tcs3472[3];
                var color = (0x1000000 + rgb).toString(16).slice(1);
                response.write("\n   <td><b><u>TCS3472</u></b><br><br>Light:&nbsp;&nbsp;&nbsp;" + tcs3472[5] + " lux<br>Temp:&nbsp;&nbsp;&nbsp;" + tcs3472[4] + " °K<br><br>Clear:&nbsp;&nbsp;&nbsp;" + tcs3472[0] + "<br>Red:&nbsp;&nbsp;&nbsp;" + tcs3472[1] + "<br>Green:&nbsp;&nbsp;&nbsp;" + tcs3472[2] + "<br>Blue:&nbsp;&nbsp;&nbsp;" + tcs3472[3] + "<br><br><font color=\"#" + color + "\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;</font><br>#" + color + "</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>TCS3472</u></b>");

            // ====================

            if (TRACKBALL.IsAvailable())
            {
                response.write("\n   <td><b><u>TRACKBALL</u></b><br><br>Device<br>enabled</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>TRACKBALL</u></b>");

            // ====================

            if (VCNL4010.IsAvailable())
            {
                var vcnl4010 = VCNL4010.Get();
                response.write("\n   <td><b><u>VCNL4010</u></b><br><br>Light:<br>" + vcnl4010[0] + " lux<br><br>Proximity:<br>" + vcnl4010[1] + "</td>");
            }
            else response.write("   <td class=\"disabled\"><b><u>VCNL4010</u></b>");

            // ====================

            if (VEML6075.IsAvailable())
            {
                var veml6075 = VEML6075.Get();

                var uvi = '';
                if (veml6075[2] > 10.9) uvi = "<font color=\"#6600aa\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;</font><br>Extreme";
                else if (veml6075[2] > 7.9) uvi = "<font color=\"#aa0000\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;</font><br>Very High";
                else if (veml6075[2] > 5.9) uvi = "<font color=\"#aa4400\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;</font><br>High";
                else if (veml6075[2] > 2.9) uvi = "<font color=\"#aa8800\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;</font><br>Moderate";
                else uvi = "<font color=\"#008800\">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;</font><br>Low";

                response.write("\n   <td><b><u>VEML6075</u></b><br><br>UVA:<br>" + veml6075[0].toFixed(0) + "<br>UVB:<br>" + veml6075[1].toFixed(0) + "<br><br>UV Index:<br>" + veml6075[2].toFixed(1) + "<br><br>" + uvi + "</td>\n");
            }
            else response.write("   <td class=\"disabled\"><b><u>VEML6075</u></b>");

            // ====================

            var tempString = '';
            tempString = '</tr>\n</table>\n<p><a href=\"http://breakouts.xoblite.net/\">Breakout Gardener</a> ' + softwareVersion + ', running on <a href=\"https://nodejs.org/\">Node.js&reg;</a> ' + process.version + ' and using the <a href=\"https://github.com/fivdi/i2c-bus\">i2c-bus</a> library. &copy; 2018-2019 <a href=\"http://breakouts.xoblite.net/\">@xoblite</a>. All trademarks are property of their respective owners.\n';
            response.write(tempString);

            response.write("</div>\n</body>\n</html>");
            response.end();
        }
    }).listen(dashboardPort);

    webServerInstance.keepAliveTimeout = 3000; // Set the socket keep-alive timeout to 3 seconds (should be more than enough for our usage pattern)
}

function Stop() { webServerInstance.close(); }

// ================================================================================
