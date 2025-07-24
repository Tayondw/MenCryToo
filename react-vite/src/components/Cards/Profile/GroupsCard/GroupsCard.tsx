import React from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, MapPin } from "lucide-react";
import { ProfileGroupCardProps } from "../../../../types";
import "../../../Profile/Profile.css";

const GroupsCard: React.FC<ProfileGroupCardProps> = ({ group }) => (
	<Link to={`/groups/${group.id}`} className="group block">
		<article className="content-card-fixed">
			{/* Group Image */}
			<div className="card-image-section-fixed">
				<img src={group.image} alt={group.name} className="card-image-fixed" />
				<div className="card-badge-fixed">{group.type}</div>
			</div>

			{/* Group Content */}
			<div className="card-content-section-fixed">
				<h2 className="card-title-fixed group-hover:text-orange-600">
					{group.name}
				</h2>
				<p className="card-description-fixed">{group.about}</p>

				{/* Group Stats */}
				<div className="card-stats-fixed">
					<div className="card-stats-row-fixed">
						<div className="card-stat-item-fixed">
							<Users size={14} />
							<span>{group.numMembers.toLocaleString()} members</span>
						</div>
						<div className="card-stat-item-fixed">
							<MapPin size={14} />
							<span>
								{group.city}, {group.state}
							</span>
						</div>
					</div>
					{group.numEvents !== undefined && (
						<div className="card-stats-row-fixed">
							<div className="card-stat-item-fixed">
								<Calendar size={14} />
								<span>{group.numEvents} events</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</article>
	</Link>
);

export default GroupsCard;
