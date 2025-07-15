export interface Group {
	id: number;
	name: string;
	about: string;
	image: string;
	city: string;
	state: string;
	numMembers: number;
	numEvents: number;
	events: Event[];
	type: string;
	organizerId?: number;
}

export interface GroupsData {
	groups: Group[];
}

export interface GroupDetails {
      id: number;
      name: string;
      about: string;
      image: string;
      city: string;
      state: string;
      type: string;
      organizerId: number;
      organizer: {
            id: number;
            firstName: string;
            lastName: string;
            username: string;
            email: string;
            profileImage: string;
            bio: string;
      };
      members: GroupMember[];
      events: GroupEvent[];
      groupImage: GroupImage[];
}

export interface GroupMember {
	id: number | string;
	userId: number;
	groupId: number;
	isOrganizer?: boolean;
	user: {
		id: number;
		firstName: string;
		lastName: string;
		username: string;
		email: string;
		profileImage: string;
	};
}

interface GroupEvent {
	id: number;
	name: string;
	description: string;
	image: string;
	startDate: string;
	endDate: string;
	venueInfo?: {
		city: string;
		state: string;
	};
}

interface GroupImage {
	id: number;
	groupImage: string;
	name: string;
}

export interface UpdateGroupDetails {
      id: number;
      name: string;
      about: string;
      type: string;
      city: string;
      state: string;
      image: string;
      organizerId: number;
}

export interface DeleteGroupProps {
      groupDetails: {
            id: number;
            name: string;
      };
}