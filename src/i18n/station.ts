// Texts of the home page's console (src/scripts/station/station.js). English is the reference; French says the same
// thing, in the same shape (its type is the English one's). Facts about the extension must match the app's README on
// master. The legal lines the console shares with the intro come from ui.ts.
import { ui, type Lang } from './ui';

const en = {
  skip: '[ skip ]',
  skipLabel: 'Skip the arrival',
  soundOff: '[ sound off ]',
  soundOn: '[ sound on ]',
  soundLabel: 'Sound',
  motionOff: '[ animations off ]',
  motionOn: '[ animations on ]',
  motionLabel: 'Animations',
  vol: 'VOLUME',
  soundWord: 'SOUND',
  on: 'ON',
  off: 'OFF',
  muted: 'SOUND OFF',
  audio: 'AUDIO',
  legends: {
    vol: 'VOLUME',
    sound: 'ON / OFF',
    volt: 'VOLTAGE',
    amp: 'CURRENT',
    temp: 'TEMP',
    load: 'LOAD',
    bass: 'BASS',
    mid: 'MID',
    treble: 'TREBLE',
    filter: 'FILTER',
    mono: 'MONO',
    echo: 'ECHO',
    line: 'LINE',
    bayA: 'BAY A',
    bayB: 'BAY B',
    bayC: 'BAY C',
    bayD: 'BAY D',
  },
  volHint: 'Drag or scroll to turn',
  volHintTouch: 'Drag round to turn',
  soundHintOn: 'Click to switch on',
  soundHintOff: 'Click to switch off',
  soundHintOnTouch: 'Tap to switch on',
  soundHintOffTouch: 'Tap to switch off',
  power: 'MAIN POWER',
  powerOff: 'OFF',
  powerOn: 'ON',
  powerHint: 'Click to switch on',
  powerHintTouch: 'Tap to switch on',
  powerLine: 'Press the main power button to start the station',
  powerAuto: 'Auto start in',
  powerSec: 's',
  powerStarting: 'Starting up…',
  powerOffHint: 'Click to switch off',
  powerOffTouch: 'Tap to switch off',
  powerOnLabel: 'Main power: on. Switch the station off',
  legal2:
    'Images: the WARDOGS computer, faction emblems and items © BULKHEAD / Team17 — shown to present this project to them, removed on request.',
  intro2: ui.en['intro.legal2'],
  enter: 'ENTER CODE',
  menuHead: 'MAIN MENU',
  keypadHint: '▼ KEYPAD',
  sections: 'Sections',
  keypadName: 'Keypad',
  keyClear: 'CLEAR',
  keyEnter: 'ENTER',
  keyClearLabel: 'Clear',
  keyEnterLabel: 'Enter',
  back: 'BACK',
  backKey: 'ESC',
  backLabel: 'Back to the console',
  acquisition: 'ACQUISITION',
  statusLink: 'LINK OK',
  active: 'ACTIVE',
  error: 'ERROR',
  hack: {
    tower: 'TOWER 04',
    locked: 'LOCKED',
    hacking: 'HACKING',
    granted: 'ACCESS GRANTED',
    taken: 'TAKEN',
    said: 'Tower 04 hacked: access granted',
  },
  codeAccepted: 'Code {code} accepted',
  codeAcceptedTo: 'Code {code} accepted: {to}',
  codeRefused: 'Code {code} refused',
  callIncoming: 'INCOMING CALL',
  callAnswer: 'Click to answer',
  callAnswerTouch: 'Tap to answer',
  callSay: 'Incoming call: click the phone to answer',
  callSayTouch: 'Incoming call: tap the phone to answer',
  callMissedSay: 'Missed call',
  // the call: its state (ENTER CODE, the box, the phone's tag), the phone's hint, the box's buttons, what screen
  // readers hear, what the station says
  callConnected: 'CONNECTED',
  callHangHint: 'Click to hang up',
  callHangHintTouch: 'Tap to hang up',
  callJoin: 'Join the Discord',
  callHangUp: 'Hang up',
  callConnectedSay: 'Call connected:',
  callEndedSay: 'Call ended',
  callLines: [
    'This is the station. Code received.',
    'Thanks for supporting Wardogs Companion, a project made by players, for players.',
    'The Discord is open: come and join us.',
  ],
  // what to do (in the menu's heading)
  menuHint: 'CLICK A SECTION, OR TYPE ITS CODE ON THE KEYPAD',
  menuHintTouch: 'TAP A SECTION, OR TYPE ITS CODE ON THE KEYPAD',
  // the posts' tags: name, state, how to use it (ENTER CODE's name is its screen's, enter)
  postScreenHint: 'Click to read',
  postScreenHintTouch: 'Tap to read',
  postCodeState: 'READY',
  postCodeHint: "Type a section's code on the keypad",
  postPhone: 'DISCORD',
  postPhoneState: 'ONLINE',
  postPhoneHint: 'Click to join the server',
  postPhoneHintTouch: 'Tap to join the server',
  newTab: 'opens in a new tab',
  postAudio: 'AUDIO',
  postAudioHint: 'Turn the knob, flip the switch',
  postKeypad: 'KEYPAD',
  postKeypadHint: "Type a section's code, then ENTER",
  postRadar: 'RADAR',
  postRadarNone: 'NO FACTION',
  postRadarHintPeople: 'Click an echo: join a faction, or open a card',
  postRadarHintPeopleTouch: 'Tap an echo: join a faction, or open a card',
  echoFaction: 'FACTION',
  echoJoined: 'JOINED',
  echoJoin: 'Click to join',
  echoLeave: 'Click to leave',
  echoJoinTouch: 'Tap to join',
  echoLeaveTouch: 'Tap to leave',
  radarGroupPeople: 'Radar: factions and people',
  factionsGroup: 'Factions',
  factionJoinedSay: 'Faction {name} joined',
  factionLeftSay: 'Faction {name} left',
  cardOpen: 'Click to open the card',
  cardOpenTouch: 'Tap to open the card',
  cardClose: 'Close the card',
  cards: {
    biggy: {
      kicker: 'OPERATOR',
      label: "Biggy's card",
      rows: [
        ['ROLE', 'CREATOR · DEVELOPER'],
        ['UNIT', 'WARDOGS COMPANION'],
        ['ON DUTY', 'SINCE 2026'],
      ],
      text: "A WARDOGS player, I built Wardogs Companion to improve the experience of streamers and players: the streamer's loadout, live, without leaving the stream.",
      links: {
        twitch: "Biggy's channel",
        discord: 'The community server',
        github: "Biggy's GitHub profile",
      },
    },
  },
  chartSignal: 'SIGNAL',
  chartVisited: 'VISITED',
  socials: { discord: ['The community server', 'Join the Discord'], github: ["The site's source code"] },
  menu: [
    ['EXTENSION', 'The Twitch extension', '273'],
    ['SCREENSHOTS', '{shots} views', '226'],
    ['DISCORD', 'Join the server', '112'],
    ['ABOUT', 'The project', '008'],
  ],
  // the pages read on the reading screen, as lists of blocks (PAGE_BLOCKS: a page more, one entry more; a kind
  // of block more, one maker more): its hero, then modules (a title, a width out of 12, a body of pieces:
  // PIECES), and parts (a heading band the page's header line leads to; their modules numbered in them). The
  // extension's (a developer must understand precisely what it is and what it does): its hero, the author's
  // own texts, the name written Wardogs Companion, its state coming soon (no review named, no date); the rest,
  // the app's own README on master, as written there, only shortened; the figures, from it
  onPage: 'On this page',
  shotPrev: 'Previous screenshot',
  shotNext: 'Next screenshot',
  shotZoom: 'Enlarge the screenshot',
  figZoom: 'Enlarge the picture',
  routeShow: 'See the details ▾',
  routeHide: 'Hide the details ▴',
  shotZoomShort: 'Enlarge',
  zoomClose: 'Close',
  zoomKeys: ['← → to browse', 'Esc to close'],
  zoomSwipe: ['Slide the screenshot to look around it'],
  shotSay: 'Screenshot {n} of {t}, {side}: {title}',
  shotTeams: 'Team colors',
  shotTeamSay: '{title} in {team} colors',
  shotPending: 'Screenshot coming soon',
  pageSay: '{page} page open',
  shotMore: 'In detail',
  shotLang: '',
  shotMoreSay: 'Read about it on the {page} page: {part}',
  pages: {
    extension: [
      [
        'hero',
        {
          kicker: 'Twitch extension for WARDOGS',
          title: 'Wardogs Companion',
          note: 'Community project, unofficial, not affiliated with BULKHEAD, Team17 or Twitch.',
          lead: "Viewers see the streamer's loadout, right on the stream.",
          text: 'In WARDOGS, the loadout is everything a player takes into battle: weapons, attachments, gear, backpack. The streamer prepares theirs in an editor on Twitch, and viewers open it with one click, over the video. Nothing is read from the game: the streamer enters everything.',
          status: ['Coming soon', 'Not on Twitch yet: a beta first, then open to all.'],
          pic: [
            'captures/01-viewer-panel-valkyra.webp',
            [1308, 799],
            'The viewer panel in Valkyra colors: the loadout shared by BiggyQLF on the Bakurani map, its weapons, backpack and parachute.',
            'What a viewer sees after clicking the icon, here in the Valkyra team colors.',
          ],
          follow: ['Follow the release on Discord', 'discord'],
          more: ["See what's planned", 'roadmap'],
        },
      ],
      [
        'mod',
        {
          title: 'In three steps',
          w: 12,
          body: [
            [
              'steps',
              [
                [
                  'The streamer prepares their loadout',
                  "In the extension's editor, on Twitch: they pick their weapons and attachments, pack their backpack, set their team and map.",
                  ['See the editor', 'streamer'],
                ],
                [
                  'They publish it',
                  'One click on "Publish changes": the panel updates for every viewer, live. Those who arrive later see the latest loadout published.',
                ],
                [
                  'Viewers open it',
                  'An icon on the video: one click, and the whole loadout shows, item by item, without leaving the stream.',
                  ['See the panel', 'viewers'],
                ],
              ],
            ],
          ],
        },
      ],
      ['part', 'viewers', 'Viewer panel', 'Viewer panel'],
      [
        'mod',
        {
          title: 'The icon on the video',
          w: 12,
          kind: 'strip',
          flip: true,
          fig: [
            ['launcher-icon.webp', 'The Wardogs Companion icon that viewers click to open the panel.', 72],
          ],
          body: [
            [
              'p',
              "A small icon on the video: one click opens the panel. Each viewer puts the icon where it doesn't get in the way, moves the panel by its title bar and resizes it from a corner, from the small player to full screen.",
            ],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'panel',
          title: 'The panel',
          file: 'captures/01-viewer-panel-manticore.webp',
          size: [1308, 799],
          alt: 'The viewer panel in Manticore colors: the loadout shared by BiggyQLF on the Bakurani map, its weapons, backpack and parachute.',
          lead: "The streamer's whole loadout, laid out as in the game.",
          items: [
            ['Shared by', "the streamer's name, team and emblem.", [36, 138, 306, 94]],
            ['The map', 'chosen by the streamer.', [797, 132, 253, 100]],
            [
              'Loadout value',
              "the total of the items' in-game prices, not real money.",
              [1052, 132, 252, 100],
            ],
            ['Tabs', 'Equipment and Classes; Presets and Unlocks coming soon.', [28, 240, 600, 54, 'l']],
            [
              'Weapons',
              'with their magazine, optic, grip, muzzle device and ammunition.',
              [36, 318, 640, 282, 'l'],
            ],
            ['Backpack and parachute', '', [714, 318, 542, 246]],
            ['Backpack contents', 'laid out as in the game, with quantities.', [714, 584, 542, 166, 'l']],
            ['Updated', 'the date and time of the last publish.', [36, 756, 240, 34, 'l']],
            [
              'Further down',
              'gear, vehicles, quick slots and weight: just scroll.',
              [1284, 294, 22, 456, 'tr'],
            ],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'cards',
          title: 'Item cards',
          flip: true,
          file: 'captures/04-item-card.webp',
          size: [1308, 898],
          alt: "The card of the AR Multi-Caliber Suppressor, opened from the weapon's muzzle slot: weight, level, advantages, drawbacks and characteristics.",
          lead: 'Hover an item: a short card opens. Click: the full card, which stays open.',
          items: [
            ['The hovered item', "here the weapon's suppressor.", [582, 523, 96, 130, 'r']],
            ['Name and family', 'here an attachment.', [86, 160, 489, 115, 'ir']],
            ['Weight and a class level', 'here 0.72 kg and Assault level 21.', [86, 277, 489, 76, 'ir']],
            ['Advantages', 'what the item improves.', [86, 357, 489, 255, 'ir']],
            ['Drawbacks', 'what it worsens.', [86, 615, 489, 120, 'ir']],
            ['Characteristics', 'such as the room it takes in the backpack.', [86, 738, 489, 107, 'ir']],
            ['An open card', 'a click outside closes it.', [86, 848, 489, 44, 'ir']],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'classes',
          title: 'Classes',
          file: 'illustrations/viewer-classes.webp',
          size: [1248, 412],
          alt: "The streamer's progression: WARDOGS level 145, and the level of each of the six classes.",
          lead: 'The second tab: the levels the streamer enters in the editor.',
          items: [
            ['WARDOGS level', "the streamer's overall level.", [314, 39, 620, 123]],
            [
              'The six classes',
              'Assault, Medic, Recon, Support, Driver and Pilot, each with its level.',
              [8, 206, 1232, 198],
            ],
          ],
        },
      ],
      ['part', 'streamer', 'Streamer editor', 'Streamer editor'],
      [
        'anno',
        {
          id: 'editor',
          title: 'The editor',
          wide: true,
          file: 'captures/06-streamer-editor.webp',
          size: [1899, 909],
          alt: "The streamer's editor: the display name, the team, the map and the loadout value, the weapons' slots, the backpack, and at the foot the panel's status and the publish button.",
          lead: 'The streamer opens it on Twitch, before or during their live stream. The top band shows what viewers will see: name, team, map and value.',
          items: [
            ['Display name', 'the one viewers will see.', [112, 128, 462, 78]],
            ['Team', 'Lonestar, Valkyra or Manticore: the panel takes its color.', [928, 128, 418, 78]],
            ['Map', 'picked from the list.', [1388, 128, 234, 78]],
            [
              'Loadout value',
              "calculated automatically from the items' in-game prices.",
              [1650, 128, 240, 78],
            ],
            ['Slots', 'click one to choose its item.', [28, 290, 984, 545, 'l']],
            ['Backpack', 'add an item, drag it into place, turn it, duplicate it.', [1048, 290, 822, 545]],
            [
              'Panel status',
              'up to date, or changes not shared yet; and the link to clear the published loadout.',
              [18, 850, 170, 46, 'r'],
            ],
            [
              'Publish',
              'on Twitch, the "Publish changes" button (the capture, taken outside Twitch, shows "Update preview").',
              [1597, 848, 286, 52, 'l'],
            ],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'picker',
          title: 'Choosing an item',
          flip: true,
          fit: true,
          h: 560,
          file: 'captures/07-item-picker.webp',
          size: [814, 870],
          alt: 'The item picker: a search field, the categories with their number of items, the sub-categories, and the list of items with their weight.',
          lead: 'Clicking a slot opens this picker with only the items that go in it; in the backpack, "Add item" also lists, greyed out with the reason, those that cannot go in right now.',
          items: [
            ['Search', 'by name.', [33, 130, 738, 62, 'l']],
            [
              'Categories',
              'with their number of items, depending on the slot (here the backpack).',
              [33, 208, 738, 170, 'l'],
            ],
            ['Sub-categories', 'to narrow down.', [33, 420, 650, 72, 'l']],
            ['No item', 'to empty a slot.', [33, 527, 90, 46, 'l']],
            [
              'The list',
              'picture, name and main facts (here the weight); + adds the item.',
              [33, 595, 738, 272, 'l'],
            ],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'backpack',
          title: 'Gear, vehicles and backpack',
          wide: true,
          file: 'captures/08-backpack-editing.webp',
          size: [1899, 909],
          alt: 'The editor while a magazine is being moved in the backpack and turned a quarter; on the left the gear and vehicles, under the backpack the weight gauge.',
          lead: "The streamer picks their gear and vehicles, drags items into the backpack's grid and can turn them, as in WARDOGS.",
          items: [
            ['Gear', 'helmet, body armor and tactical vest.', [28, 288, 984, 226, 'l']],
            ['Vehicles', 'one ground, one air.', [28, 538, 386, 228, 'l']],
            ['An item being moved', 'turned a quarter with a right-click.', [1305, 372, 122, 250]],
            ['Quantities', "with − and +, within the game's limits.", [1594, 442, 112, 30, 'r']],
            [
              'Weight',
              'calculated automatically: here about 58.3 kg, very heavy (some items have no weight yet).',
              [1052, 772, 812, 58],
            ],
          ],
        },
      ],
      [
        'mod',
        {
          title: 'Quick slots',
          w: 12,
          kind: 'strip',
          flip: true,
          fig: [
            [
              'editor-quick.webp',
              "The editor's quick slots: the items and, under each, its keyboard key.",
              520,
            ],
          ],
          body: [
            [
              'p',
              'Seven quick slots: each points to an item in the backpack, with its keyboard key, which the streamer can change.',
            ],
          ],
        },
      ],
      ['part', 'essentials', 'Key facts', 'Key facts'],
      [
        'mod',
        {
          title: 'In figures',
          w: 12,
          kind: 'stats-mod',
          body: [
            [
              'stats',
              [
                ['273', 'Items'],
                ['3', 'Teams', 'Lonestar · Valkyra · Manticore'],
                ['3', 'Maps', 'Bakurani · Ozeti · Zestafona'],
                ['6', 'Classes', 'Assault · Medic · Recon · Support · Driver · Pilot'],
                ['2', 'Languages', 'English · French'],
              ],
            ],
          ],
        },
      ],
      [
        'mod',
        {
          title: "The game's 273 items",
          w: 12,
          kind: 'cat2',
          body: [
            [
              'p',
              'The items the streamer picks from in the editor, each with its picture, in-game price and effects, its size, and its weight when the game gives it (not yet for most ammunition or the vehicles), in English and in French.',
            ],
            [
              'cat',
              [
                [
                  'Weapons',
                  '30',
                  '25 primary (assault rifles, SMGs, shotguns, machine guns, tactical and precision rifles, bow), 5 sidearms',
                ],
                ['Launchers', '4'],
                [
                  'Specialist items',
                  '37',
                  'medical 7, construction and supplies 7, tactical 13, reconnaissance 4, vehicle tools 4, batteries 2',
                ],
                ['Vehicles', '21', 'ground and air'],
                ['Gear', '25', '6 helmets, 6 body armors, 3 tactical vests, 2 parachutes, 8 backpacks'],
                ['Attachments', '122', '21 optics, 17 grips and bipods, 44 muzzle devices, 40 magazines'],
                ['Ammunition', '34'],
              ],
            ],
            [
              'small',
              'WARDOGS, its names, logos and visuals, item and vehicle pictures included, belong to BULKHEAD and Team17.',
            ],
          ],
        },
      ],
      [
        'mod',
        {
          title: 'Good to know',
          w: 12,
          body: [
            [
              'facts',
              [
                [
                  'Everything goes through Twitch',
                  'The extension has no server of its own: Twitch keeps the loadout and sends it to viewers.',
                ],
                [
                  'No data collected',
                  "The extension only keeps, in each viewer's own browser, where they put the icon and the panel, and its size.",
                ],
                [
                  'Checked loadouts',
                  'The extension checks every loadout when the streamer publishes it and when a viewer opens it: unknown items are removed, malformed data is rejected.',
                ],
              ],
            ],
          ],
        },
      ],
      ['part', 'roadmap', "What's coming", "What's coming"],
      [
        'mod',
        {
          title: 'Roadmap',
          w: 12,
          kind: 'route-mod',
          body: [
            [
              'route',
              {
                here: [
                  'You are here',
                  'Today',
                  ['The viewer panel', 'The streamer editor', "The game's 273 items", 'English and French'],
                  'Coming soon',
                ],
                step: 'Step {n}',
                stops: [
                  [
                    'The launch',
                    [
                      'A beta with a few streamers first, to gather their feedback, then the extension open to all on Twitch.',
                      'A phone version: the panel easy to read and use on a phone, and on very small players.',
                    ],
                  ],
                  [
                    'For streamers',
                    [
                      'Chat commands such as !extension or !site that introduce the extension to viewers.',
                      'An Edit button on the panel, seen by the streamer only.',
                      'Presets: several loadouts the streamer prepares ahead, which viewers can browse too.',
                    ],
                  ],
                  [
                    'A richer panel',
                    [
                      'A short presentation of WARDOGS, for viewers who discover the game.',
                      'Richer item cards.',
                      'A rank badge for the WARDOGS level.',
                      'New languages, added easily.',
                    ],
                  ],
                  [
                    'Based on feedback',
                    [
                      'Unlocks tab: what the streamer has unlocked (vehicles, gear…).',
                      'Stats tab: last and best match, best weapon, headshots… Only if an authorized data source makes it possible.',
                      "The streamer's game settings and ingots, if they want to show them.",
                      'Chat commands for the streamer and their moderators: change the team color, the map…',
                      'The editor on the website, as well as on Twitch.',
                    ],
                  ],
                ],
                note: ['An idea, some feedback? Share it on Discord.'],
                links: ['discord'],
              },
            ],
          ],
        },
      ],
    ],
    // the project's page (ABOUT, the bar's last tab; not the reading screen's own page: an overview there
    // could confuse, the screen opens the extension): what the project is, where it stands, its pieces
    // (the extension and the Discord leading to their sections, the source code to GitHub, this site), its rights. Its sentences, wherever they exist, the site's own: the
    // station's call ("a project made by players, for players", "the Discord is open"), the site's lead (the
    // app's README), its footer, its intro's credit line
    // DISCORD's page: the community, the server (its readout, what one finds there, the invitation), a thank-you. What one finds there: help (the project's support goes through
    // Discord), ideas, the news
    discord: [
      [
        'hero',
        {
          kicker: 'Wardogs Companion · Community',
          title: 'Join the community.',
          join: 'discord',
          text: "The project's Discord server: the place to get help with the extension, share your ideas and hear the news first.",
          status: ['Online', 'Free access · permanent invitation', 'ready'],
        },
      ],
      [
        'mod',
        {
          title: "What you'll find",
          w: 12,
          body: [
            [
              'facts',
              [
                ['Help', 'With the extension: questions, installation, problems.'],
                ['Your ideas', 'A place to share your ideas and feedback on the project.'],
                ['The news first', 'Starting with the release of the extension.'],
              ],
            ],
          ],
        },
      ],
      [
        'mod',
        {
          title: 'Thank you',
          w: 12,
          kind: 'note',
          body: [
            [
              'p',
              'Thanks to everyone who follows the project, gives feedback and shares ideas: you are why it keeps moving forward.',
            ],
          ],
        },
      ],
    ],
    about: [
      [
        'hero',
        {
          kicker: 'Wardogs Companion · Community project',
          title: 'A project made by players, for players.', // (its own title: the extension's page is the one named Wardogs Companion, the app's name)
          text: 'An unofficial community project around WARDOGS, created by Biggy: a Twitch extension, a Discord server and this site.',
          contact: 'biggy',
          states: [
            ['The extension', 'Coming soon'],
            ['This site', 'Beta'],
            ['The Discord', 'Online', 'ready'],
            ['Game visuals', 'Pending approval'],
          ],
        },
      ],
      ['part', 'project', 'Project', 'The project'],
      [
        'mod',
        {
          title: "What it's made of",
          w: 12,
          body: [
            [
              'trio',
              [
                [
                  'The Twitch extension',
                  "The streamer's loadout, opened by their viewers right on the stream.",
                  'extension',
                ],
                ['The Discord server', "The project's help, ideas and news.", 'discord'],
                ['The source code', "The site's code is public, on GitHub.", null, 'github'],
                [
                  'This site',
                  "This station is the site's menu: pick a section, or type its code on the keypad.",
                ],
              ],
            ],
            [
              'small',
              'The extension is built with React, TypeScript and Vite; the Barlow typefaces are shipped with it.',
            ],
          ],
        },
      ],
      ['part', 'rights', 'Rights', 'Rights'],
      [
        'mod',
        {
          title: 'Rights and visuals',
          w: 12,
          kind: 'cols',
          body: [
            [
              'p',
              'Wardogs Companion is an independent, unofficial community project. It is not affiliated with BULKHEAD, Team17 or Twitch. WARDOGS and its names, logos and visuals belong to their respective rights holders.',
            ],
            [
              'p',
              "The game's footage and pictures on this site are shown to present this project to BULKHEAD, and removed on request.",
            ],
          ],
        },
      ],
    ],
    // the screenshots, in the extension's two sides, apart (so that one knows which panel one is looking at),
    // named as the extension's page names them: the viewer panel (what viewers see on the stream), then the
    // streamer editor; each capture a name, a short caption (what to see in it) and the picture's text, for
    // screen readers. Their pictures: captures of the extension, cut out (the media's captures/, named in this
    // order); the first in the three team colours ({team}: the team shown); one not there yet is said to be
    // coming. Each side, the part of the EXTENSION page about it
    screenshots: [
      [
        'mod',
        {
          title: 'Screenshots',
          h1: true,
          w: 12,
          kind: 'shots-mod',
          body: [
            [
              'shots',
              [
                [
                  'Viewer panel',
                  'What viewers see on the stream',
                  [
                    [
                      '01-viewer-panel-{team}.webp',
                      'The panel',
                      "The streamer's loadout, in the colors of their team. Choose a team to see it change.",
                      "Viewer panel of Wardogs Companion in {team} colors, showing BiggyQLF's loadout on the Bakurani map.",
                    ],
                    [
                      '02-backpack.webp',
                      'Backpack contents',
                      "The backpack's contents, laid out in its grid as in the game.",
                      "Viewer panel at the backpack's contents: weapons, ammunition, grenades and medical items in the backpack's grid, the sidearm beside it.",
                    ],
                    [
                      '03-gear-vehicles.webp',
                      'Gear and vehicles',
                      'Helmet, body armor, tactical vest, the vehicles the streamer uses and the quick slots.',
                      "Viewer panel at the gear and vehicles: a level 4 helmet and armor, a large tac vest, the Flakpanzer Gepard and the Havoc, the loadout's weight and the quick slots.",
                    ],
                    [
                      '04-item-card.webp',
                      'An item card',
                      'Hover over an item for a short card; click it for the full card, which stays open.',
                      'Item card of the AR Multi-Caliber Suppressor open over the viewer panel: its weight, Assault level 21, advantages, drawbacks and characteristics.',
                    ],
                    [
                      '05-classes.webp',
                      'Classes',
                      "The streamer's WARDOGS level and the level of each of the six classes.",
                      'Classes tab of the viewer panel: WARDOGS level 145 and the levels of Assault, Medic, Recon, Support, Driver and Pilot.',
                    ],
                  ],
                  'viewers',
                ],
                [
                  'Streamer editor',
                  'Where the streamer builds the loadout',
                  [
                    [
                      '06-streamer-editor.webp',
                      'The editor',
                      'The streamer builds the loadout here and publishes it to the panel.',
                      'Streamer editor of Wardogs Companion: the display name, team, map and loadout value above the weapons and their attachments, the backpack and the publish button.',
                    ],
                    [
                      '07-item-picker.webp',
                      'Choosing an item',
                      'The items that fit the slot, by category, with a search.',
                      'Item picker opened from the backpack: a search field, the item categories with their counts and the first items, the First Aid Kit and the Adrenaline Pen.',
                    ],
                    [
                      '08-backpack-editing.webp',
                      'Packing the backpack',
                      'Items are dragged into the grid and turned as in the game.',
                      "Streamer editor's backpack: a magazine being dragged and turned a quarter.",
                    ],
                  ],
                  'streamer',
                ],
              ],
            ],
          ],
        },
      ],
    ],
  },
  // the terminal: start-up lines (label, then its states), and blocks of facts behind a typed command
  // (figures from the app's README; SPECIAL ACCESS: the hidden code's clue, to be changed with HIDDEN_CODES)
  term: {
    title: 'WARDOGS COMPANION  //  TACTICAL TERMINAL',
    booting: 'BOOTING',
    overall: 'BOOT',
    boot: 'TACTICAL TERMINAL · COLD BOOT',
    mem: 'MEMORY CHECK',
    catalogue: 'CATALOGUE',
    decrypt: 'DECRYPTING UPLINK',
    power: 'MAIN POWER',
    lamps: 'LAMP TEST',
    bay: 'BAY',
    radar: 'RADAR',
    keypad: 'KEYPAD',
    hack: 'HACK',
    readHead: 'READ',
    readOk: 'OK',
    uplink: 'UPLINK SECURED',
    callHead: 'CALL 112',
    callLine: 'LINE',
    ringing: 'RINGING',
    connected: 'CONNECTED',
    ended: 'ENDED',
    missed: 'MISSED',
    link: 'UPLINK',
    ready: 'SYSTEM READY',
    on: 'ON',
    run: 'RUN',
    ok: 'OK',
    warm: 'WARM',
    sweep: 'SWEEP',
    standby: 'READY',
    stopping: 'SHUTTING DOWN',
    shutdown: 'SHUTDOWN REQUESTED',
    save: 'SAVING SESSION',
    off: 'OFF',
    shutOverall: 'POWER',
    blocks: [
      [
        'OPERATIONS',
        [
          ['TEAMS', '3'],
          ['MAPS', '3'],
          ['CLASSES', '6'],
        ],
      ],
      [
        'NETWORK',
        [
          ['LANGUAGES', 'EN/FR'],
          ['SERVER', 'NONE'],
          ['DISCORD', 'ONLINE'],
        ],
      ],
      [
        'CATALOGUE',
        [
          ['ITEMS', '273'],
          ['VEHICLES', '21'],
          ['ATTACHMENTS', '122'],
        ],
      ],
      [
        'PROJECT',
        [
          ['EXTENSION', 'SOON'],
          ['SITE', 'BETA'],
          ['VISUALS', 'PENDING'],
        ],
      ],
      ['SPECIAL ACCESS', [['TOWER 04', '471']]],
      ['VISIT', 'visit'],
    ],
    visitPages: 'PAGES READ',
    visitLast: 'LAST',
    visitCodes: 'CODES',
    faction: 'FACTION',
    factionNone: 'NONE',
    contact: 'CONTACT',
  },
};

export type StationTexts = typeof en;

const fr: StationTexts = {
  skip: '[ passer ]',
  skipLabel: "Passer l'arrivée",
  soundOff: '[ son coupé ]',
  soundOn: '[ son activé ]',
  soundLabel: 'Son',
  motionOff: '[ animations coupées ]',
  motionOn: '[ animations activées ]',
  motionLabel: 'Animations',
  vol: 'VOLUME',
  soundWord: 'SON',
  on: 'ACTIVÉ',
  off: 'COUPÉ',
  muted: 'SON COUPÉ',
  audio: 'AUDIO',
  legends: {
    vol: 'VOLUME',
    sound: 'ON / OFF',
    volt: 'TENSION',
    amp: 'COURANT',
    temp: 'TEMP',
    load: 'CHARGE',
    bass: 'BASSES',
    mid: 'MÉDIUMS',
    treble: 'AIGUS',
    filter: 'FILTRE',
    mono: 'MONO',
    echo: 'ÉCHO',
    line: 'LIGNE',
    bayA: 'TRAVÉE A',
    bayB: 'TRAVÉE B',
    bayC: 'TRAVÉE C',
    bayD: 'TRAVÉE D',
  },
  volHint: 'Glisse ou molette pour tourner',
  volHintTouch: 'Glisse en rond pour tourner',
  soundHintOn: 'Clique pour activer',
  soundHintOff: 'Clique pour couper',
  soundHintOnTouch: 'Touche pour activer',
  soundHintOffTouch: 'Touche pour couper',
  power: 'ALIMENTATION',
  powerOff: 'ARRÊT',
  powerOn: 'MARCHE',
  powerHint: 'Clique pour allumer',
  powerHintTouch: 'Touche pour allumer',
  powerLine: "Appuie sur le bouton d'alimentation pour démarrer la station",
  powerAuto: 'Démarrage auto dans',
  powerSec: 's',
  powerStarting: 'Démarrage en cours…',
  powerOffHint: 'Clique pour éteindre',
  powerOffTouch: 'Touche pour éteindre',
  powerOnLabel: 'Alimentation : marche. Éteindre la station',
  legal2:
    "Images : l'ordinateur, les emblèmes des factions et les objets de WARDOGS © BULKHEAD / Team17 — montrés pour leur présenter ce projet, retirés sur simple demande.",
  intro2: ui.fr['intro.legal2'],
  enter: 'SAISIR CODE',
  menuHead: 'MENU PRINCIPAL',
  keypadHint: '▼ PAVÉ',
  sections: 'Sections',
  keypadName: 'Pavé',
  keyClear: 'EFFACER',
  keyEnter: 'ENTRER',
  keyClearLabel: 'Effacer',
  keyEnterLabel: 'Entrer',
  back: 'RETOUR',
  backKey: 'ÉCHAP',
  backLabel: 'Retour à la console',
  acquisition: 'ACQUISITION',
  statusLink: 'LIAISON OK',
  active: 'ACTIF',
  error: 'ERREUR',
  hack: {
    tower: 'TOUR 04',
    locked: 'VERROUILLÉE',
    hacking: 'PIRATAGE',
    granted: 'ACCÈS ACCORDÉ',
    taken: 'PRISE',
    said: 'Tour 04 piratée : accès accordé',
  },
  codeAccepted: 'Code {code} accepté',
  codeAcceptedTo: 'Code {code} accepté : {to}',
  codeRefused: 'Code {code} refusé',
  callIncoming: 'APPEL ENTRANT',
  callAnswer: 'Clique pour décrocher',
  callAnswerTouch: 'Touche pour décrocher',
  callSay: 'Appel entrant : clique sur le téléphone pour décrocher',
  callSayTouch: 'Appel entrant : touche le téléphone pour décrocher',
  callMissedSay: 'Appel manqué',
  callConnected: 'CONNECTÉ',
  callHangHint: 'Clique pour raccrocher',
  callHangHintTouch: 'Touche pour raccrocher',
  callJoin: 'Rejoindre le Discord',
  callHangUp: 'Raccrocher',
  callConnectedSay: 'Appel en cours :',
  callEndedSay: 'Appel terminé',
  callLines: [
    'Ici la station. Code reçu.',
    'Merci de soutenir Wardogs Companion, un projet fait par des joueurs, pour les joueurs.',
    'Le Discord est ouvert\u00a0: viens nous rejoindre.',
  ],
  menuHint: 'CLIQUE SUR UNE SECTION, OU TAPE SON CODE AU PAVÉ',
  menuHintTouch: 'TOUCHE UNE SECTION, OU TAPE SON CODE AU PAVÉ',
  postScreenHint: 'Clique pour lire',
  postScreenHintTouch: 'Touche pour lire',
  postCodeState: 'PRÊT',
  postCodeHint: "Tape le code d'une section au pavé",
  postPhone: 'DISCORD',
  postPhoneState: 'EN LIGNE',
  postPhoneHint: 'Clique pour rejoindre le serveur',
  postPhoneHintTouch: 'Touche pour rejoindre le serveur',
  newTab: "s'ouvre dans un nouvel onglet",
  postAudio: 'AUDIO',
  postAudioHint: "Tourne la molette, bascule l'interrupteur",
  postKeypad: 'PAVÉ',
  postKeypadHint: "Tape le code d'une section, puis ENTRER",
  postRadar: 'RADAR',
  postRadarNone: 'AUCUNE FACTION',
  postRadarHintPeople: 'Clique sur un écho : rejoins une faction ou ouvre une fiche',
  postRadarHintPeopleTouch: 'Touche un écho : rejoins une faction ou ouvre une fiche',
  echoFaction: 'FACTION',
  echoJoined: 'REJOINTE',
  echoJoin: 'Clique pour rejoindre',
  echoLeave: 'Clique pour quitter',
  echoJoinTouch: 'Touche pour rejoindre',
  echoLeaveTouch: 'Touche pour quitter',
  radarGroupPeople: 'Radar\u00a0: factions et personnes',
  factionsGroup: 'Factions',
  factionJoinedSay: 'Faction {name} rejointe',
  factionLeftSay: 'Faction {name} quittée',
  cardOpen: 'Clique pour ouvrir sa fiche',
  cardOpenTouch: 'Touche pour ouvrir sa fiche',
  cardClose: 'Fermer la fiche',
  cards: {
    biggy: {
      kicker: 'OPÉRATEUR',
      label: 'Fiche de Biggy',
      rows: [
        ['RÔLE', 'CRÉATEUR · DÉVELOPPEUR'],
        ['UNITÉ', 'WARDOGS COMPANION'],
        ['EN SERVICE', 'DEPUIS 2026'],
      ],
      text: "Joueur de WARDOGS, j'ai créé Wardogs Companion pour améliorer l'expérience des streamers et des joueurs\u00a0: le loadout du streamer, en direct, sans quitter le stream.",
      links: {
        twitch: 'La chaîne de Biggy',
        discord: 'Le serveur de la communauté',
        github: 'Le profil GitHub de Biggy',
      },
    },
  },
  chartSignal: 'SIGNAL',
  chartVisited: 'VISITÉES',
  socials: {
    discord: ['Le serveur de la communauté', 'Rejoindre le Discord'],
    github: ['Le code source du site'],
  },
  menu: [
    ['EXTENSION', "L'extension Twitch", '273'],
    ['CAPTURES', '{shots} vues', '226'],
    ['DISCORD', 'Rejoindre le serveur', '112'],
    ['À PROPOS', 'Le projet', '008'],
  ],
  onPage: 'Dans cette page',
  shotPrev: 'Capture précédente',
  shotNext: 'Capture suivante',
  shotZoom: 'Agrandir la capture',
  figZoom: "Agrandir l'image",
  routeShow: 'Voir le détail ▾',
  routeHide: 'Masquer le détail ▴',
  shotZoomShort: 'Agrandir',
  zoomClose: 'Fermer',
  zoomKeys: ['← → pour parcourir', 'Échap pour fermer'],
  zoomSwipe: ['Fais glisser la capture pour la parcourir'],
  shotSay: 'Capture {n} sur {t}, {side}\u00a0: {title}',
  shotTeams: "Couleurs d'\u00e9quipe",
  shotTeamSay: '{title} aux couleurs de {team}',
  shotPending: 'Capture à venir',
  pageSay: 'Page {page} ouverte',
  shotMore: 'En détail',
  shotLang: 'Version anglaise',
  shotMoreSay: 'En savoir plus sur la page {page} : {part}',
  pages: {
    // (the app's French presentation, docs/PRESENTATION.md, as written there; an unbreakable space before the colons and semicolons, inside the guillemets and in 5 000, as French sets them)
    extension: [
      [
        'hero',
        {
          kicker: 'Extension Twitch pour WARDOGS',
          title: 'Wardogs Companion',
          note: 'Projet communautaire, non officiel, sans lien avec BULKHEAD, Team17 ni Twitch.',
          lead: 'Les viewers voient le loadout du streamer, directement sur le stream.',
          text: "Dans WARDOGS, le loadout, c'est tout ce qu'un joueur emporte au combat : armes, accessoires, équipement, sac. Le streamer prépare le sien dans une régie sur Twitch, et ses viewers l'ouvrent d'un clic par-dessus la vidéo. Rien n'est lu dans le jeu : le streamer saisit tout lui-même.",
          status: [
            'Bientôt disponible',
            "Pas encore sur Twitch : une bêta d'abord, puis l'ouverture à tous.",
          ],
          pic: [
            'captures/01-viewer-panel-valkyra.webp',
            [1308, 799],
            'Le panneau viewer aux couleurs de Valkyra : le loadout partagé par BiggyQLF sur la carte Bakurani, ses armes, son sac et son parachute.',
            "Ce que voit un viewer après un clic sur l'icône, ici aux couleurs de l'équipe Valkyra.",
          ],
          follow: ['Suivre la sortie sur le Discord', 'discord'],
          more: ['Voir ce qui est prévu', 'roadmap'],
        },
      ],
      [
        'mod',
        {
          title: 'En trois étapes',
          w: 12,
          body: [
            [
              'steps',
              [
                [
                  'Le streamer prépare son loadout',
                  "Dans la régie de l'extension, sur Twitch : il choisit ses armes et leurs accessoires, range son sac, indique son équipe et sa carte.",
                  ['Voir la régie', 'streamer'],
                ],
                [
                  'Il le publie',
                  'Un clic sur « Publier les modifications » : le panneau se met à jour chez tous les viewers, en direct. Ceux qui arrivent plus tard voient le dernier loadout publié.',
                ],
                [
                  "Les viewers l'ouvrent",
                  "Une icône sur la vidéo : un clic, et tout le loadout s'affiche, objet par objet, sans quitter le stream.",
                  ['Voir le panneau', 'viewers'],
                ],
              ],
            ],
          ],
        },
      ],
      ['part', 'viewers', 'Panneau viewer', 'Panneau viewer'],
      [
        'mod',
        {
          title: "L'icône sur la vidéo",
          w: 12,
          kind: 'strip',
          flip: true,
          fig: [
            [
              'launcher-icon.webp',
              "L'icône de Wardogs Companion, sur laquelle le viewer clique pour ouvrir le panneau.",
              72,
            ],
          ],
          body: [
            [
              'p',
              "Une petite icône sur la vidéo : un clic ouvre le panneau. Chacun place l'icône là où elle ne gêne pas, déplace le panneau par sa barre de titre et l'agrandit par un coin, du petit lecteur au plein écran.",
            ],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'panel',
          title: 'Le panneau',
          file: 'captures/01-viewer-panel-manticore.webp',
          size: [1308, 799],
          alt: 'Le panneau viewer aux couleurs de Manticore : le loadout partagé par BiggyQLF sur la carte Bakurani, ses armes, son sac et son parachute.',
          lead: 'Tout le loadout du streamer, rangé comme dans le jeu.',
          items: [
            ['Partagé par', 'le pseudo du streamer, son équipe et son emblème.', [36, 138, 306, 94]],
            ['La carte', 'choisie par le streamer.', [797, 132, 253, 100]],
            [
              'La valeur du loadout',
              "« Valeur du paquetage » dans l'appli : le total des prix des objets dans le jeu, pas de l'argent réel.",
              [1052, 132, 252, 100],
            ],
            [
              'Les onglets',
              'Equipment (Équipement) et Classes ; Presets (Préréglages) et Unlocks (Déblocages) arrivent bientôt.',
              [28, 240, 600, 54, 'l'],
            ],
            [
              'Les armes',
              'avec leur chargeur, leur optique, leur poignée, leur accessoire de bouche et leurs munitions.',
              [36, 318, 640, 282, 'l'],
            ],
            ['Le sac et le parachute', '', [714, 318, 542, 246]],
            ['Le contenu du sac', 'rangé comme dans le jeu, avec les quantités.', [714, 584, 542, 166, 'l']],
            ['Mis à jour', "la date et l'heure de la dernière publication.", [36, 756, 240, 34, 'l']],
            [
              'Plus bas',
              'les protections, les véhicules, les accès rapides et le poids : il suffit de faire défiler.',
              [1284, 294, 22, 456, 'tr'],
            ],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'cards',
          title: "Les fiches d'objets",
          flip: true,
          file: 'captures/04-item-card.webp',
          size: [1308, 898],
          alt: "La fiche du silencieux AR Multi-Caliber Suppressor, ouverte depuis l'emplacement de bouche de l'arme : poids, niveau, avantages, inconvénients et caractéristiques.",
          lead: "Survole un objet : une fiche courte s'ouvre. Clique : la fiche complète, qui reste ouverte.",
          items: [
            ["L'objet survolé", "ici le silencieux de l'arme.", [582, 523, 96, 130, 'r']],
            ['Son nom et sa famille', 'ici un accessoire.', [86, 160, 489, 115, 'ir']],
            [
              'Le poids et un niveau de classe',
              'ici 0,72 kg et niveau 21 en Assaut.',
              [86, 277, 489, 76, 'ir'],
            ],
            ['Les avantages', "ce que l'objet améliore.", [86, 357, 489, 255, 'ir']],
            ['Les inconvénients', "ce qu'il dégrade.", [86, 615, 489, 120, 'ir']],
            ['Les caractéristiques', "comme la place qu'il prend dans le sac.", [86, 738, 489, 107, 'ir']],
            ['Une fiche ouverte', 'un clic à côté la referme.', [86, 848, 489, 44, 'ir']],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'classes',
          title: 'Les classes',
          file: 'illustrations/viewer-classes.webp',
          size: [1248, 412],
          alt: 'La progression du streamer : niveau WARDOGS 145, et le niveau de chacune des six classes.',
          lead: 'Le deuxième onglet : les niveaux que le streamer indique dans la régie.',
          items: [
            ['Le niveau WARDOGS', 'le niveau général du streamer.', [314, 39, 620, 123]],
            [
              'Les six classes',
              'Assaut, Médecin, Reconnaissance, Soutien, Conducteur et Pilote, chacune avec son niveau.',
              [8, 206, 1232, 198],
            ],
          ],
        },
      ],
      ['part', 'streamer', 'Régie du streamer', 'Régie du streamer'],
      [
        'anno',
        {
          id: 'editor',
          title: 'La régie',
          wide: true,
          file: 'captures/06-streamer-editor.webp',
          size: [1899, 909],
          alt: "La régie du streamer : le nom affiché, l'équipe, la carte et la valeur du loadout, les emplacements des armes, le sac, et au pied l'état du panneau et le bouton de publication.",
          lead: "Le streamer l'ouvre sur Twitch, avant ou pendant son live. La bande du haut montre ce que les viewers verront : nom, équipe, carte et valeur.",
          items: [
            ['Le nom affiché', 'celui que les viewers verront.', [112, 128, 462, 78]],
            [
              "L'équipe",
              'Lonestar, Valkyra ou Manticore : le panneau prend sa couleur.',
              [928, 128, 418, 78],
            ],
            ['La carte', 'choisie dans la liste.', [1388, 128, 234, 78]],
            [
              'La valeur du loadout',
              "« Valeur du paquetage » dans l'appli, calculée toute seule avec les prix des objets dans le jeu.",
              [1650, 128, 240, 78],
            ],
            ['Les emplacements', 'un clic sur une case pour choisir son objet.', [28, 290, 984, 545, 'l']],
            [
              'Le sac',
              'ajouter un objet, le glisser pour le ranger, le tourner, le dupliquer.',
              [1048, 290, 822, 545],
            ],
            [
              "L'état du panneau",
              "à jour, ou des modifications non partagées ; et le lien « Effacer l'équipement publié ».",
              [18, 850, 170, 46, 'r'],
            ],
            [
              'Publier',
              'sur Twitch, le bouton « Publier les modifications » (la capture, prise hors de Twitch, montre « Update preview »).',
              [1597, 848, 286, 52, 'l'],
            ],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'picker',
          title: 'Choisir un objet',
          flip: true,
          fit: true,
          h: 560,
          file: 'captures/07-item-picker.webp',
          size: [814, 870],
          alt: "Le sélecteur d'objets : un champ de recherche, les catégories avec leur nombre d'objets, les sous-catégories, et la liste des objets avec leur poids.",
          lead: "Un clic sur un emplacement ouvre le sélecteur d'objets avec seulement les objets qui y vont ; dans le sac, « Ajouter un objet » (Add item) montre aussi, grisés et avec la raison, ceux qui n'y entrent pas pour l'instant.",
          items: [
            ['La recherche', 'par nom.', [33, 130, 738, 62, 'l']],
            [
              'Les catégories',
              "avec leur nombre d'objets, selon l'emplacement (ici le sac).",
              [33, 208, 738, 170, 'l'],
            ],
            ['Les sous-catégories', 'pour affiner.', [33, 420, 650, 72, 'l']],
            ['Aucun objet (No item)', 'pour vider un emplacement.', [33, 527, 90, 46, 'l']],
            [
              'La liste',
              "image, nom et principales caractéristiques (ici le poids) ; le + ajoute l'objet.",
              [33, 595, 738, 272, 'l'],
            ],
          ],
        },
      ],
      [
        'anno',
        {
          id: 'backpack',
          title: 'Les protections, les véhicules et le sac',
          wide: true,
          file: 'captures/08-backpack-editing.webp',
          size: [1899, 909],
          alt: "La régie pendant qu'un chargeur est déplacé dans le sac et tourné d'un quart de tour ; à gauche les protections et les véhicules, sous le sac la jauge de poids.",
          lead: 'Le streamer choisit ses protections et ses véhicules, glisse les objets dans la grille du sac et peut les tourner, comme dans WARDOGS.',
          items: [
            ['Les protections', 'casque, gilet pare-balles et gilet tactique.', [28, 288, 984, 226, 'l']],
            ['Les véhicules', 'un terrestre et un aérien.', [28, 538, 386, 228, 'l']],
            ['Un objet en déplacement', "tourné d'un quart de tour, d'un clic droit.", [1305, 372, 122, 250]],
            ['Les quantités', 'avec − et +, dans les limites du jeu.', [1594, 442, 112, 30, 'r']],
            [
              'Le poids',
              "calculé tout seul : ici environ 58,3 kg, très lourd (certains objets n'ont pas encore de poids).",
              [1052, 772, 812, 58],
            ],
          ],
        },
      ],
      [
        'mod',
        {
          title: 'Les accès rapides',
          w: 12,
          kind: 'strip',
          flip: true,
          fig: [
            [
              'editor-quick.webp',
              'Les accès rapides de la régie : les objets et, sous chacun, sa touche du clavier.',
              520,
            ],
          ],
          body: [
            [
              'p',
              'Sept accès rapides : chacun reprend un objet du sac, avec sa touche du clavier, que le streamer peut changer.',
            ],
          ],
        },
      ],
      ['part', 'essentials', "L'essentiel", "L'essentiel"],
      [
        'mod',
        {
          title: 'En chiffres',
          w: 12,
          kind: 'stats-mod',
          body: [
            [
              'stats',
              [
                ['273', 'Objets'],
                ['3', 'Équipes', 'Lonestar · Valkyra · Manticore'],
                ['3', 'Cartes', 'Bakurani · Ozeti · Zestafona'],
                ['6', 'Classes', 'Assaut · Médecin · Reconnaissance · Soutien · Conducteur · Pilote'],
                ['2', 'Langues', 'Anglais · Français'],
              ],
            ],
          ],
        },
      ],
      [
        'mod',
        {
          title: 'Les 273 objets du jeu',
          w: 12,
          kind: 'cat2',
          body: [
            [
              'p',
              'Les objets parmi lesquels le streamer choisit dans la régie, chacun avec son image, son prix en jeu et ses effets, son encombrement, et son poids quand le jeu le donne (pas encore pour la plupart des munitions ni pour les véhicules), en anglais et en français.',
            ],
            [
              'cat',
              [
                [
                  'Armes',
                  '30',
                  "25 principales (fusils d'assaut, pistolets-mitrailleurs, fusils, mitrailleuses, fusils tactiques et de précision, arc), 5 armes secondaires",
                ],
                ['Lanceurs', '4'],
                [
                  'Objets de spécialisation',
                  '37',
                  'médical 7, construction et fournitures 7, tactique 13, reconnaissance 4, outils pour véhicules 4, batteries 2',
                ],
                ['Véhicules', '21', 'terrestres et aériens'],
                ['Équipement', '25', '6 casques, 6 pare-balles, 3 gilets tactiques, 2 parachutes, 8 sacs'],
                ['Accessoires', '122', '21 optiques, 17 poignées et bipieds, 44 bouches, 40 chargeurs'],
                ['Munitions', '34'],
              ],
            ],
            [
              'small',
              'WARDOGS, ses noms, logos et visuels, images des objets et des véhicules comprises, appartiennent à BULKHEAD et Team17.',
            ],
          ],
        },
      ],
      [
        'mod',
        {
          title: 'Bon à savoir',
          w: 12,
          body: [
            [
              'facts',
              [
                [
                  'Tout passe par Twitch',
                  "L'extension n'a aucun serveur à elle : Twitch garde le loadout et l'envoie aux viewers.",
                ],
                [
                  'Aucune donnée collectée',
                  "L'extension garde seulement, dans le navigateur de chaque viewer, la place de l'icône et celle du panneau, avec sa taille.",
                ],
                [
                  'Des loadouts contrôlés',
                  "L'extension vérifie chaque loadout quand le streamer le publie et quand un viewer l'ouvre : les objets inconnus sont retirés, les données mal formées rejetées.",
                ],
              ],
            ],
          ],
        },
      ],
      ['part', 'roadmap', 'Ce qui arrive', 'Ce qui arrive'],
      [
        'mod',
        {
          title: 'Feuille de route',
          w: 12,
          kind: 'route-mod',
          body: [
            [
              'route',
              {
                here: [
                  'Vous êtes ici',
                  "Aujourd'hui",
                  [
                    'Le panneau viewer',
                    'La régie du streamer',
                    'Les 273 objets du jeu',
                    'Anglais et français',
                  ],
                  'Bientôt disponible',
                ],
                step: 'Étape {n}',
                stops: [
                  [
                    'Le lancement',
                    [
                      "D'abord une bêta avec quelques streamers, pour recueillir leurs retours, puis l'extension ouverte à tous sur Twitch.",
                      'Une version téléphone : le panneau lisible et pratique sur mobile, et sur les tout petits lecteurs.',
                    ],
                  ],
                  [
                    'Pour les streamers',
                    [
                      "Des commandes de chat comme !extension ou !site, qui présentent l'extension aux viewers.",
                      'Un bouton Modifier sur le panneau, visible du streamer seul.',
                      "Des préréglages : plusieurs loadouts préparés à l'avance par le streamer, que les viewers peuvent aussi consulter.",
                    ],
                  ],
                  [
                    'Un panneau plus riche',
                    [
                      'Une courte présentation de WARDOGS, pour les viewers qui découvrent le jeu.',
                      "Des fiches d'objets plus complètes.",
                      'Un insigne de grade selon le niveau WARDOGS.',
                      'De nouvelles langues, ajoutées facilement.',
                    ],
                  ],
                  [
                    'Selon les retours',
                    [
                      'Onglet Déblocages : ce que le streamer a débloqué (véhicules, équipement…).',
                      'Onglet Statistiques : dernière et meilleure partie, meilleure arme, tirs à la tête… Seulement si une source de données autorisée le permet.',
                      "Les réglages du jeu et les lingots du streamer, s'il veut les montrer.",
                      "Des commandes de chat pour le streamer et ses modos : changer la couleur d'équipe, la carte…",
                      'La régie depuis le site, en plus de Twitch.',
                    ],
                  ],
                ],
                note: ['Une idée, un avis ? Partage-les sur le Discord.'],
                links: ['discord'],
              },
            ],
          ],
        },
      ],
    ],
    discord: [
      [
        'hero',
        {
          kicker: 'Wardogs Companion · Communauté',
          title: 'Rejoins la communauté.',
          join: 'discord',
          text: "Le serveur Discord du projet : pour obtenir de l'aide sur l'extension, partager tes idées et suivre les nouveautés en premier.",
          status: ['En ligne', 'Accès gratuit · invitation permanente', 'ready'],
        },
      ],
      [
        'mod',
        {
          title: 'Ce que tu y trouves',
          w: 12,
          body: [
            [
              'facts',
              [
                ["De l'aide", "Sur l'extension : questions, installation, problèmes."],
                ['Tes idées', 'Un endroit pour partager tes idées et tes retours sur le projet.'],
                ['Les nouveautés en premier', "À commencer par la sortie de l'extension."],
              ],
            ],
          ],
        },
      ],
      [
        'mod',
        {
          title: 'Merci',
          w: 12,
          kind: 'note',
          body: [
            [
              'p',
              "Merci à tous ceux qui suivent le projet, donnent leur avis et partagent leurs idées : c'est grâce à vous qu'il avance.",
            ],
          ],
        },
      ],
    ],
    about: [
      [
        'hero',
        {
          kicker: 'Wardogs Companion · Projet communautaire',
          title: 'Un projet fait par des joueurs, pour les joueurs.',
          text: 'Un projet communautaire non officiel autour de WARDOGS, créé par Biggy : une extension Twitch, un serveur Discord et ce site.',
          contact: 'biggy',
          states: [
            ["L'extension", 'Bientôt disponible'],
            ['Ce site', 'Bêta'],
            ['Le Discord', 'En ligne', 'ready'],
            ['Images du jeu', "En attente d'accord"],
          ],
        },
      ],
      ['part', 'project', 'Projet', 'Le projet'],
      [
        'mod',
        {
          title: 'Ce qui le compose',
          w: 12,
          body: [
            [
              'trio',
              [
                [
                  "L'extension Twitch",
                  'Le loadout du streamer, ouvert par ses viewers directement sur le stream.',
                  'extension',
                ],
                ['Le serveur Discord', "L'aide, les idées et les nouveautés du projet.", 'discord'],
                ['Le code source', 'Le code du site est public, sur GitHub.', null, 'github'],
                [
                  'Ce site',
                  'Cette station est le menu du site : choisis une section, ou tape son code au pavé.',
                ],
              ],
            ],
            [
              'small',
              "L'extension est réalisée avec React, TypeScript et Vite ; les polices Barlow sont fournies avec elle.",
            ],
          ],
        },
      ],
      ['part', 'rights', 'Droits', 'Droits'],
      [
        'mod',
        {
          title: 'Droits et images',
          w: 12,
          kind: 'cols',
          body: [
            [
              'p',
              "Wardogs Companion est un projet communautaire indépendant et non officiel. Il n'est affilié ni à BULKHEAD, ni à Team17, ni à Twitch. WARDOGS, ses noms, logos et visuels appartiennent à leurs ayants droit.",
            ],
            [
              'p',
              'Les images du jeu de ce site sont montrées pour présenter ce projet à BULKHEAD, et retirées sur simple demande.',
            ],
          ],
        },
      ],
    ],
    screenshots: [
      [
        'mod',
        {
          title: 'Captures',
          h1: true,
          w: 12,
          kind: 'shots-mod',
          body: [
            [
              'shots',
              [
                [
                  'Panneau viewer',
                  'Ce que voient les viewers sur le stream',
                  [
                    [
                      '01-viewer-panel-{team}.webp',
                      'Le panneau',
                      'Le loadout du streamer, aux couleurs de son équipe. Choisis une équipe pour le voir changer.',
                      'Panneau viewer de Wardogs Companion aux couleurs de {team}, avec le loadout de BiggyQLF sur la carte Bakurani.',
                    ],
                    [
                      '02-backpack.webp',
                      'Le contenu du sac',
                      'Le contenu du sac, rangé dans sa grille comme en jeu.',
                      "Panneau viewer au contenu du sac : armes, munitions, grenades et soins rangés dans la grille du sac, l'arme de poing à côté.",
                    ],
                    [
                      '03-gear-vehicles.webp',
                      'Protections et véhicules',
                      'Casque, gilet pare-balles, gilet tactique, les véhicules du streamer et les accès rapides.',
                      'Panneau viewer aux protections et aux véhicules : casque et protection de niveau 4, grand gilet tactique, le Flakpanzer Gepard et le Havoc, le poids du loadout et les accès rapides.',
                    ],
                    [
                      '04-item-card.webp',
                      "La fiche d'un objet",
                      'Survole un objet pour une fiche courte ; clique pour la fiche complète, qui reste ouverte.',
                      'Fiche du Silencieux multicalibre AR ouverte sur le panneau viewer : son poids, son niveau 21 en Assaut, ses avantages, ses inconvénients et ses caractéristiques.',
                    ],
                    [
                      '05-classes.webp',
                      'Les classes',
                      'Le niveau WARDOGS du streamer et celui de chacune des six classes.',
                      'Onglet Classes du panneau viewer : niveau WARDOGS 145 et niveaux Assaut, Médecin, Reconnaissance, Soutien, Conducteur et Pilote.',
                    ],
                  ],
                  'viewers',
                ],
                [
                  'Régie du streamer',
                  'Là où le streamer compose son loadout',
                  [
                    [
                      '06-streamer-editor.webp',
                      'La régie',
                      'Le streamer compose ici son loadout et le publie sur le panneau.',
                      "Régie du streamer de Wardogs Companion\u00a0: le nom affiché, l'équipe, la carte et la valeur du loadout au-dessus des armes et de leurs accessoires, du sac et du bouton de publication.",
                    ],
                    [
                      '07-item-picker.webp',
                      'Choisir un objet',
                      "Les objets qui vont dans l'emplacement, par catégorie, avec une recherche.",
                      "Sélecteur d'objets ouvert depuis le sac\u00a0: un champ de recherche, les catégories d'objets avec leur nombre et les premiers objets, la trousse de secours et l'adrénaline.",
                    ],
                    [
                      '08-backpack-editing.webp',
                      'Ranger le sac',
                      'Les objets se glissent dans la grille et se tournent comme en jeu.',
                      "Sac de la régie\u00a0: un chargeur en cours de glissement, tourné d'un quart de tour.",
                    ],
                  ],
                  'streamer',
                ],
              ],
            ],
          ],
        },
      ],
    ],
  },
  term: {
    title: 'WARDOGS COMPANION  //  TERMINAL TACTIQUE',
    booting: 'DÉMARRAGE',
    overall: 'DÉMARRAGE',
    boot: 'TERMINAL TACTIQUE · DÉMARRAGE À FROID',
    mem: 'TEST MÉMOIRE',
    catalogue: 'CATALOGUE',
    decrypt: 'DÉCHIFFREMENT LIAISON',
    power: 'ALIMENTATION',
    lamps: 'TEST VOYANTS',
    bay: 'TRAVÉE',
    radar: 'RADAR',
    keypad: 'PAVÉ',
    hack: 'PIRATAGE',
    readHead: 'LECTURE',
    readOk: 'OK',
    uplink: 'LIAISON SÉCURISÉE',
    callHead: 'APPEL 112',
    callLine: 'LIGNE',
    ringing: 'SONNE',
    connected: 'CONNECTÉ',
    ended: 'TERMINÉ',
    missed: 'MANQUÉ',
    link: 'LIAISON',
    ready: 'SYSTÈME PRÊT',
    on: 'MARCHE',
    run: 'TEST',
    ok: 'OK',
    warm: 'CHAUFFE',
    sweep: 'BALAYAGE',
    standby: 'PRÊT',
    stopping: 'ARRÊT EN COURS',
    shutdown: 'ARRÊT DEMANDÉ',
    save: 'SAUVEGARDE SESSION',
    off: 'ARRÊT',
    shutOverall: 'ÉNERGIE',
    blocks: [
      [
        'OPÉRATIONS',
        [
          ['ÉQUIPES', '3'],
          ['CARTES', '3'],
          ['CLASSES', '6'],
        ],
      ],
      [
        'RÉSEAU',
        [
          ['LANGUES', 'EN/FR'],
          ['SERVEUR', 'AUCUN'],
          ['DISCORD', 'EN LIGNE'],
        ],
      ],
      [
        'CATALOGUE',
        [
          ['OBJETS', '273'],
          ['VÉHICULES', '21'],
          ['ACCESSOIRES', '122'],
        ],
      ],
      [
        'PROJET',
        [
          ['EXTENSION', 'BIENTÔT'],
          ['SITE', 'BÊTA'],
          ['IMAGES', 'EN ATTENTE'],
        ],
      ],
      ['ACCÈS SPÉCIAL', [['TOUR 04', '471']]],
      ['VISITE', 'visit'],
    ],
    visitPages: 'PAGES LUES',
    visitLast: 'DERNIÈRE',
    visitCodes: 'CODES',
    faction: 'FACTION',
    factionNone: 'AUCUNE',
    contact: 'CONTACT',
  },
};

export const stationTexts: Record<Lang, StationTexts> = { en, fr };
