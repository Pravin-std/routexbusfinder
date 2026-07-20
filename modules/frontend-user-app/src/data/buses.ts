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

  // Salem → Mettur
  { id: "21", busNumber: "TNSTC S1", busName: "Mettur Express", fromId: "salem-new", toId: "mettur", departure: "06:00", arrival: "08:00", durationMinutes: 120, price: 45, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["salem-old", "five-roads", "fairlands", "omalur", "karuppur", "tharamangalam", "mecheri", "kolathur", "mettur-dam"] },
  { id: "22", busNumber: "TNSTC S1A", busName: "Mettur Local", fromId: "salem-new", toId: "mettur", departure: "09:30", arrival: "11:45", durationMinutes: 135, price: 45, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["salem-old", "five-roads", "fairlands", "omalur", "karuppur", "tharamangalam", "mecheri", "kolathur", "mettur-dam"] },
  { id: "23", busNumber: "TNSTC S1B", busName: "Mettur Fast", fromId: "salem-new", toId: "mettur", departure: "14:00", arrival: "15:50", durationMinutes: 110, price: 50, type: "stops", status: "onTime", busType: "express", intermediateStops: ["omalur", "tharamangalam", "mecheri", "mettur-dam"] },

  // Salem → Attur
  { id: "24", busNumber: "TNSTC S2", busName: "Attur Express", fromId: "salem-new", toId: "attur", departure: "06:30", arrival: "08:15", durationMinutes: 105, price: 35, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["salem-old", "ammapet", "ayothiapattinam", "valapady", "singipuram", "pethanaickenpalayam", "ethapur"] },
  { id: "25", busNumber: "TNSTC S2A", busName: "Attur Local", fromId: "salem-new", toId: "attur", departure: "11:00", arrival: "12:50", durationMinutes: 110, price: 35, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["salem-old", "ammapet", "ayothiapattinam", "valapady", "singipuram", "pethanaickenpalayam", "ethapur"] },

  // Salem → Edappadi
  { id: "26", busNumber: "TNSTC S3", busName: "Edappadi Express", fromId: "salem-new", toId: "edappadi", departure: "07:00", arrival: "08:30", durationMinutes: 90, price: 30, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["kondalampatti", "mamankam", "magudanchavadi", "sankagiri", "thevur"] },
  { id: "27", busNumber: "TNSTC S3A", busName: "Edappadi Local", fromId: "salem-new", toId: "edappadi", departure: "13:00", arrival: "14:30", durationMinutes: 90, price: 30, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["kondalampatti", "mamankam", "magudanchavadi", "sankagiri", "thevur"] },

  // Salem → Dharmapuri
  { id: "28", busNumber: "TNSTC S4", busName: "Dharmapuri Express", fromId: "salem-new", toId: "dharmapuri", departure: "06:45", arrival: "09:15", durationMinutes: 150, price: 55, type: "stops", status: "onTime", busType: "express", intermediateStops: ["five-roads", "omalur", "karuppur", "thoppur", "palacode"] },
  { id: "29", busNumber: "TNSTC S4A", busName: "Dharmapuri Local", fromId: "salem-new", toId: "dharmapuri", departure: "15:00", arrival: "17:45", durationMinutes: 165, price: 50, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["five-roads", "omalur", "karuppur", "thoppur", "palacode"] },

  // Salem → Namakkal
  { id: "30", busNumber: "TNSTC S5", busName: "Namakkal Express", fromId: "salem-new", toId: "namakkal", departure: "07:30", arrival: "09:00", durationMinutes: 90, price: 35, type: "stops", status: "onTime", busType: "express", intermediateStops: ["seelanaickenpatti", "veerapandi", "rasipuram", "puduchatram"] },
  { id: "31", busNumber: "TNSTC S5A", busName: "Namakkal Local", fromId: "salem-new", toId: "namakkal", departure: "12:00", arrival: "13:40", durationMinutes: 100, price: 32, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["seelanaickenpatti", "veerapandi", "rasipuram", "puduchatram"] },

  // Salem → Yercaud
  { id: "32", busNumber: "TNSTC S6", busName: "Yercaud Hill", fromId: "salem-old", toId: "yercaud", departure: "07:00", arrival: "08:15", durationMinutes: 75, price: 25, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["hasthampatti", "gorimedu", "yercaud-foothills", "yercaud-lake"] },
  { id: "33", busNumber: "TNSTC S6A", busName: "Yercaud Express", fromId: "salem-old", toId: "yercaud", departure: "10:00", arrival: "11:10", durationMinutes: 70, price: 28, type: "stops", status: "onTime", busType: "express", intermediateStops: ["hasthampatti", "gorimedu", "yercaud-foothills", "yercaud-lake"] },

  // Mettur → Erode
  { id: "34", busNumber: "TNSTC S7", busName: "Mettur-Erode", fromId: "mettur", toId: "erode", departure: "08:00", arrival: "10:30", durationMinutes: 150, price: 50, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["kolathur", "mecheri", "bhavani"] },

  // Attur → Kallakurichi
  { id: "35", busNumber: "TNSTC S8", busName: "Attur-Kallakurichi", fromId: "attur", toId: "kallakurichi", departure: "09:00", arrival: "11:00", durationMinutes: 120, price: 40, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["ethapur", "pethanaickenpalayam", "gangavalli"] },

  // Sankagiri → Tiruchengode
  { id: "36", busNumber: "TNSTC S9", busName: "Sankagiri-Tiruchengode", fromId: "sankagiri", toId: "tiruchengode", departure: "08:30", arrival: "09:45", durationMinutes: 75, price: 25, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["magudanchavadi", "komarapalayam"] },

  // Salem → Erode (updated with stops)
  { id: "16", busNumber: "TNSTC 22", busName: "Kongu", fromId: "salem", toId: "erode", departure: "08:00", arrival: "09:30", durationMinutes: 90, price: 60, type: "direct", status: "onTime", busType: "ordinary" },

  // Trichy → Thanjavur
  { id: "17", busNumber: "TNSTC 40", busName: "Chola", fromId: "trichy", toId: "thanjavur", departure: "09:00", arrival: "10:00", durationMinutes: 60, price: 45, type: "direct", status: "onTime", busType: "ordinary" },

  // Chennai → Tirunelveli
  { id: "18", busNumber: "SETC 888", busName: "Nellai Superfast", fromId: "chennai", toId: "tirunelveli", departure: "19:00", arrival: "07:00", durationMinutes: 720, price: 650, type: "direct", status: "onTime", busType: "ac" },

  // Coimbatore → Trichy
  { id: "19", busNumber: "TNSTC 61", busName: "Kongu Kaveri", fromId: "coimbatore", toId: "trichy", departure: "07:30", arrival: "13:00", durationMinutes: 330, price: 180, type: "stops", status: "onTime", busType: "express", intermediateStops: ["karur"] },

  // Chennai → Kanyakumari
  { id: "20", busNumber: "SETC 999", busName: "Kumari Express", fromId: "chennai", toId: "kanyakumari", departure: "18:00", arrival: "08:00", durationMinutes: 840, price: 750, type: "direct", status: "onTime", busType: "ac" },

  // Salem → Elampillai
  { id: "37", busNumber: "13A", busName: "Salem-Elampillai", fromId: "salem-new", toId: "elampillai", departure: "04:30", arrival: "05:25", durationMinutes: 55, price: 22, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["salem-old", "kondalampatti-bypass", "kondalampatti-roundana", "chettichavadi", "veerapandi-pirivu", "veerapandi", "poolavari-pirivu", "poolavari", "thevur"] },
  { id: "38", busNumber: "13", busName: "Salem-Elampillai", fromId: "salem-new", toId: "elampillai", departure: "05:00", arrival: "05:55", durationMinutes: 55, price: 22, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["salem-old", "kondalampatti-bypass", "kondalampatti-roundana", "chettichavadi", "veerapandi-pirivu", "veerapandi", "poolavari-pirivu", "poolavari", "thevur"] },
  { id: "39", busNumber: "M-1", busName: "Salem-Elampillai", fromId: "salem-new", toId: "elampillai", departure: "06:00", arrival: "06:50", durationMinutes: 50, price: 25, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["salem-old", "kondalampatti-bypass", "kondalampatti-roundana", "chettichavadi", "veerapandi-pirivu", "veerapandi", "poolavari-pirivu", "poolavari", "thevur"] },
  { id: "40", busNumber: "Sree Balaji", busName: "Salem-Elampillai", fromId: "salem-new", toId: "elampillai", departure: "05:15", arrival: "06:05", durationMinutes: 50, price: 25, type: "stops", status: "onTime", busType: "ordinary", intermediateStops: ["salem-old", "kondalampatti-bypass", "kondalampatti-roundana", "chettichavadi", "veerapandi-pirivu", "veerapandi", "poolavari-pirivu", "poolavari", "thevur"] },
  { id: "41", busNumber: "13 EXP", busName: "Salem-Elampillai", fromId: "salem-new", toId: "elampillai", departure: "07:00", arrival: "07:40", durationMinutes: 40, price: 30, type: "stops", status: "onTime", busType: "express", intermediateStops: ["salem-old", "kondalampatti-bypass", "kondalampatti-roundana", "chettichavadi", "veerapandi-pirivu", "veerapandi", "poolavari-pirivu", "poolavari", "thevur"] },
];

// Helper to find buses between two stops (matches exact or parent stop prefix)
const matchStop = (routeStopId: string, searchId: string): boolean => {
  return routeStopId === searchId || routeStopId.startsWith(searchId + "-") || searchId.startsWith(routeStopId + "-");
};

export const findBuses = (fromId: string, toId: string): BusRoute[] => {
  return busRoutes.filter(
    (b) => matchStop(b.fromId, fromId) && matchStop(b.toId, toId)
  );
};
