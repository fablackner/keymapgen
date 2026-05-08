// Mapping from internal keyd IDs to AHK ScanCodes
export const keydToAhkScanCode = {
  'grave': 'SC029', '1': 'SC002', '2': 'SC003', '3': 'SC004', '4': 'SC005', '5': 'SC006',
  '6': 'SC007', '7': 'SC008', '8': 'SC009', '9': 'SC00A', '0': 'SC00B', '-': 'SC00C',
  '=': 'SC00D', 'backspace': 'SC00E',
  'tab': 'SC00F', 'q': 'SC010', 'w': 'SC011', 'e': 'SC012', 'r': 'SC013', 't': 'SC014',
  'y': 'SC015', 'u': 'SC016', 'i': 'SC017', 'o': 'SC018', 'p': 'SC019', '[': 'SC01A',
  ']': 'SC01B', 'enter': 'SC01C',
  'capslock': 'SC03A', 'a': 'SC01E', 's': 'SC01F', 'd': 'SC020', 'f': 'SC021', 'g': 'SC022',
  'h': 'SC023', 'j': 'SC024', 'k': 'SC025', 'l': 'SC026', ';': 'SC027', "'": 'SC028',
  '\\': 'SC02B',
  '102nd': 'SC056', 'shift': 'SC02A', 'z': 'SC02C', 'x': 'SC02D', 'c': 'SC02E', 'v': 'SC02F',
  'b': 'SC030', 'n': 'SC031', 'm': 'SC032', ',': 'SC033', '.': 'SC034', '/': 'SC035',
  'rightshift': 'SC036',
  'control': 'SC01D', 'meta': 'SC15B', 'alt': 'SC038', 'space': 'SC039',
  'rightalt': 'SC138', 'rightmeta': 'SC15C', 'compose': 'SC15D', 'rightcontrol': 'SC11D',
  'esc': 'SC001',
  'numpadleft': 'NumpadLeft', 'numpadright': 'NumpadRight', 'numpaddown': 'NumpadDown', 
  'numpadup': 'NumpadUp', 'numpadins': 'NumpadIns', 'numpaddel': 'NumpadDel', 
  'numpadhome': 'NumpadHome', 'numpadend': 'NumpadEnd', 'numpadclear': 'NumpadClear', 
  'numpadpgdn': 'NumpadPgDn', 'numpadpgup': 'NumpadPgUp'
};

export const ahkScanCodeToKeyd = Object.fromEntries(
  Object.entries(keydToAhkScanCode).map(([k, v]) => [v.toLowerCase(), k])
);
