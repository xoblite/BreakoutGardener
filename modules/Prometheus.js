// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: PROMETHEUS EXPOSURE SERVER ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const http = require('http');

const ADS1015 = require('./ADS1015.js');
const ADT7410 = require('./ADT7410.js');
const ADXL343 = require('./ADXL343.js');
const BMP280 = require('./BMP280.js');
const DS18B20 = require('./DS18B20.js');
const KEBA_P30 = require('./KEBA_P30.js');
const LSM303D = require('./LSM303D.js');
const MCP9808 = require('./MCP9808.js');
const SGP30 = require('./SGP30.js');
const SHT31D = require('./SHT31D.js');
const SYSTEM = require('./System.js');
const TCS3472 = require('./TCS3472.js');
const VCNL4010 = require('./VCNL4010.js');
const VEML6075 = require('./VEML6075.js');

module.exports = {
	Start: Start,
	Stop: Stop,
};

// ================================================================================

// --------------------------------------------------------------------------------------
// For more information about data exposure and visualization using Prometheus & Grafana,
// see https://prometheus.io/ and https://grafana.com/ , respectively.
// --------------------------------------------------------------------------------------

var webServerInstance = null;
var prometheusPort = 9091;
var outputLogs = false, showDebug = false;

// ====================

function Start(port, logs, debug)
{
    if (logs) outputLogs = true;
    if (debug) showDebug = true;

    prometheusPort = port;

    console.log("Breakout Gardener -> INFO -> Starting:\n\n     \x1b[7m Prometheus exposure server listening on port %s. \x1b[0m\n", prometheusPort);

    webServerInstance = http.createServer(function (request, response)
    {
			if (showDebug) console.log("Breakout Gardener -> PROMETHEUS -> HTTP %s %s -> Serving up statistics for Prometheus exposure on port %s...", request.method, request.url, prometheusPort);

			response.writeHead(200, {'Content-Type': 'text/plain'});

			var kv = '';

			// ====================

			if (ADS1015.IsAvailable())
			{
				var ads1015 = ADS1015.Get();
				kv = 'ads1015_s0 ' + ads1015[0].toFixed(2) + '\n';
				kv += 'ads1015_s1 ' + ads1015[1].toFixed(2) + '\n';
				kv += 'ads1015_s2 ' + ads1015[2].toFixed(2) + '\n';
				kv += 'ads1015_s3 ' + ads1015[3].toFixed(2) + '\n';
				kv += 'ads1015_d01 ' + ads1015[4].toFixed(2) + '\n';
				kv += 'ads1015_d23 ' + ads1015[5].toFixed(2) + '\n';
				response.write(kv);
			}

			// ====================

			if (ADT7410.IsAvailable())
			{
				var adt7410 = ADT7410.Get();
				kv = 'adt7410_temperature ' + adt7410[0].toFixed(1) + '\n';
				response.write(kv);
			}

			// ====================

			if (ADXL343.IsAvailable())
			{
				var adxl343 = ADXL343.Get();
				kv = 'adxl343_accelerometer_x ' + adxl343[3].toFixed(2) + '\n';
				kv += 'adxl343_accelerometer_y ' + adxl343[4].toFixed(2) + '\n';
				kv += 'adxl343_accelerometer_z ' + adxl343[5].toFixed(2) + '\n';
				kv += 'adxl343_roll ' + adxl343[6].toFixed(0) + '\n';
				kv += 'adxl343_pitch ' + adxl343[7].toFixed(0) + '\n';
				kv += 'adxl343_taps ' + adxl343[8] + '\n';
				response.write(kv);
			}

			// ====================

			if (BMP280.IsAvailable())
			{
				var bmp280 = BMP280.Get();
				kv = 'bmp280_temperature ' + bmp280[0].toFixed(1) + '\n';
				kv += 'bmp280_pressure ' + bmp280[1].toFixed(0) + '\n';
				response.write(kv);
			}

			// ====================

			if (DS18B20.IsAvailable())
			{
				var ds18b20 = DS18B20.Get();

				kv = '';
				for (var n=0; n<ds18b20.length; n++)
				{
					kv += 'ds18b20_temperature_' + (n+1) + ' ' + ds18b20[n] + '\n';
				}
				response.write(kv);
            }
            
			// ====================

			if (KEBA_P30.IsAvailable())
			{
				var kebap30 = KEBA_P30.Get();
				kv = 'keba_p30_state ' + kebap30[0] + '\n';
				kv += 'keba_p30_power ' + kebap30[1] + '\n';
				kv += 'keba_p30_power_percentage_of_maximum ' + kebap30[2] + '\n';
				kv += 'keba_p30_energy_transferred ' + kebap30[3] + '\n';
				kv += 'keba_p30_u1 ' + kebap30[4] + '\n';
				kv += 'keba_p30_u2 ' + kebap30[5] + '\n';
				kv += 'keba_p30_u3 ' + kebap30[6] + '\n';
				kv += 'keba_p30_i1 ' + kebap30[7] + '\n';
				kv += 'keba_p30_i2 ' + kebap30[8] + '\n';
				kv += 'keba_p30_i3 ' + kebap30[9] + '\n';
				response.write(kv);
			}

			// ====================

			if (LSM303D.IsAvailable())
			{
				var lsm303d = LSM303D.Get();
				kv = 'lsm303d_accelerometer_x ' + lsm303d[3].toFixed(2) + '\n';
				kv += 'lsm303d_accelerometer_y ' + lsm303d[4].toFixed(2) + '\n';
				kv += 'lsm303d_accelerometer_z ' + lsm303d[5].toFixed(2) + '\n';
				kv += 'lsm303d_magnetometer_x ' + lsm303d[9].toFixed(2) + '\n';
				kv += 'lsm303d_magnetometer_y ' + lsm303d[10].toFixed(2) + '\n';
				kv += 'lsm303d_magnetometer_z ' + lsm303d[11].toFixed(2) + '\n';
				kv += 'lsm303d_roll ' + lsm303d[12].toFixed(0) + '\n';
				kv += 'lsm303d_pitch ' + lsm303d[13].toFixed(0) + '\n';
				kv += 'lsm303d_heading ' + lsm303d[14].toFixed(0) + '\n';
				response.write(kv);
			}

			// ====================

			if (MCP9808.IsAvailable())
			{
				var mcp9808 = MCP9808.Get();
				kv = 'mcp9808_temperature ' + mcp9808[0].toFixed(1) + '\n';
				response.write(kv);
			}

			// ====================

			if (SGP30.IsAvailable())
			{
				var spg30 = SGP30.Get();
				kv = 'sgp30_tvoc ' + spg30[0] + '\n';
				kv += 'sgp30_co2eq ' + spg30[1] + '\n';
				kv += 'sgp30_ethanol ' + spg30[2] + '\n';
				kv += 'sgp30_hydrogen ' + spg30[3] + '\n';
				kv += 'sgp30_iaq_level ' + spg30[4] + '\n';
				response.write(kv);
            }
            
			// ====================

			if (SHT31D.IsAvailable())
			{
				var sht31d = SHT31D.Get();
				kv = 'sht31d_humidity ' + sht31d[0].toFixed(0) + '\n';
				kv += 'sht31d_temperature ' + sht31d[1].toFixed(1) + '\n';
				response.write(kv);
			}

			// ====================

			// SYSTEM (always available)
			var cpuLoad = SYSTEM.GetCPULoad();
			var cpuTemperature = SYSTEM.GetCPUTemperature();
			var memoryUsageInPercent = SYSTEM.GetMemoryUsageInPercent();
			kv = 'system_cpu_load_all_cores ' + cpuLoad.AllCores.toFixed(0) + '\n';
			for (var n=0; n<cpuLoad.Cores.length; n++)
			{
				kv += 'system_cpu_load_core_' + (n+1) + ' ' + cpuLoad.Cores[n].toFixed(1) + '\n';
			}
			kv += 'system_cpu_temperature ' + cpuTemperature.toFixed(1) + '\n';
			kv += 'system_memory_usage_in_percent ' + memoryUsageInPercent.toFixed(0) + '\n';
			response.write(kv);

			// ====================

			if (TCS3472.IsAvailable())
			{
				var tcs3472 = TCS3472.Get();
				kv = 'tcs3472_lux ' + tcs3472[5] + '\n';
				kv += 'tcs3472_temperature ' + tcs3472[4] + '\n';
				kv += 'tcs3472_clear ' + tcs3472[0] + '\n';
				kv += 'tcs3472_red ' + tcs3472[1] + '\n';
				kv += 'tcs3472_green ' + tcs3472[2] + '\n';
				kv += 'tcs3472_blue ' + tcs3472[3] + '\n';
				response.write(kv);
			}

			// ====================

			if (VCNL4010.IsAvailable())
			{
				var vcnl4010 = VCNL4010.Get();
				kv = 'vcnl4010_lux ' + vcnl4010[0] + '\n';
				kv += 'vcnl4010_proximity ' + vcnl4010[1] + '\n';
				response.write(kv);
			}

			// ====================

			if (VEML6075.IsAvailable())
			{
				var veml6075 = VEML6075.Get();
				kv = 'veml6075_uva ' + veml6075[0].toFixed(0) + '\n';
				kv += 'veml6075_uvb ' + veml6075[1].toFixed(0) + '\n';
				kv += 'veml6075_uv_index ' + veml6075[2].toFixed(1) + '\n';
				response.write(kv);
			}

			// ====================

			response.end();

		}).listen(prometheusPort);

		webServerInstance.keepAliveTimeout = 1000; // Set the socket keep-alive timeout to 1 second (read: less than typical Prometheus scraping intervals)
}

function Stop() { webServerInstance.close(); }

// ================================================================================
