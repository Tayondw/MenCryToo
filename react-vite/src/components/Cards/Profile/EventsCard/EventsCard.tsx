import React from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, MapPin } from "lucide-react";
import { ProfileEventCardProps } from "../../../../types";
import "../../../Profile/Profile.css";

const EventsCard: React.FC<ProfileEventCardProps> = ({ event }) => (
	<Link to={`/events/${event.id}`} className="group block">
		<article className="content-card-fixed">
			{/* Event Image */}
			<div className="card-image-section-fixed">
				<img src={event.image} alt={event.name} className="card-image-fixed" />
				<div className="card-badge-fixed">{event.type}</div>
			</div>

			{/* Event Content */}
			<div className="card-content-section-fixed">
				<h2 className="card-title-fixed group-hover:text-orange-600">
					{event.name}
				</h2>
				<p className="card-description-fixed">{event.description}</p>

				{/* Event Stats */}
				<div className="card-stats-fixed">
					<div className="event-date-fixed card-stats-row-fixed">
						<div className="card-stat-item-fixed">
							<Calendar size={14} />
							<span>{new Date(event.startDate).toLocaleDateString()}</span>
						</div>
					</div>
					<div className="event-attendees-fixed card-stats-row-fixed">
						<div className="card-stat-item-fixed">
							<Users size={14} />
							<span>
								{event.numAttendees}/{event.capacity} attending
							</span>
						</div>
						{event.venueInfo ? (
							<div className="event-location-fixed card-stat-item-fixed">
								<MapPin size={14} />
								<span>
									{event.venueInfo.city}, {event.venueInfo.state}
								</span>
							</div>
						) : (
							<div className="event-location-fixed card-stat-item-fixed">
								<MapPin size={14} />
								<span>
									Online
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</article>
	</Link>
);

export default EventsCard;
