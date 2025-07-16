import { User } from "../users";

export interface Tag {
	id: number;
	name: string;
}

export interface AddTagsProps {
      user: User;
      onClose: () => void;
}