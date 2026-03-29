// Mock bus routes dataset for Tamil Nadu
export interface BusRoute {
  id: string;
  busNumber: string;
  busName: string;
  fromId: string;
  toId: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  price: number;
  type: "direct" | "stops";
  status: "onTime" | "delayed";
  busType: "ordinary" | "express" | "superDeluxe" | "ac";
  intermediateStops?: string[];
}

export const busRoutes: BusRoute[] = [
  // Chennai → Coimbatore
  { id: "1", busNumber: "TNSTC 45A", busName: "Thiruvalluvar", fromId: "chennai", toId: "coimbatore", departure: "06:00", arrival: "13:30", durationMinutes: 450, price: 350, type: "direct", status: "onTime", busType: "superDeluxe" },
  { id: "2", busNumber: "SETC 821", busName: "Cholan Express", fromId: "chennai", toId: "coimbatore", departure: "10:30", arrival: "18:00", durationMinutes: 450, price: 420, type: "direct", status: "onTime", busType: "ac" },
  { id: "3", busNumber: "TNSTC 12B", busName: "Kaveri", fromId: "chennai", toId: "coimbatore", departure: "22:00", arrival: "05:30", durationMinutes: 450, price: 280, type: "stops", status: "onTime", busType: "express", intermediateStops: ["salem", "erode"] },
  { id: "4", busNumber: "SETC 900", busName: "Ultra Deluxe", fromId: "chennai", toId: "coimbatore", departure: "23:30", arrival: "06:45", durationMinutes: 435, price: 550, type: "direct", status: "delayed", busType: "ac" },

  // Chennai → Madurai
  { id: "5", busNumber: "TNSTC 137", busName: "Pandian", fromId: "chennai", toId: "madurai", departure: "07:00", arrival: "15:30", durationMinutes: 510, price: 380, type: "direct", status: "onTime", busType: "superDeluxe" },
  { id: "6", busNumber: "SETC 501", busName: "Vaigai Express", fromId: "chennai", toId: "madurai", departure: "21:00", arrival: "05:00", durationMinutes: 480, price: 450, type: "direct", status: "onTime", busType: "ac" },
  { id: "7", busNumber: "TNSTC 88", busName: "Meenakshi", fromId: "chennai", toId: "madurai", departure: "14:00", arrival: "23:00", durationMinutes: 540, price: 300, type: "stops", status: "delayed", busType: "express", intermediateStops: ["trichy", "dindigul"] },

  // Chennai → Trichy
  { id: "8", busNumber: "SETC 330", busName: "Rockfort", fromId: "chennai", toId: "trichy", departure: "08:00", arrival: "14:00", durationMinutes: 360, price: 280, type: "direct", status: "onTime", busType: "superDeluxe" },
  { id: "9", busNumber: "TNSTC 55", busName: "Cauvery", fromId: "chennai", toId: "trichy", departure: "16:00", arrival: "22:30", durationMinutes: 390, price: 220, type: "stops", status: "onTime", busType: "express", intermediateStops: ["villupuram"] },

  // Chennai → Salem
  { id: "10", busNumber: "SETC 240", busName: "Yercaud", fromId: "chennai", toId: "salem", departure: "09:00", arrival: "14:00", durationMinutes: 300, price: 250, type: "direct", status: "onTime", busType: "superDeluxe" },
  { id: "11", busNumber: "TNSTC 33", busName: "Salem Express", fromId: "chennai", toId: "salem", departure: "11:30", arrival: "17:30", durationMinutes: 360, price: 190, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["vellore", "dharmapuri"] },

  // Coimbatore → Madurai
  { id: "12", busNumber: "TNSTC 77A", busName: "Vaigai", fromId: "coimbatore", toId: "madurai", departure: "06:30", arrival: "12:00", durationMinutes: 330, price: 200, type: "direct", status: "onTime", busType: "express" },
  { id: "13", busNumber: "SETC 602", busName: "Nellai Express", fromId: "coimbatore", toId: "madurai", departure: "14:00", arrival: "19:30", durationMinutes: 330, price: 280, type: "direct", status: "onTime", busType: "ac" },

  // Madurai → Tirunelveli
  { id: "14", busNumber: "TNSTC 99", busName: "Nellaiappar", fromId: "madurai", toId: "tirunelveli", departure: "07:00", arrival: "10:30", durationMinutes: 210, price: 150, type: "direct", status: "onTime", busType: "express" },
  { id: "15", busNumber: "SETC 701", busName: "South Express", fromId: "madurai", toId: "tirunelveli", departure: "13:00", arrival: "16:00", durationMinutes: 180, price: 190, type: "direct", status: "onTime", busType: "superDeluxe" },

  // Salem → Erode
  { id: "16", busNumber: "TNSTC 22", busName: "Kongu", fromId: "salem", toId: "erode", departure: "08:00", arrival: "09:30", durationMinutes: 90, price: 60, type: "direct", status: "onTime", busType: "ordinary" },

  // Trichy → Thanjavur
  { id: "17", busNumber: "TNSTC 40", busName: "Chola", fromId: "trichy", toId: "thanjavur", departure: "09:00", arrival: "10:00", durationMinutes: 60, price: 45, type: "direct", status: "onTime", busType: "ordinary" },

  // Chennai → Tirunelveli
  { id: "18", busNumber: "SETC 888", busName: "Nellai Superfast", fromId: "chennai", toId: "tirunelveli", departure: "19:00", arrival: "07:00", durationMinutes: 720, price: 650, type: "direct", status: "onTime", busType: "ac" },

  // Coimbatore → Trichy
  { id: "19", busNumber: "TNSTC 61", busName: "Kongu Kaveri", fromId: "coimbatore", toId: "trichy", departure: "07:30", arrival: "13:00", durationMinutes: 330, price: 180, type: "stops", status: "onTime", busType: "express", intermediateStops: ["karur"] },

  // Chennai → Kanyakumari
  { id: "20", busNumber: "SETC 999", busName: "Kumari Express", fromId: "chennai", toId: "kanyakumari", departure: "18:00", arrival: "08:00", durationMinutes: 840, price: 750, type: "direct", status: "onTime", busType: "ac" },
];

// Helper to find buses between two stops (checks both directions)
export const findBuses = (fromId: string, toId: string): BusRoute[] => {
  return busRoutes.filter(
    (b) => b.fromId === fromId && b.toId === toId
  );
};
