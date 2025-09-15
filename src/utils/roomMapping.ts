// Energy system component mapping based on myGEKKO API identifiers
// Maps energy system components to their proper German names as shown in the myGEKKO Mustermann NOVA interface

export interface RoomMapping {
  [key: string]: string;
}

// Real myGEKKO API naming patterns from Mustermann NOVA system
export const ROOM_NAMES: RoomMapping = {
  // Energy production and consumption
  'PV Produktion': 'PV Produktion',
  'Hausverbrauch': 'Hausverbrauch', 
  'Netzbezug': 'Netzbezug',
  'Netzeinspeisung': 'Netzeinspeisung',
  
  // Charging stations (E-Mobility)
  'Ladestation 1': 'Ladestation 1',
  'Ladestation 2': 'Ladestation 2',
  'Ladestation 3': 'Ladestation 3',
  
  // Energy meters (real system numbering)
  'Energy Meter 0': 'Energiezähler 0',
  'Energy Meter 1': 'Energiezähler 1',
  'Energy Meter 2': 'Energiezähler 2',
  'Energy Meter 7': 'Energiezähler 7',
  'Energy Meter 8': 'Energiezähler 8',
  'Energy Meter 9': 'Energiezähler 9',
  'Energy Meter 10': 'Energiezähler 10',
  
  // Load management
  'Load 0': 'Last 0',
  'Load 1': 'Last 1',
  'Load 2': 'Last 2',
  'Load 3': 'Last 3',
  'Load 4': 'Last 4',
  'Load 5': 'Last 5',
  
  // Energy management system
  'Energiemanager': 'Energiemanager',
  'Energiezähler': 'Energiezähler',
  'EMS': 'Energiemanagementsystem',
};

/**
 * Get the proper German name for a given energy system component ID
 * Falls back to original ID if no mapping exists
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
  
  // Finally, return the original ID (energy components use descriptive IDs)
  return itemId;
}

/**
 * Get energy component names for display in UI components
 * Returns both German and English names for internationalization
 */
export function getRoomDisplayInfo(itemId: string, fallbackName?: string) {
  const germanName = getRoomName(itemId, fallbackName);
  
  // English translations for energy system components
  const englishTranslations: RoomMapping = {
    'PV Produktion': 'PV Production',
    'Hausverbrauch': 'House Consumption', 
    'Netzbezug': 'Grid Import',
    'Netzeinspeisung': 'Grid Export',
    'Ladestation 1': 'Charging Station 1',
    'Ladestation 2': 'Charging Station 2',
    'Ladestation 3': 'Charging Station 3',
    'Energiezähler 0': 'Energy Meter 0',
    'Energiezähler 1': 'Energy Meter 1',
    'Energiezähler 2': 'Energy Meter 2',
    'Energiezähler 7': 'Energy Meter 7',
    'Energiezähler 8': 'Energy Meter 8',
    'Energiezähler 9': 'Energy Meter 9',
    'Energiezähler 10': 'Energy Meter 10',
    'Last 0': 'Load 0',
    'Last 1': 'Load 1',
    'Last 2': 'Load 2',
    'Last 3': 'Load 3',
    'Last 4': 'Load 4',
    'Last 5': 'Load 5',
    'Energiemanager': 'Energy Manager',
    'Energiezähler': 'Energy Meter',
    'Energiemanagementsystem': 'Energy Management System'
  };
  
  return {
    german: germanName,
    english: englishTranslations[germanName] || germanName,
    itemId
  };
}

/**
 * Filter energy components by name pattern (case-insensitive)
 */
export function filterRoomsByName(rooms: any[], searchTerm: string): any[] {
  const lowerSearchTerm = searchTerm.toLowerCase();
  return rooms.filter(room => {
    const roomName = getRoomName(room.id || room.itemId, room.name);
    return roomName.toLowerCase().includes(lowerSearchTerm);
  });
}