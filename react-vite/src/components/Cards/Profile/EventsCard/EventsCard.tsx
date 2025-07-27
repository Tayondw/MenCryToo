import React from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, MapPin } from "lucide-react";
import { ProfileEventCardProps } from "../../../../types";

const EventsCard: React.FC<ProfileEventCardProps> = ({ event }) => (
	<Link to={`/events/${event.id}`} className="group block">
		<article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
			{/* Event Image */}
			<div className="relative aspect-[4/3] overflow-hidden">
				<img
					src={event.image}
					alt={event.name}
					className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
				/>
				<div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full border border-gray-200">
					{event.type}
				</div>
			</div>

			{/* Event Content */}
			<div className="p-4">
				<h2 className="text-lg font-bold text-gray-800 mb-2 leading-tight group-hover:text-orange-600 transition-colors duration-200">
					{event.name}
				</h2>
				<p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
					{event.description}
				</p>

				{/* Event Stats */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs text-gray-500">
						<div className="flex items-center gap-1">
							<Calendar size={14} />
							<span>{new Date(event.startDate).toLocaleDateString()}</span>
						</div>
					</div>
					<div className="flex items-center justify-between text-xs text-gray-500">
						<div className="flex items-center gap-1">
							<Users size={14} />
							<span>
								{event.numAttendees}/{event.capacity} attending
							</span>
						</div>
						{event.venueInfo ? (
							<div className="flex items-center gap-1">
								<MapPin size={14} />
								<span>
									{event.venueInfo.city}, {event.venueInfo.state}
								</span>
							</div>
						) : (
							<div className="flex items-center gap-1">
								<MapPin size={14} />
								<span>Online</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</article>
	</Link>
);

export default EventsCard;
