import { Group } from "../groups";
import { Event } from "../events";
import { User } from "../users";
import { Tag } from "../tags";

export interface LoaderData {
	allGroups: Group[];
	allEvents: Event[];
	allTags: Tag[];
	error?: string;
}

export interface HomeLoaderData extends LoaderData {
	user: User | null;
}