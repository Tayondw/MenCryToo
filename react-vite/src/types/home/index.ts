import { Group } from "../groups";
import { Event } from "../events";
import { User, Tag } from "..";

export interface HomeLoaderData {
	allGroups: Group[];
	allEvents: Event[];
	allTags: Tag[];
	user: User | null;
	error?: string;
}