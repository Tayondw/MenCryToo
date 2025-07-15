export interface ContactErrors {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
}

export interface EventFormErrors {
	name?: string;
	description?: string;
	type?: string;
	capacity?: string;
	startDate?: string;
	endDate?: string;
	image?: string;
}

export interface GroupFormErrors {
      name?: string;
      about?: string;
      type?: string;
      city?: string;
      state?: string;
      image?: string;
      server?: string;
}