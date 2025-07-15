export interface GroupFilterOptions {
      searchTerm: string;
      location: string;
      type: string;
      sortBy: "name" | "members" | "events" | "recent";
}

export interface EventFilterOptions {
      searchTerm: string;
      location: string;
      type: string;
      timeFilter: "all" | "upcoming" | "past";
      sortBy: "date" | "name" | "attendees" | "capacity";
}