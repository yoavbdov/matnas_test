// Types for physical resources: rooms and equipment

export interface Room {
  id: string;
  name: string;
  number?: string;
  capacity: number;
  features?: string[];
  notes?: string;
}

export interface PhysicalEquipment {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

// How many units of a piece of equipment an event (class/tournament) needs
export interface ResourceAssignment {
  resource_id: string;
  quantity: number;
}
