<img src="http://xoblite.net/breakouts/breakouts.png" width="100%" height="100%">

*PREVIEW RELEASE == REQUEST FOR EARLY FEEDBACK :wink:*

**Breakout Gardener** is a framework application based on [Node.js®](https://nodejs.org/) using the [i2c-bus](https://github.com/fivdi/i2c-bus) library.
The name is a pun on the Pimoroni [Breakout Garden](https://shop.pimoroni.com/collections/breakout-garden), as the project started out as a way to present various sensor data on that system's OLED display. As geeky projects often do, however, it eventually grew into something bigger, with more elaborate interworking...

Breakout Gardener currently supports the following devices and sensors (I2C unless otherwise noted) through modules:

- **ADS1015**: Texas Instruments ADS1015 Analog-To-Digital Converter ([example](https://shop.pimoroni.com/products/enviro-phat))
- **ADT7410**: Analog Devices ADT7410 Digital Temperature Sensor ([example](https://www.adafruit.com/product/4089)) _(preliminary/untested)_
- **BMP280**: Bosch Sensortec BMP280 Barometric Pressure Sensor ([example](https://shop.pimoroni.com/products/enviro-phat))
- **CAP1166**: Microchip Technology CAP1166 Capacitive Touch Controller ([example](https://shop.pimoroni.com/products/touch-phat))
- **DS18B20**: Maxim Integrated DS18B20 Digital Thermometer ([1-Wire](https://pinout.xyz/pinout/1_wire)) ([example](https://www.adafruit.com/product/381))
- **IS31FL3731**: Integrated Silicon Solution Inc (ISSI) IS31FL3731 Matrix LED Driver ([example](https://shop.pimoroni.com/products/5x5-rgb-matrix-breakout))
- **LSM303D**: STMicroelectronics LSM303D eCompass 3D Accelerometer and 3D Magnetometer ([example](https://shop.pimoroni.com/products/enviro-phat))
- **MCP9808**: Microchip Technology MCP9808 Digital Temperature Sensor ([example](https://www.adafruit.com/product/1782))
- **SH1107**: Display Future / Sino Wealth SH1107 Dot Matrix (128x128 pixel) Mono OLED Driver/Controller ([example](https://shop.pimoroni.com/products/1-12-oled-breakout))
- **TCS3472**: ams TCS3472 Color Light Sensor ([example](https://shop.pimoroni.com/products/enviro-phat))
- **VEML6075**: Vishay Semiconductors VEML6075 UVA and UVB Light Sensor ([example](https://www.adafruit.com/product/3964))

It also supports additional display modes through its **SYSTEM**, **CLOCK** and **KOMPIS** modules, data [exposure](https://prometheus.io/) (and related [visualization](https://grafana.com/)) through its **PROMETHEUS** module, as well as a HTML5/CSS3 browser **DASHBOARD** module (see image above) that provides an overview of the current status and readings of all sensors and devices available on the system (nb. the "Shop" button is there just to support the tinkering community's favourite suppliers; [Pimoroni (UK)](https://pimoroni.com/) and [Adafruit Industries (US)](https://www.adafruit.com/) (no affiliation to either, I just like their products and geeky dedication to the cause :wink:)).

Anyway, without further ado:

*- Install Node.js*<br>*- Clone this repository*<br>*- Install i2c-bus*<br>*- Run!*

Enjoy! :sunglasses:

...and if you do, please Star, and perhaps also tag me on Twitter ([@xoblite](https://twitter.com/xoblite)) or Instagram ([@xoblitedotnet](https://www.instagram.com/xoblitedotnet/)). Thanks! :smile:

BR//KHH \[xoblite\]

========================

_THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE._

© 2018-2019 Karl-Henrik Henriksson / [breakouts.xoblite.net](http://breakouts.xoblite.net/). All trademarks are property of their respective owners.
