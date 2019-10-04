// ============================================================================================
// --- BREAKOUT GARDENER :: MODULES :: KOMPIS ---
// (c) 2018-2019 Karl-Henrik Henriksson - breakouts*xoblite.net - http://breakouts.xoblite.net/
// ============================================================================================

const i2c = require('i2c-bus'); // -> https://github.com/fivdi/i2c-bus
const SH1107 = require('./SH1107.js');
const IS31FL3731_RGB = require('./IS31FL3731_RGB.js');
const IS31FL3731_WHITE = require('./IS31FL3731_WHITE.js');

module.exports = {
	Start: Start,
	Stop: Stop,
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

function Log()
{
    if (outputLogs) console.log("Breakout Gardener -> KOMPIS -> Hello again... =]");
}

// ====================

function DrawEyes(EYE_LEFT, EYE_RIGHT) // Helper function to Display()
{
    for (var y=0; y<7; y++)
    {
        SH1107.DisplaySetPosition(4, y+4);
        for (var x=0; x<7; x++) SH1107.DrawBlock(EYE_LEFT[((y*8)+x)]);
        SH1107.DisplaySetPosition(68, y+4);
        for (var x=0; x<7; x++) SH1107.DrawBlock(EYE_RIGHT[((y*8)+x)]);
    }    
}

function DrawMouth(MOUTH) // Helper function to Display()
{
    for (var y=0; y<2; y++)
    {
        SH1107.DisplaySetPosition(0, 13+y);
        for (var x=0; x<16; x++) SH1107.DrawBlock(MOUTH[((y*17)+x)]);
    }    
}

// ====================

var animationFrame = 1;
var friendMood = 0;
var previousFriendMood = 0xffff;

const FRIEND_NEUTRAL = 1, FRIEND_BLINK = 2, FRIEND_LEFT = 3, FRIEND_RIGHT = 4;
const FRIEND_HAPPY = 5, FRIEND_SAD = 6, FRIEND_ANGRY = 7;

function Display(refreshAll) // Show our little animated friend "Kompis"! :)
{
    if (refreshAll)
    {
        animationFrame = 1;
        previousFriendMood = 0xffff;
    }

    friendMood = FRIEND_NEUTRAL;

    switch (animationFrame % 40)
    {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
        { friendMood = FRIEND_NEUTRAL; break; }
        case 10: 
        { friendMood = FRIEND_BLINK; break; }

        case 11:
        case 12:
        case 13:
        case 14:
        case 15:
        case 16:
        case 17:
        case 18:
        case 19:
        { friendMood = FRIEND_NEUTRAL; break; }
        case 20: 
        { friendMood = FRIEND_BLINK; break; }

        case 21:
        case 22:
        case 23:
        case 24:
        { friendMood = FRIEND_NEUTRAL; break; }

        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
        case 30:
        case 31:
        { friendMood = FRIEND_LEFT; break; }

        case 32:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 38:
        { friendMood = FRIEND_RIGHT; break; }
        
        case 39:
        { friendMood = FRIEND_BLINK; break; }

        default:
        { friendMood = FRIEND_NEUTRAL; break; }
    }

    // ====================

	if (SH1107.IsAvailable())
	{
        if (refreshAll)
        {
            SH1107.Off();
            SH1107.Clear();
        }

        const EYE_NEUTRAL       = "2111113 1a###b1 1#####1 1#####1 1#####1 1d###c1 5111114";
        const EYE_BLINK         = "0000000 0000000 0000000 0000000 1111111 1111111 5111114";
        const EYE_SMALLER       = "0000000 2111113 1a###b1 1#####1 1#####1 1d###c1 5111114";
        const EYE_HAPPY         = "0000000 0000000 2111113 1#####1 0000000 0000000 0000000";
        const EYE_SAD_LEFT      = "0000000 0000000 0000000 0000000 0000000 2111111 1111111";
        const EYE_SAD_RIGHT     = "0000000 0000000 0000000 0000000 0000000 1111113 1111111";
        const EYE_ANGRY_LEFT    = "0000000 1111113 1111111 1111111 1111111 0000000 0000000";
        const EYE_ANGRY_RIGHT   = "2111111 1111111 1111111 1111111 1111111 0000000 0000000";

        var MOUTH_HAPPY         = '1190000000000811 5111111111111114';
        var MOUTH_SAD           = '2111111111111113 1160000000000711';

        if (friendMood != previousFriendMood)
        {
            switch (friendMood)
            {
                case FRIEND_BLINK: { DrawEyes(EYE_BLINK, EYE_BLINK); break; }
                case FRIEND_LEFT: { DrawEyes(EYE_NEUTRAL, EYE_SMALLER); break; }
                case FRIEND_RIGHT: { DrawEyes(EYE_SMALLER, EYE_NEUTRAL); break; }
                case FRIEND_HAPPY: { DrawEyes(EYE_HAPPY, EYE_HAPPY); break; }
                case FRIEND_SAD: { DrawEyes(EYE_SAD_LEFT, EYE_SAD_RIGHT); break; }
                case FRIEND_ANGRY: { DrawEyes(EYE_ANGRY_LEFT, EYE_ANGRY_RIGHT); break; }
                default: { DrawEyes(EYE_NEUTRAL, EYE_NEUTRAL); break; }
            }

            switch (friendMood)
            {
                case FRIEND_HAPPY: { DrawMouth(MOUTH_HAPPY); break; }
                case FRIEND_SAD: { DrawMouth(MOUTH_SAD); break; }
                default: { DrawMouth(MOUTH_HAPPY); break; }
            }
        }
	}

	// ====================

	if (IS31FL3731_RGB.IsAvailable())
	{
        // Occasionally display a symbol representative of our geeky little friend... <3
        const heart = [0x000000, 0xaa0000, 0x000000, 0xaa0000, 0x000000,
                       0xaa0000, 0xaa0000, 0xaa0000, 0xaa0000, 0xaa0000,
                       0xaa0000, 0xaa0000, 0xaa0000, 0xaa0000, 0xaa0000,
                       0x000000, 0xaa0000, 0xaa0000, 0xaa0000, 0x000000,
                       0x000000, 0x000000, 0xaa0000, 0x000000, 0x000000 ];
        const pause = [0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
                       0x000000, 0x000000, 0x000022, 0x000000, 0x000000,
                       0x000000, 0x220000, 0x000000, 0x002200, 0x000000,
                       0x000000, 0x000000, 0x222200, 0x000000, 0x000000,
                       0x000000, 0x000000, 0x000000, 0x000000, 0x000000 ];

        if (friendMood == FRIEND_BLINK) IS31FL3731_RGB.Display(heart);
        else
        {
            switch (animationFrame % 4)
            {
                case 1: { pause[7] = 0x222200; pause[11] = 0x000022; pause[13] = 0x220000; pause[17] = 0x002200; break; }
                case 2: { pause[7] = 0x002200; pause[11] = 0x222200; pause[13] = 0x000022; pause[17] = 0x220000; break; }
                case 3: { pause[7] = 0x220000; pause[11] = 0x002200; pause[13] = 0x222200; pause[17] = 0x000022; break; }
                default: { pause[7] = 0x000022; pause[11] = 0x220000; pause[13] = 0x002200; pause[17] = 0x222200; break; }
            }
            IS31FL3731_RGB.Display(pause);
        }
    }

	// ====================

	if (IS31FL3731_WHITE.IsAvailable())
	{
        // Sometimes, "Kompis" can duplicate himself onto several displays... ;)
        const wNeutral = [ 20,20,35,50,35,20,35,50,35,20,20,
                           20,20,50,50,50,20,50,50,50,20,20,
                           20,20,35,50,35,20,35,50,35,20,20,
                           20,20,20,20,20,20,20,20,20,20,20,
                           20,50,35,20,20,20,20,20,35,50,20,
                           20,50,50,50,50,50,50,50,50,50,20,
                           20,20,35,50,50,50,50,50,35,20,20 ];
        const wBlink   = [ 20,20,20,20,20,20,20,20,20,20,20,
                           20,20,35,35,35,20,35,35,35,20,20,
                           20,20,50,50,50,20,50,50,50,20,20,
                           20,20,20,20,20,20,20,20,20,20,20,
                           20,50,35,20,20,20,20,20,35,50,20,
                           20,50,50,50,50,50,50,50,50,50,20,
                           20,20,35,50,50,50,50,50,35,20,20 ];
        const wLeft    = [ 20,20,50,35,35,20,50,35,35,20,20,
                           20,20,50,50,35,20,50,50,35,20,20,
                           20,20,50,35,35,20,50,35,35,20,20,
                           20,20,20,20,20,20,20,20,20,20,20,
                           20,50,35,20,20,20,20,20,35,50,20,
                           20,50,50,50,50,50,50,50,50,50,20,
                           20,20,35,50,50,50,50,50,35,20,20 ];
        const wRight   = [ 20,20,35,35,50,20,35,35,50,20,20,
                           20,20,35,50,50,20,35,50,50,20,20,
                           20,20,35,35,50,20,35,35,50,20,20,
                           20,20,20,20,20,20,20,20,20,20,20,
                           20,50,35,20,20,20,20,20,35,50,20,
                           20,50,50,50,50,50,50,50,50,50,20,
                           20,20,35,50,50,50,50,50,35,20,20 ];

        if (friendMood == FRIEND_BLINK) IS31FL3731_WHITE.Display(wBlink);
        else if (friendMood == FRIEND_LEFT) IS31FL3731_WHITE.Display(wLeft);
        else if (friendMood == FRIEND_RIGHT) IS31FL3731_WHITE.Display(wRight);
        else IS31FL3731_WHITE.Display(wNeutral);
    }

	// ====================

    animationFrame++;
    if (animationFrame > 40) animationFrame = 1;
    previousFriendMood = friendMood;

    if (refreshAll) Log();
}

// ================================================================================
