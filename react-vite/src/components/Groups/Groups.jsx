import { useLoaderData, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "./Groups.css";

const Groups = () => {
	const { allGroups } = useLoaderData();
	const sessionUser = useSelector((state) => state.session.user);
	if (!allGroups || !allGroups.groups) return <p>No groups available.</p>;

	return (
		<div id="groups-body">
			<div className="create-group-link">
				{sessionUser ? (
					<Link className="nav-link" to="/groups/new">
						{"< "}Create a group
					</Link>
				) : (
					<Link className="disabled" to="/groups/new">
						{"< "}Create a group
					</Link>
				)}
				<Link to="/events" className="nav-link">
					Events{" >"}
				</Link>
			</div>
			<div id="groups-body-header">
				<h3>See where you fit in!</h3>
			</div>
			<div id="groups">
				{allGroups.groups.length > 0 ? (
					allGroups.groups.map((group) => (
						<Link
							to={`/groups/${group.id}`}
							key={group.id}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							<div className="cards">
								<img src={group.image} alt={group.name} />

								<div id="display-style-direction">
									<div id="keep-in-style">
										<h2>{group.name}</h2>
										<h3>{group.about}</h3>
										<p>
											Base Location: {group.city}, {group.state}
										</p>
									</div>
									<ul className="stats">
										<li>
											<var>{group.numMembers}</var>
											<label>Members</label>
										</li>
										<li>
											<var>{group.events.length}</var>
											<label>Events</label>
										</li>
										<li>
											<var>{group.type}</var>
											<label>Type</label>
										</li>
									</ul>
								</div>
							</div>
						</Link>
					))
				) : (
					<p>
						Currently no groups available. You will see something after you join
						a group
					</p>
				)}
			</div>
		</div>
	);
};

export default Groups;
