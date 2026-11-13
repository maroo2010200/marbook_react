import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { SearchIcon, CloseIcon } from "./ChatIcons";

export interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  style?: React.CSSProperties;
}

interface EmojiEntry {
  char: string;
  name: string;
  category: "smileys" | "gestures" | "hearts" | "animals" | "food" | "activities" | "objects";
  keywords: string[];
}

const EMOJI_DATABASE: EmojiEntry[] = [
  // --- Smileys & Emotions ---
  { char: "😀", name: "grinning face", category: "smileys", keywords: ["happy", "smile", "grin"] },
  { char: "😃", name: "grinning face with big eyes", category: "smileys", keywords: ["happy", "joy"] },
  { char: "😄", name: "grinning face with smiling eyes", category: "smileys", keywords: ["happy", "laugh"] },
  { char: "😁", name: "beaming face", category: "smileys", keywords: ["teeth", "grin"] },
  { char: "😆", name: "grinning squinting face", category: "smileys", keywords: ["laugh", "xd"] },
  { char: "😅", name: "grinning face with sweat", category: "smileys", keywords: ["sweat", "nervous"] },
  { char: "😂", name: "face with tears of joy", category: "smileys", keywords: ["laugh", "crying", "lol", "lmao", "haha"] },
  { char: "🤣", name: "rolling on the floor laughing", category: "smileys", keywords: ["rofl", "lol", "laugh"] },
  { char: "🥲", name: "smiling face with tear", category: "smileys", keywords: ["sad", "happy", "bittersweet"] },
  { char: "🥹", name: "face holding back tears", category: "smileys", keywords: ["plead", "emotional", "proud"] },
  { char: "😊", name: "smiling face with smiling eyes", category: "smileys", keywords: ["blush", "happy"] },
  { char: "😇", name: "smiling face with halo", category: "smileys", keywords: ["angel", "innocent"] },
  { char: "🙂", name: "slightly smiling face", category: "smileys", keywords: ["smile", "okay"] },
  { char: "🙃", name: "upside-down face", category: "smileys", keywords: ["silly", "sarcasm"] },
  { char: "😉", name: "winking face", category: "smileys", keywords: ["wink", "flirt"] },
  { char: "😌", name: "relieved face", category: "smileys", keywords: ["peaceful", "calm"] },
  { char: "😍", name: "smiling face with heart-eyes", category: "smileys", keywords: ["love", "crush", "heart"] },
  { char: "🥰", name: "smiling face with hearts", category: "smileys", keywords: ["love", "affection", "adore"] },
  { char: "😘", name: "face blowing a kiss", category: "smileys", keywords: ["kiss", "love"] },
  { char: "😗", name: "kissing face", category: "smileys", keywords: ["kiss"] },
  { char: "😚", name: "kissing face with closed eyes", category: "smileys", keywords: ["kiss"] },
  { char: "😋", name: "face savoring food", category: "smileys", keywords: ["delicious", "yum", "tongue"] },
  { char: "😛", name: "face with tongue", category: "smileys", keywords: ["silly", "tongue"] },
  { char: "😜", name: "winking face with tongue", category: "smileys", keywords: ["party", "crazy", "silly"] },
  { char: "🤪", name: "zany face", category: "smileys", keywords: ["crazy", "wild", "goofy"] },
  { char: "😝", name: "squinting face with tongue", category: "smileys", keywords: ["playful", "lol"] },
  { char: "🤑", name: "money-mouth face", category: "smileys", keywords: ["money", "rich", "cash"] },
  { char: "🤗", name: "smiling face with open hands", category: "smileys", keywords: ["hug", "warm"] },
  { char: "🤭", name: "face with hand over mouth", category: "smileys", keywords: ["giggle", "oops", "secret"] },
  { char: "🫢", name: "face with open eyes and hand over mouth", category: "smileys", keywords: ["shock", "surprise", "gasp"] },
  { char: "🫣", name: "peeking face", category: "smileys", keywords: ["peek", "shy", "scared"] },
  { char: "🤫", name: "shushing face", category: "smileys", keywords: ["quiet", "shh", "secret"] },
  { char: "🤔", name: "thinking face", category: "smileys", keywords: ["think", "hmm", "ponder"] },
  { char: "🫡", name: "saluting face", category: "smileys", keywords: ["salute", "respect", "yes sir"] },
  { char: "🤐", name: "zipper-mouth face", category: "smileys", keywords: ["silent", "zip"] },
  { char: "🤨", name: "face with raised eyebrow", category: "smileys", keywords: ["suspicious", "doubt", "skeptical"] },
  { char: "😐", name: "neutral face", category: "smileys", keywords: ["meh", "okay"] },
  { char: "😑", name: "expressionless face", category: "smileys", keywords: ["blank", "unimpressed"] },
  { char: "😶", name: "face without mouth", category: "smileys", keywords: ["speechless", "quiet"] },
  { char: "🫥", name: "dotted line face", category: "smileys", keywords: ["invisible", "ghost", "hide"] },
  { char: "😏", name: "smirking face", category: "smileys", keywords: ["smirk", "flirt", "cocky"] },
  { char: "😒", name: "unamused face", category: "smileys", keywords: ["bored", "annoyed"] },
  { char: "🙄", name: "face with rolling eyes", category: "smileys", keywords: ["eyeroll", "whatever"] },
  { char: "😬", name: "grimacing face", category: "smileys", keywords: ["awkward", "nervous", "yikes"] },
  { char: "😮‍💨", name: "face exhaling", category: "smileys", keywords: ["sigh", "relief", "tired"] },
  { char: "🤥", name: "lying face", category: "smileys", keywords: ["lie", "pinocchio"] },
  { char: "🫨", name: "shaking face", category: "smileys", keywords: ["shock", "earthquake", "dizzy"] },
  { char: "😌", name: "calm face", category: "smileys", keywords: ["chill", "peace"] },
  { char: "😔", name: "pensive face", category: "smileys", keywords: ["sad", "sorry"] },
  { char: "😪", name: "sleepy face", category: "smileys", keywords: ["tired", "sleep"] },
  { char: "🤤", name: "drooling face", category: "smileys", keywords: ["yummy", "craving"] },
  { char: "😴", name: "sleeping face", category: "smileys", keywords: ["sleep", "zzz"] },
  { char: "😷", name: "face with medical mask", category: "smileys", keywords: ["sick", "mask", "covid"] },
  { char: "🤒", name: "face with thermometer", category: "smileys", keywords: ["fever", "sick"] },
  { char: "🤕", name: "face with head-bandage", category: "smileys", keywords: ["hurt", "injured"] },
  { char: "🤢", name: "nauseated face", category: "smileys", keywords: ["gross", "disgust", "barf"] },
  { char: "🤮", name: "face vomiting", category: "smileys", keywords: ["vomit", "barf", "gross"] },
  { char: "🤧", name: "sneezing face", category: "smileys", keywords: ["achoo", "cold"] },
  { char: "🥵", name: "hot face", category: "smileys", keywords: ["heat", "hot", "summer"] },
  { char: "🥶", name: "cold face", category: "smileys", keywords: ["freezing", "ice"] },
  { char: "🥴", name: "woozy face", category: "smileys", keywords: ["drunk", "tipsy", "dizzy"] },
  { char: "😵", name: "face with crossed-out eyes", category: "smileys", keywords: ["dead", "knocked out"] },
  { char: "🤯", name: "exploding head", category: "smileys", keywords: ["mind blown", "shock", "boom"] },
  { char: "🤠", name: "cowboy hat face", category: "smileys", keywords: ["western", "sheriff"] },
  { char: "🥳", name: "partying face", category: "smileys", keywords: ["celebrate", "birthday", "party"] },
  { char: "🥸", name: "disguised face", category: "smileys", keywords: ["incognito", "spy", "glasses"] },
  { char: "😎", name: "smiling face with sunglasses", category: "smileys", keywords: ["cool", "boss", "swag"] },
  { char: "🤓", name: "nerd face", category: "smileys", keywords: ["geek", "study", "smart"] },
  { char: "🧐", name: "face with monocle", category: "smileys", keywords: ["curious", "inspect"] },
  { char: "😕", name: "confused face", category: "smileys", keywords: ["huh", "puzzled"] },
  { char: "😟", name: "worried face", category: "smileys", keywords: ["anxious", "scared"] },
  { char: "🙁", name: "slightly frowning face", category: "smileys", keywords: ["sad", "unhappy"] },
  { char: "😮", name: "face with open mouth", category: "smileys", keywords: ["surprised", "wow"] },
  { char: "😯", name: "hushed face", category: "smileys", keywords: ["speechless", "surprised"] },
  { char: "😲", name: "astonished face", category: "smileys", keywords: ["omg", "shocked"] },
  { char: "😳", name: "flushed face", category: "smileys", keywords: ["embarrassed", "shy", "blush"] },
  { char: "🥺", name: "pleading face", category: "smileys", keywords: ["puppy eyes", "please", "beg"] },
  { char: "😦", name: "frowning face with open mouth", category: "smileys", keywords: ["scared", "shock"] },
  { char: "😨", name: "fearful face", category: "smileys", keywords: ["afraid", "horror"] },
  { char: "😰", name: "anxious face with sweat", category: "smileys", keywords: ["stressed", "panicked"] },
  { char: "😥", name: "sad but relieved face", category: "smileys", keywords: ["whew", "close call"] },
  { char: "😢", name: "crying face", category: "smileys", keywords: ["tear", "sad"] },
  { char: "😭", name: "loudly crying face", category: "smileys", keywords: ["sob", "weep", "crying", "tears", "sad"] },
  { char: "😱", name: "face screaming in fear", category: "smileys", keywords: ["scream", "munch", "scary"] },
  { char: "😖", name: "confounded face", category: "smileys", keywords: ["frustrated", "struggle"] },
  { char: "😣", name: "persevering face", category: "smileys", keywords: ["endure", "holding on"] },
  { char: "😞", name: "disappointed face", category: "smileys", keywords: ["regret", "sad"] },
  { char: "😓", name: "downcast face with sweat", category: "smileys", keywords: ["tired", "defeated"] },
  { char: "😩", name: "weary face", category: "smileys", keywords: ["exhausted", "tired", "ugh"] },
  { char: "😫", name: "tired face", category: "smileys", keywords: ["whine", "stressed"] },
  { char: "🥱", name: "yawning face", category: "smileys", keywords: ["bored", "sleepy"] },
  { char: "😤", name: "face with steam from nose", category: "smileys", keywords: ["proud", "triumph", "mad"] },
  { char: "😡", name: "enraged face", category: "smileys", keywords: ["angry", "pissed", "mad"] },
  { char: "😠", name: "angry face", category: "smileys", keywords: ["furious", "mad"] },
  { char: "🤬", name: "face with symbols on mouth", category: "smileys", keywords: ["swear", "curse", "censored"] },
  { char: "💀", name: "skull", category: "smileys", keywords: ["dead", "death", "skeleton", "dying"] },
  { char: "☠️", name: "skull and crossbones", category: "smileys", keywords: ["danger", "pirate", "poison"] },
  { char: "💩", name: "pile of poo", category: "smileys", keywords: ["poop", "turd", "crap"] },
  { char: "🤡", name: "clown face", category: "smileys", keywords: ["joker", "fool", "circus"] },
  { char: "👻", name: "ghost", category: "smileys", keywords: ["spooky", "halloween", "boo"] },
  { char: "👽", name: "alien", category: "smileys", keywords: ["ufo", "space", "martian"] },
  { char: "🤖", name: "robot", category: "smileys", keywords: ["bot", "ai", "droid"] },

  // --- Hand Gestures & People ---
  { char: "👋", name: "waving hand", category: "gestures", keywords: ["hello", "bye", "hi", "wave"] },
  { char: "🤚", name: "raised back of hand", category: "gestures", keywords: ["stop", "hand"] },
  { char: "🖐️", name: "hand with fingers splayed", category: "gestures", keywords: ["five", "high five"] },
  { char: "✋", name: "raised hand", category: "gestures", keywords: ["stop", "high five"] },
  { char: "🖖", name: "vulcan salute", category: "gestures", keywords: ["star trek", "spock"] },
  { char: "🫱", name: "rightwards hand", category: "gestures", keywords: ["reach", "offer"] },
  { char: "🫲", name: "leftwards hand", category: "gestures", keywords: ["reach", "take"] },
  { char: "👌", name: "OK hand", category: "gestures", keywords: ["perfect", "okay", "fine"] },
  { char: "🤌", name: "pinched fingers", category: "gestures", keywords: ["italian", "what do you want", "mama mia"] },
  { char: "🤏", name: "pinching hand", category: "gestures", keywords: ["small", "tiny", "little bit"] },
  { char: "✌️", name: "victory hand", category: "gestures", keywords: ["peace", "v", "two"] },
  { char: "🤞", name: "crossed fingers", category: "gestures", keywords: ["luck", "hopeful", "wish"] },
  { char: "🫰", name: "hand with index finger and thumb crossed", category: "gestures", keywords: ["korean heart", "money", "snap"] },
  { char: "🤟", name: "love-you gesture", category: "gestures", keywords: ["ily", "rock on"] },
  { char: "🤘", name: "sign of the horns", category: "gestures", keywords: ["rock", "metal"] },
  { char: "🤙", name: "call me hand", category: "gestures", keywords: ["shaka", "phone", "hang loose"] },
  { char: "👈", name: "backhand index pointing left", category: "gestures", keywords: ["point", "left"] },
  { char: "👉", name: "backhand index pointing right", category: "gestures", keywords: ["point", "right"] },
  { char: "👆", name: "backhand index pointing up", category: "gestures", keywords: ["point", "up"] },
  { char: "👇", name: "backhand index pointing down", category: "gestures", keywords: ["point", "down"] },
  { char: "☝️", name: "index pointing up", category: "gestures", keywords: ["one", "listen", "up"] },
  { char: "👍", name: "thumbs up", category: "gestures", keywords: ["like", "yes", "good", "approve", "ok"] },
  { char: "👎", name: "thumbs down", category: "gestures", keywords: ["dislike", "no", "bad"] },
  { char: "✊", name: "raised fist", category: "gestures", keywords: ["power", "fist"] },
  { char: "👊", name: "oncoming fist", category: "gestures", keywords: ["fist bump", "punch"] },
  { char: "🤛", name: "left-facing fist", category: "gestures", keywords: ["fist bump"] },
  { char: "🤜", name: "right-facing fist", category: "gestures", keywords: ["fist bump"] },
  { char: "👏", name: "clapping hands", category: "gestures", keywords: ["applause", "bravo", "clap"] },
  { char: "🙌", name: "raising hands", category: "gestures", keywords: ["celebrate", "praise", "hooray"] },
  { char: "🫶", name: "heart hands", category: "gestures", keywords: ["love", "heart", "care"] },
  { char: "👐", name: "open hands", category: "gestures", keywords: ["hug", "open"] },
  { char: "🤲", name: "palms up together", category: "gestures", keywords: ["prayer", "dua", "offer"] },
  { char: "🤝", name: "handshake", category: "gestures", keywords: ["deal", "agreement", "partner"] },
  { char: "🙏", name: "folded hands", category: "gestures", keywords: ["please", "thank you", "pray", "namaste", "bless"] },
  { char: "✍️", name: "writing hand", category: "gestures", keywords: ["write", "pencil"] },
  { char: "💅", name: "nail polish", category: "gestures", keywords: ["slay", "diva", "glamour"] },
  { char: "🤳", name: "selfie", category: "gestures", keywords: ["camera", "phone", "photo"] },
  { char: "💪", name: "flexed biceps", category: "gestures", keywords: ["strong", "workout", "gym", "muscle", "flex"] },
  { char: "👀", name: "eyes", category: "gestures", keywords: ["look", "see", "watch", "shifty"] },

  // --- Hearts & Roasts ---
  { char: "❤️", name: "red heart", category: "hearts", keywords: ["love", "heart", "romance"] },
  { char: "🧡", name: "orange heart", category: "hearts", keywords: ["orange", "friendship"] },
  { char: "💛", name: "yellow heart", category: "hearts", keywords: ["yellow", "sunshine"] },
  { char: "💚", name: "green heart", category: "hearts", keywords: ["green", "nature"] },
  { char: "💙", name: "blue heart", category: "hearts", keywords: ["blue", "loyalty"] },
  { char: "💜", name: "purple heart", category: "hearts", keywords: ["purple"] },
  { char: "🖤", name: "black heart", category: "hearts", keywords: ["black", "dark"] },
  { char: "🤍", name: "white heart", category: "hearts", keywords: ["white", "pure"] },
  { char: "🤎", name: "brown heart", category: "hearts", keywords: ["brown"] },
  { char: "💔", name: "broken heart", category: "hearts", keywords: ["breakup", "heartbreak", "sad"] },
  { char: "❤️‍🔥", name: "heart on fire", category: "hearts", keywords: ["burning love", "passion", "flame"] },
  { char: "❤️‍🩹", name: "mending heart", category: "hearts", keywords: ["healing", "recovery"] },
  { char: "❣️", name: "heart exclamation", category: "hearts", keywords: ["love", "punctuate"] },
  { char: "💕", name: "two hearts", category: "hearts", keywords: ["love", "sweet"] },
  { char: "💞", name: "revolving hearts", category: "hearts", keywords: ["love", "motion"] },
  { char: "💓", name: "beating heart", category: "hearts", keywords: ["pulse", "thump"] },
  { char: "💗", name: "growing heart", category: "hearts", keywords: ["love", "expanding"] },
  { char: "💖", name: "sparkling heart", category: "hearts", keywords: ["glitter", "love", "shine"] },
  { char: "💘", name: "heart with arrow", category: "hearts", keywords: ["cupid", "struck"] },
  { char: "💝", name: "heart with ribbon", category: "hearts", keywords: ["gift", "present"] },
  { char: "🔥", name: "fire", category: "hearts", keywords: ["hot", "lit", "flame", "roast", "burn"] },
  { char: "✨", name: "sparkles", category: "hearts", keywords: ["magic", "stars", "glitter", "clean"] },
  { char: "🌟", name: "glowing star", category: "hearts", keywords: ["star", "shine"] },
  { char: "💫", name: "dizzy star", category: "hearts", keywords: ["shooting star", "magic"] },
  { char: "💥", name: "collision", category: "hearts", keywords: ["boom", "bang", "explode"] },
  { char: "💯", name: "hundred points", category: "hearts", keywords: ["score", "perfect", "100", "keep it real"] },
  { char: "💢", name: "anger symbol", category: "hearts", keywords: ["mad", "anime", "vein"] },
  { char: "💬", name: "speech balloon", category: "hearts", keywords: ["comment", "chat", "talk"] },
  { char: "💭", name: "thought balloon", category: "hearts", keywords: ["dream", "think"] },

  // --- Animals & Nature ---
  { char: "🐶", name: "dog face", category: "animals", keywords: ["puppy", "pet", "bark"] },
  { char: "🐱", name: "cat face", category: "animals", keywords: ["kitten", "pet", "meow"] },
  { char: "🐭", name: "mouse face", category: "animals", keywords: ["rodent", "cheese"] },
  { char: "🐹", name: "hamster", category: "animals", keywords: ["cute", "pet"] },
  { char: "🐰", name: "rabbit face", category: "animals", keywords: ["bunny", "easter"] },
  { char: "🦊", name: "fox", category: "animals", keywords: ["clever", "wild"] },
  { char: "🐻", name: "bear", category: "animals", keywords: ["teddy", "grizzly"] },
  { char: "🐼", name: "panda", category: "animals", keywords: ["bamboo", "china"] },
  { char: "🐨", name: "koala", category: "animals", keywords: ["australia"] },
  { char: "🦁", name: "lion", category: "animals", keywords: ["king", "safari"] },
  { char: "🐯", name: "tiger face", category: "animals", keywords: ["stripes", "wild"] },
  { char: "🐮", name: "cow face", category: "animals", keywords: ["moo", "milk"] },
  { char: "🐷", name: "pig face", category: "animals", keywords: ["oink", "bacon"] },
  { char: "🐸", name: "frog", category: "animals", keywords: ["toad", "ribbit"] },
  { char: "🐵", name: "monkey face", category: "animals", keywords: ["banana", "chimp"] },
  { char: "🙈", name: "see-no-evil monkey", category: "animals", keywords: ["hide", "shy"] },
  { char: "🙉", name: "hear-no-evil monkey", category: "animals", keywords: ["secret"] },
  { char: "🙊", name: "speak-no-evil monkey", category: "animals", keywords: ["oops"] },
  { char: "🦅", name: "eagle", category: "animals", keywords: ["bird", "freedom"] },
  { char: "🦉", name: "owl", category: "animals", keywords: ["wise", "night"] },
  { char: "🐝", name: "honeybee", category: "animals", keywords: ["bee", "honey", "buzz"] },
  { char: "🦋", name: "butterfly", category: "animals", keywords: ["caterpillar", "wings"] },
  { char: "🐢", name: "turtle", category: "animals", keywords: ["slow", "shell"] },
  { char: "🐬", name: "dolphin", category: "animals", keywords: ["ocean", "sea"] },
  { char: "🐳", name: "spouting whale", category: "animals", keywords: ["ocean", "giant"] },
  { char: "🦈", name: "shark", category: "animals", keywords: ["predator", "ocean"] },
  { char: "🌸", name: "cherry blossom", category: "animals", keywords: ["flower", "sakura", "spring"] },
  { char: "🌹", name: "rose", category: "animals", keywords: ["flower", "romance", "red"] },
  { char: "🌻", name: "sunflower", category: "animals", keywords: ["yellow", "sun"] },
  { char: "🍀", name: "four leaf clover", category: "animals", keywords: ["lucky", "irish"] },

  // --- Food & Drink ---
  { char: "🍕", name: "pizza", category: "food", keywords: ["cheese", "pepperoni", "slice"] },
  { char: "🍔", name: "hamburger", category: "food", keywords: ["burger", "fast food"] },
  { char: "🍟", name: "french fries", category: "food", keywords: ["fries", "mcdonalds"] },
  { char: "🌭", name: "hot dog", category: "food", keywords: ["sausage"] },
  { char: "🍿", name: "popcorn", category: "food", keywords: ["movie", "snack"] },
  { char: "🌮", name: "taco", category: "food", keywords: ["mexican"] },
  { char: "🌯", name: "burrito", category: "food", keywords: ["wrap"] },
  { char: "🍜", name: "steaming bowl", category: "food", keywords: ["noodles", "ramen"] },
  { char: "🍝", name: "spaghetti", category: "food", keywords: ["pasta", "italian"] },
  { char: "🍣", name: "sushi", category: "food", keywords: ["japanese", "fish"] },
  { char: "🍦", name: "soft ice cream", category: "food", keywords: ["ice cream", "dessert"] },
  { char: "🍩", name: "doughnut", category: "food", keywords: ["donut", "sweet"] },
  { char: "🍪", name: "cookie", category: "food", keywords: ["biscuit", "chocolate chip"] },
  { char: "🎂", name: "birthday cake", category: "food", keywords: ["cake", "celebrate"] },
  { char: "🍫", name: "chocolate bar", category: "food", keywords: ["candy", "sweet"] },
  { char: "☕", name: "hot beverage", category: "food", keywords: ["coffee", "tea", "cafe"] },
  { char: "🧋", name: "bubble tea", category: "food", keywords: ["boba", "milk tea"] },
  { char: "🍺", name: "beer mug", category: "food", keywords: ["drink", "cheers", "pub"] },
  { char: "🍻", name: "clinking beer mugs", category: "food", keywords: ["cheers", "celebrate"] },
  { char: "🍷", name: "wine glass", category: "food", keywords: ["alcohol", "red wine"] },
  { char: "🍾", name: "bottle with popping cork", category: "food", keywords: ["champagne", "celebrate"] },

  // --- Activities & Objects ---
  { char: "⚽", name: "soccer ball", category: "activities", keywords: ["football", "sport"] },
  { char: "🏀", name: "basketball", category: "activities", keywords: ["nba", "ball"] },
  { char: "🏈", name: "american football", category: "activities", keywords: ["nfl", "super bowl"] },
  { char: "🎾", name: "tennis", category: "activities", keywords: ["court", "ball"] },
  { char: "🎮", name: "video game", category: "activities", keywords: ["controller", "gaming", "playstation", "xbox"] },
  { char: "🎯", name: "bullseye", category: "activities", keywords: ["target", "darts", "goal"] },
  { char: "🏆", name: "trophy", category: "activities", keywords: ["winner", "prize", "champion"] },
  { char: "🥇", name: "1st place medal", category: "activities", keywords: ["gold", "winner"] },
  { char: "🎉", name: "party popper", category: "activities", keywords: ["tada", "celebrate", "congrats"] },
  { char: "🎊", name: "confetti ball", category: "activities", keywords: ["party", "celebration"] },
  { char: "🚀", name: "rocket", category: "activities", keywords: ["space", "launch", "moon", "crypto"] },
  { char: "🚗", name: "automobile", category: "activities", keywords: ["car", "drive"] },
  { char: "✈️", name: "airplane", category: "activities", keywords: ["flight", "travel", "vacation"] },

  // --- Objects & Symbols ---
  { char: "💡", name: "light bulb", category: "objects", keywords: ["idea", "bright", "smart"] },
  { char: "📱", name: "mobile phone", category: "objects", keywords: ["iphone", "android", "cell"] },
  { char: "💻", name: "laptop", category: "objects", keywords: ["computer", "pc", "mac"] },
  { char: "🔒", name: "locked", category: "objects", keywords: ["security", "private"] },
  { char: "🔓", name: "unlocked", category: "objects", keywords: ["open"] },
  { char: "🔑", name: "key", category: "objects", keywords: ["password", "access"] },
  { char: "📌", name: "pushpin", category: "objects", keywords: ["pin", "notice"] },
  { char: "📍", name: "round pushpin", category: "objects", keywords: ["location", "map"] },
  { char: "🔔", name: "bell", category: "objects", keywords: ["notification", "alert"] },
  { char: "🎁", name: "wrapped gift", category: "objects", keywords: ["present", "birthday"] },
  { char: "💰", name: "money bag", category: "objects", keywords: ["cash", "dollar", "rich"] },
  { char: "⭐", name: "star", category: "objects", keywords: ["favorite", "gold"] },
  { char: "⚡", name: "high voltage", category: "objects", keywords: ["lightning", "fast", "electric"] },
  { char: "✅", name: "check mark button", category: "objects", keywords: ["yes", "done", "correct", "success"] },
  { char: "❌", name: "cross mark", category: "objects", keywords: ["no", "cancel", "wrong", "x"] },
];

const CATEGORY_TABS: Array<{ id: string; label: string; icon: string }> = [
  { id: "all", label: "All", icon: "✨" },
  { id: "smileys", label: "Smileys", icon: "😀" },
  { id: "gestures", label: "Gestures", icon: "👍" },
  { id: "hearts", label: "Hearts", icon: "❤️" },
  { id: "animals", label: "Animals", icon: "🐱" },
  { id: "food", label: "Food", icon: "🍕" },
  { id: "activities", label: "Activities", icon: "⚽" },
  { id: "objects", label: "Objects", icon: "💡" },
];

const RECENT_STORAGE_KEY = "marbook_recent_emojis";

export function insertEmojiAtCursor(
  text: string,
  emoji: string,
  inputEl: HTMLInputElement | null
): { newText: string; newCursorPos: number } {
  if (!inputEl) {
    return { newText: text + emoji, newCursorPos: text.length + emoji.length };
  }
  const start = inputEl.selectionStart ?? text.length;
  const end = inputEl.selectionEnd ?? text.length;
  const newText = text.substring(0, start) + emoji + text.substring(end);
  const newCursorPos = start + emoji.length;
  return { newText, newCursorPos };
}

export function EmojiPickerPopover({
  isOpen,
  onClose,
  onSelectEmoji,
  style,
}: EmojiPickerPopoverProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Recent emojis loaded from localStorage
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ["😀", "😂", "❤️", "🔥", "👍", "🙏", "✨", "🎉"];
    } catch {
      return ["😀", "😂", "❤️", "🔥", "👍", "🙏", "✨", "🎉"];
    }
  });

  // Handle outside click & escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    // Auto-focus search input
    setTimeout(() => searchInputRef.current?.focus(), 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Save clicked emoji to recents
  const handlePickEmoji = useCallback(
    (char: string) => {
      setRecentEmojis((prev) => {
        const next = [char, ...prev.filter((c) => c !== char)].slice(0, 24);
        try {
          localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      onSelectEmoji(char);
    },
    [onSelectEmoji]
  );

  // Filter emojis based on active category & search query
  const displayedEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return EMOJI_DATABASE.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.char === q ||
          e.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    if (activeCategory === "all") {
      return EMOJI_DATABASE;
    }

    return EMOJI_DATABASE.filter((e) => e.category === activeCategory);
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="emoji-picker-popover"
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        right: 0,
        width: 340,
        height: 380,
        maxHeight: "80vh",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 14,
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.28)",
        display: "flex",
        flexDirection: "column",
        zIndex: 200,
        overflow: "hidden",
        animation: "fadeIn 0.15s ease-out",
        fontFamily:
          '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        ...style,
      }}
    >
      {/* Header & Search */}
      <div
        style={{
          padding: "10px 12px 6px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: "var(--bg-main)",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "var(--bg-hover)",
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--border-color)",
          }}
        >
          <span style={{ color: "var(--text-secondary)", display: "flex", flexShrink: 0 }}>
            <SearchIcon size={14} />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji (e.g. fire, laugh)..."
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 12.5,
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <CloseIcon size={13} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Close emoji picker"
          aria-label="Close emoji picker"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 4,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CloseIcon size={16} />
        </button>
      </div>

      {/* Category Tabs (hidden during active search) */}
      {!searchQuery.trim() && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid var(--border-color)",
            padding: "4px 8px",
            gap: 2,
            backgroundColor: "var(--bg-main)",
            overflowX: "auto",
            scrollbarWidth: "none",
            flexShrink: 0,
          }}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                style={{
                  background: isActive ? "var(--bg-hover)" : "none",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 6px",
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.12s ease",
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                {tab.icon}
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Scroll Area */}
      <div
        className="emoji-picker-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 10px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Recent Emojis (if no search query and on 'all' tab) */}
        {!searchQuery.trim() && activeCategory === "all" && recentEmojis.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 6,
                paddingLeft: 2,
              }}
            >
              Recent
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: 2,
              }}
            >
              {recentEmojis.map((char, i) => (
                <button
                  key={`recent-${i}-${char}`}
                  type="button"
                  onClick={() => handlePickEmoji(char)}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    background: "none",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 22,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.1s ease, background-color 0.1s ease",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    e.currentTarget.style.transform = "scale(1.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section title */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 6,
            paddingLeft: 2,
          }}
        >
          {searchQuery.trim()
            ? `Search Results (${displayedEmojis.length})`
            : CATEGORY_TABS.find((t) => t.id === activeCategory)?.label || "Emojis"}
        </div>

        {/* Emoji Grid */}
        {displayedEmojis.length === 0 ? (
          <div
            style={{
              padding: "30px 10px",
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            No emojis found for "{searchQuery}"
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: 2,
            }}
          >
            {displayedEmojis.map((item, idx) => (
              <button
                key={`${item.char}-${idx}`}
                type="button"
                onClick={() => handlePickEmoji(item.char)}
                title={item.name}
                aria-label={item.name}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  background: "none",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 22,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.1s ease, background-color 0.1s ease",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  e.currentTarget.style.transform = "scale(1.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {item.char}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
