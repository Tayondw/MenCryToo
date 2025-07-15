import { Venue } from "..";
import { Group } from "../groups";

export interface Event {
	id: number;
	name: string;
	description: string;
	image: string;
	numAttendees: number;
	capacity: number;
	type: string;
	startDate: string;
	endDate: string;
	venueInfo: Venue;
	groupInfo: Group;
}

export interface EventsData {
	events: Event[];
}

export interface EventAttendee {
      user: {
            id: number;
            firstName: string;
            lastName: string;
            username: string;
            email: string;
            profileImage: string;
      };
}

export interface EventVenue {
      id: number;
      groupId: number;
      address: string;
      city: string;
      state: string;
      latitude: number;
      longitude: number;
}

export interface EventGroup {
      id: number;
      name: string;
      about: string;
      image: string;
      city: string;
      state: string;
      numMembers: number;
      type: string;
}

export interface EventOrganizer {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
      profileImage: string;
      bio?: string;
}

export interface EventImage {
      id: number;
      eventImage: string;
      name: string;
}

export interface EventDetails {
      id: number;
      name: string;
      description: string;
      image: string;
      type: string;
      capacity: number;
      numAttendees: number;
      startDate: string;
      endDate: string;
      groupId: number;
      organizer: EventOrganizer;
      attendees?: EventAttendee[];
      venueInfo?: EventVenue;
      groupInfo?: EventGroup;
      eventImage?: EventImage[];
}

export interface DeleteEventProps {
      eventDetails: {
            id: number;
            name: string;
            groupId: number;
            image?: string;
            startDate?: string;
            description?: string;
      };
}
