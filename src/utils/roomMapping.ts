// Room name mapping based on myGEKKO API room identifiers
// This maps room item IDs to their proper German names as shown in the myGEKKO interface

export interface RoomMapping {
  [key: string]: string;
}

export const ROOM_NAMES: RoomMapping = {
  'item0': 'Küche',
  'item1': 'Wohnzimmer', 
  'item2': 'Essbereich',
  'item3': 'Badezimmer',
  'item4': 'Schlafzimmer',
  'item5': 'Garten',
  'item6': 'Büro',
  'item7': 'Kinderzimmer',
  'item8': 'Gästezimmer',
  'item9': 'Garage',
  'item10': 'Eingangsbereich',
  'item11': 'Keller',
  'item12': 'Dachboden',
  'item13': 'Arbeitszimmer',
  'item14': 'Gäste-WC',
  'item15': 'Hauswirtschaftsraum',
  'item16': 'Terrasse',
  'item17': 'Balkon',
  'item18': 'Flur',
  'item19': 'Abstellraum'
};

/**
 * Get the proper German room name for a given room item ID
 * Falls back to generic "Room X" if no mapping exists
 */
export function getRoomName(itemId: string, fallbackName?: string): string {
  // First try the mapping
  const mappedName = ROOM_NAMES[itemId];
  if (mappedName) {
    return mappedName;
  }
  
  // Then try the provided fallback name (from API if available)
  if (fallbackName && fallbackName !== itemId && !fallbackName.startsWith('item')) {
    return fallbackName;
  }
  
  // Finally, fall back to generic room name
  const roomNumber = itemId.replace('item', '');
  return `Raum ${roomNumber}`;
}

/**
 * Get room names for display in UI components
 * Returns both German and English names for internationalization
 */
export function getRoomDisplayInfo(itemId: string, fallbackName?: string) {
  const germanName = getRoomName(itemId, fallbackName);
  
  // English translations for potential future use
  const englishTranslations: RoomMapping = {
    'Küche': 'Kitchen',
    'Wohnzimmer': 'Living Room', 
    'Essbereich': 'Dining Area',
    'Badezimmer': 'Bathroom',
    'Schlafzimmer': 'Bedroom',
    'Garten': 'Garden',
    'Büro': 'Office',
    'Kinderzimmer': 'Children\'s Room',
    'Gästezimmer': 'Guest Room',
    'Garage': 'Garage',
    'Eingangsbereich': 'Entrance Area',
    'Keller': 'Basement',
    'Dachboden': 'Attic',
    'Arbeitszimmer': 'Study',
    'Gäste-WC': 'Guest Toilet',
    'Hauswirtschaftsraum': 'Utility Room',
    'Terrasse': 'Terrace',
    'Balkon': 'Balcony',
    'Flur': 'Hallway',
    'Abstellraum': 'Storage Room'
  };
  
  return {
    german: germanName,
    english: englishTranslations[germanName] || germanName,
    itemId
  };
}

/**
 * Filter rooms by name pattern (case-insensitive)
 */
export function filterRoomsByName(rooms: any[], searchTerm: string): any[] {
  const lowerSearchTerm = searchTerm.toLowerCase();
  return rooms.filter(room => {
    const roomName = getRoomName(room.id || room.itemId, room.name);
    return roomName.toLowerCase().includes(lowerSearchTerm);
  });
}