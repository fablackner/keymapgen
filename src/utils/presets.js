import conf3l from '../../examples/3l.conf?raw';
import confColemak from '../../examples/colemak.conf?raw';
import confDvorak from '../../examples/dvorak.conf?raw';
import confFamak from '../../examples/famak.conf?raw';

export const PRESETS = [
  {
    id: '3l',
    name: '3l',
    description: 'Jack Rosenthal\'s three-layer keyboard layout',
    content: conf3l,
    filename: '3l.conf',
    layout: 'en'
  },
  {
    id: 'colemak',
    name: 'Colemak',
    description: 'Standard Colemak keyboard layout',
    content: confColemak,
    filename: 'colemak.conf',
    layout: 'en'
  },
  {
    id: 'dvorak',
    name: 'Dvorak',
    description: 'Standard Dvorak keyboard layout',
    content: confDvorak,
    filename: 'dvorak.conf',
    layout: 'en'
  },
  {
    id: 'famak',
    name: 'Famak',
    description: 'English-German layered Colemak-DH modified layout',
    content: confFamak,
    filename: 'famak.conf',
    layout: 'de'
  }
];
