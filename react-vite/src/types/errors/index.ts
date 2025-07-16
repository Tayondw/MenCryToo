export interface RouteError {
      status?: number;
      statusText?: string;
      message?: string;
      data?: unknown;
}
export interface LoginErrors {
      email?: string;
      password?: string;
      server?: string;
}

export interface SignupFormErrors {
      firstName?: string;
      lastName?: string;
      email?: string;
      username?: string;
      password?: string;
      confirmPassword?: string;
      bio?: string;
      profileImage?: string;
      userTags?: string;
      server?: string;
}

export interface ContactErrors {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	subject?: string;
	message?: string;
	backendError?: string;
}

export interface PartnershipErrors {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
      backendError?: string;
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

export interface PostFormErrors {
      title?: string;
      caption?: string;
      image?: string;
}