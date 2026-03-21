export interface GarminData {
  heartRate: number;
  hrv: number;
  status: "calm" | "elevated";
}

export interface Episode {
  id: string;
  date: string;
  time: string;
  duration: number;
  triggerType: "automatic" | "manual";
  engaged: boolean;
}

export const getCurrentGarminData = (): GarminData => {
  return {
    heartRate: 72,
    hrv: 65,
    status: "calm",
  };
};

export const getElevatedGarminData = (): GarminData => {
  return {
    heartRate: 108,
    hrv: 42,
    status: "elevated",
  };
};

export const mockEpisodes: Episode[] = [
  {
    id: "1",
    date: "March 21, 2026",
    time: "2:15 PM",
    duration: 4,
    triggerType: "automatic",
    engaged: true,
  },
  {
    id: "2",
    date: "March 19, 2026",
    time: "10:30 AM",
    duration: 6,
    triggerType: "manual",
    engaged: true,
  },
  {
    id: "3",
    date: "March 18, 2026",
    time: "8:45 PM",
    duration: 3,
    triggerType: "automatic",
    engaged: false,
  },
  {
    id: "4",
    date: "March 16, 2026",
    time: "4:20 PM",
    duration: 5,
    triggerType: "automatic",
    engaged: true,
  },
  {
    id: "5",
    date: "March 15, 2026",
    time: "11:00 AM",
    duration: 7,
    triggerType: "manual",
    engaged: true,
  },
];
