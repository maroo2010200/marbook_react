/**
 * Emoji Shortcodes Dictionary & Converter
 * Translates :joy:, :eyes:, :fire:, :heart:, etc., into native Unicode emojis.
 */

export const EMOJI_SHORTCODE_MAP: Record<string, string> = {
  // Smileys & Emotions
  joy: "😂",
  rofl: "🤣",
  smile: "😊",
  smiley: "😃",
  grinning: "😀",
  grin: "😁",
  laughing: "😆",
  sweat_smile: "😅",
  wink: "😉",
  blush: "😊",
  innocent: "😇",
  heart_eyes: "😍",
  kissing_heart: "😘",
  kiss: "😘",
  yum: "😋",
  stuck_out_tongue: "😛",
  sunglasses: "😎",
  smirk: "😏",
  neutral_face: "😐",
  expressionless: "😑",
  unamused: "😒",
  sweat: "😓",
  pensive: "😔",
  confused: "😕",
  upside_down: "🙃",
  money_mouth: "🤑",
  astonished: "😲",
  disappointed: "😞",
  worried: "😟",
  triumph: "😤",
  cry: "😢",
  sob: "😭",
  frowning: "😦",
  anguished: "😧",
  fearful: "😨",
  weary: "😩",
  exploding_head: "🤯",
  grimacing: "😬",
  scream: "😱",
  flushed: "😳",
  zany: "🤪",
  dizzy_face: "😵",
  rage: "😡",
  angry: "😠",
  mask: "😷",
  sick: "🤢",
  shush: "🤫",
  thinking: "🤔",
  zipper: "🤐",
  hug: "🤗",
  hugs: "🤗",
  salute: "🫡",
  melting: "🫠",
  nerd: "🤓",
  clown: "🤡",
  ghost: "👻",
  skull: "💀",
  poop: "💩",
  alien: "👽",
  robot: "🤖",
  hot_face: "🥵",
  cold_face: "🥶",
  partying_face: "🥳",
  sleepy: "😪",
  sleeping: "😴",
  zzz: "💤",
  drooling_face: "🤤",
  vomiting_face: "🤮",
  sneezing_face: "🤧",
  face_with_thermometer: "🤒",
  face_with_head_bandage: "🤕",
  cowboy: "🤠",
  relieved: "😌",
  pleading_face: "🥺",
  yawning_face: "🥱",

  // Hand Gestures & People
  thumbsup: "👍",
  "+1": "👍",
  thumbsdown: "👎",
  "-1": "👎",
  clap: "👏",
  wave: "👋",
  raised_hands: "🙌",
  pray: "🙏",
  ok_hand: "👌",
  ok: "👌",
  pinching_hand: "🤏",
  v: "✌️",
  peace: "✌️",
  crossed_fingers: "🤞",
  love_you_gesture: "🤟",
  metal: "🤘",
  point_left: "👈",
  point_right: "👉",
  point_up: "☝️",
  point_down: "👇",
  fist: "✊",
  punch: "👊",
  handshake: "🤝",
  muscle: "💪",
  eyes: "👀",
  eye: "👁️",
  brain: "🧠",
  facepalm: "🤦",
  shrug: "🤷",

  // Hearts & Symbols
  heart: "❤️",
  red_heart: "❤️",
  orange_heart: "🧡",
  yellow_heart: "💛",
  green_heart: "💚",
  blue_heart: "💙",
  purple_heart: "💜",
  black_heart: "🖤",
  white_heart: "🤍",
  brown_heart: "🤎",
  broken_heart: "💔",
  heart_on_fire: "❤️‍🔥",
  sparkling_heart: "💖",
  two_hearts: "💕",
  revolving_hearts: "💞",
  heartbeat: "💓",
  heartpulse: "💗",
  cupid: "💘",
  fire: "🔥",
  sparkles: "✨",
  star: "⭐",
  star2: "🌟",
  dizzy: "💫",
  boom: "💥",
  collision: "💥",
  "100": "💯",
  check: "✅",
  white_check_mark: "✅",
  x: "❌",
  warning: "⚠️",
  tada: "🎉",
  party: "🎉",
  confetti_ball: "🎊",
  balloon: "🎈",
  gift: "🎁",
  trophy: "🏆",
  medal: "🏅",
  crown: "👑",
  gem: "💎",
  rocket: "🚀",
  airplane: "✈️",
  lock: "🔒",
  unlock: "🔓",
  bell: "🔔",
  bulb: "💡",
  mega: "📣",

  // Food & Drinks
  coffee: "☕",
  tea: "🍵",
  beer: "🍺",
  beers: "🍻",
  wine_glass: "🍷",
  pizza: "🍕",
  hamburger: "🍔",
  burger: "🍔",
  fries: "🍟",
  cake: "🍰",
  birthday: "🎂",
  apple: "🍎",
  cookie: "🍪",
  icecream: "🍦",
  donut: "🍩",
  doughnut: "🍩",

  // Animals & Nature
  dog: "🐶",
  cat: "🐱",
  lion: "🦁",
  monkey: "🐒",
  snake: "🐍",
  butterfly: "🦋",
  rose: "🌹",
  sunflower: "🌻",
  sun: "☀️",
  moon: "🌙",
  rainbow: "🌈",
  cloud: "☁️",
  zap: "⚡",
  lightning: "⚡",
  umbrella: "☔",
  snowflake: "❄️",
};

export const COMMON_EMOTICONS: [RegExp, string][] = [
  [/(^|\s)<3(?=\s|$)/g, "$1❤️"],
  [/(^|\s)<\/3(?=\s|$)/g, "$1💔"],
  [/(^|\s):-\((?=\s|$)/g, "$1🙁"],
  [/(^|\s):\((?=\s|$)/g, "$1🙁"],
  [/(^|\s):-\)(?=\s|$)/g, "$1😊"],
  [/(^|\s):\)(?=\s|$)/g, "$1😊"],
  [/(^|\s):-D(?=\s|$)/g, "$1😁"],
  [/(^|\s):D(?=\s|$)/g, "$1😁"],
  [/(^|\s);-\)(?=\s|$)/g, "$1😉"],
  [/(^|\s);\)(?=\s|$)/g, "$1😉"],
  [/(^|\s):-P(?=\s|$)/gi, "$1😛"],
  [/(^|\s):P(?=\s|$)/gi, "$1😛"],
  [/(^|\s):-O(?=\s|$)/gi, "$1😮"],
  [/(^|\s):O(?=\s|$)/gi, "$1😮"],
  [/(^|\s):-\*(?=\s|$)/g, "$1😘"],
  [/(^|\s):\*(?=\s|$)/g, "$1😘"],
  [/(^|\s)B-\)(?=\s|$)/g, "$1😎"],
  [/(^|\s)B\)(?=\s|$)/g, "$1😎"],
  [/(^|\s):-\/(?=\s|$)/g, "$1😕"],
  [/(^|\s):\/(?=\s|$)/g, "$1😕"],
  [/(^|\s):'-\((?=\s|$)/g, "$1😢"],
  [/(^|\s):'\((?=\s|$)/g, "$1😢"],
];

/**
 * Replace all :shortcode: and standard text emoticons in the given string.
 */
export function replaceEmojiShortcodes(input: string): string {
  if (!input) return "";

  // 1. Replace :shortcode:
  let replaced = input.replace(/:([a-zA-Z0-9_+-]+):/g, (fullMatch, code: string) => {
    const emoji = EMOJI_SHORTCODE_MAP[code.toLowerCase()];
    return emoji || fullMatch;
  });

  // 2. Replace common emoticons separated by spaces
  for (const [pattern, replacement] of COMMON_EMOTICONS) {
    replaced = replaced.replace(pattern, replacement);
  }

  return replaced;
}

/**
 * Real-time shortcode replacement while typing, keeping cursor aligned.
 */
export function liveReplaceShortcodes(
  text: string,
  cursorPos: number | null
): { text: string; newCursorPos: number | null } {
  const shortcodeRegex = /:([a-zA-Z0-9_+-]+):/g;
  let match: RegExpExecArray | null;
  let result = text;
  let offset = 0;
  let updatedCursor = cursorPos;

  while ((match = shortcodeRegex.exec(text)) !== null) {
    const raw = match[0];
    const code = match[1].toLowerCase();
    const emoji = EMOJI_SHORTCODE_MAP[code];

    if (emoji) {
      const matchStart = match.index - offset;
      const matchEnd = matchStart + raw.length;
      result = result.substring(0, matchStart) + emoji + result.substring(matchEnd);
      const diff = raw.length - emoji.length;
      offset += diff;
      if (updatedCursor !== null && updatedCursor >= match.index + raw.length) {
        updatedCursor -= diff;
      }
    }
  }

  return { text: result, newCursorPos: updatedCursor };
}
