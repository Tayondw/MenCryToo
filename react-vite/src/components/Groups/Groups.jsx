import { useLoaderData, Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import "./Groups.css";

const Groups = () => {
	const { allGroups } = useLoaderData();
	const sessionUser = useSelector((state) => state.session.user);
	const [currentIndex, setCurrentIndex] = useState(0);

	console.log("this is groups", allGroups.groups);

	if (!allGroups || !allGroups.groups) {
		return <p>No groups available.</p>;
	}

	const handlePrevClick = () => {
		setCurrentIndex(
			currentIndex > 0 ? currentIndex - 1 : allGroups.groups.length - 1,
		);
	};

	const handleNextClick = () => {
		setCurrentIndex(
			currentIndex < allGroups.groups.length - 1 ? currentIndex + 1 : 0,
		);
	};

	return (
		<div id="groups">
			<h1>See where you fit in!</h1>
			{allGroups.groups.map((group) => (
				<div
					id="each-group"
					key={group.id}
					className={`mencrytoo-carousel-item ${
						group.id === allGroups.groups[currentIndex].id ? "active" : ""
					}`}
					style={{
						display:
							group.id === allGroups.groups[currentIndex].id ? "flex" : "none",
					}}
				>
					{group.groupImage.map((image) => (
						<img
							src={image.groupImage}
							alt={`${group.name} group image`}
							key={image.id}
							width={300}
							height={200}
							className="carousel-image"
						/>
					))}
					<div className="group-content">
						<h3>{group.name}</h3>
						<p>{group.about}</p>
						<p>
							Base Location: {group.city}, {group.state}
						</p>
						<p>This group typically meets {group.type}</p>
					</div>

					{sessionUser && sessionUser.profileImage && (
						<>
							<div>
								<p>See where the groups like to go:</p>
								{group.venues &&
									group.venues.map((venue) => (
										<div id="venue-group" key={venue.id}>
											{venue.address} {venue.city}, {venue.state}{" "}
											{venue.zipCode}
										</div>
									))}
							</div>
							<div>
								<p>
									Meet the organizer: {group.organizer.firstName}{" "}
									{group.organizer.lastName}
								</p>
								<p>Bio: {group.organizer.bio}</p>
								{group.organizer.profileImage && (
									<img src={group.organizer.profileImage} alt="Organizer" />
								)}
							</div>
						</>
					)}
					<div id="carousel-navigation">
						<button className="nav-button prev" onClick={handlePrevClick}>
							◀
						</button>
						<span className="nav-indicator">{`${currentIndex + 1} of ${
							allGroups.groups.length
						}`}</span>
						<button className="nav-button next" onClick={handleNextClick}>
							▶
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

export default Groups;
