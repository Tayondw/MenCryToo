import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import { thunkLogout } from "../../redux/session";
import OpenModalMenuItem from "./OpenModalMenuItem";
import LoginFormModal from "../LoginFormModal";
import SignupFormModal from "../SignupFormModal";
import OpenModalButton from "../OpenModalButton";
import { CgProfile } from "react-icons/cg";
import { GoChevronDown } from "react-icons/go";
import "./Navigation.css";
import { Link } from "react-router-dom";

function ProfileButton({ user, navigate }) {
	const dispatch = useDispatch();
	const [showMenu, setShowMenu] = useState(false);
	const ulRef = useRef();

	const toggleMenu = (e) => {
		e.stopPropagation(); // Keep from bubbling up to document and triggering closeMenu
		setShowMenu(!showMenu);
	};

	useEffect(() => {
		if (!showMenu) return;

		const closeMenu = (e) => {
			if (ulRef.current && !ulRef.current.contains(e.target)) {
				setShowMenu(false);
			}
		};

		document.addEventListener("click", closeMenu);

		return () => document.removeEventListener("click", closeMenu);
	}, [showMenu]);

	const closeMenu = () => setShowMenu(false);

	const logout = () => {
		dispatch(thunkLogout());
		closeMenu();
		navigate("/");
	};

	return (
		<>
			{user ? (
				<div id="options" ref={ulRef}>
					<Link className="options-link" to="/groups/new">
						Start a new Group
					</Link>
					<div id="options-button">
						<div className="dropdown">
							<button className="nav-profile-button" onClick={toggleMenu}>
								<CgProfile size={35} style={{ color: `#FF6464` }} />
								<GoChevronDown size={35} style={{ color: `#FF6464` }} />
							</button>
						</div>
						<div
							className={showMenu ? "profile-dropdown" : "hidden"}
							ref={ulRef}
						>
							<OpenModalMenuItem itemText={`Hello, ${user.firstName}`} />
							<OpenModalMenuItem itemText={user.email} />
							<hr
								style={{
									border: `1px solid #D9ECF2`,
								}}
							/>
							<div id="options-modal">
								<OpenModalButton
									className="logout"
									buttonText="View Groups"
									onButtonClick={() => {
										closeMenu();
										navigate("/groups");
									}}
									style={{
										color: `#FF6464`,
										backgroundColor: `#FAF5E4`,
									}}
								/>
								<OpenModalButton
									className="logout"
									buttonText="View Events"
									onButtonClick={() => {
										closeMenu();
										navigate("/events");
									}}
									style={{
										color: `#FF6464`,
										backgroundColor: `#FAF5E4`,
									}}
								/>
								<OpenModalButton
									className="logout"
									buttonText="Log Out"
									onButtonClick={logout}
									style={{
										color: `#FF6464`,
										backgroundColor: `#FAF5E4`,
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div id="authentication">
					<OpenModalMenuItem
						itemText="Log In"
						onItemClick={closeMenu}
						className="auth-login"
						modalComponent={<LoginFormModal navigate={navigate} />}
					/>
					<OpenModalMenuItem
						itemText="Sign Up"
						onItemClick={closeMenu}
						className="auth-signup"
						modalComponent={<SignupFormModal navigate={navigate} />}
					/>
				</div>
			)}
		</>
	);
}

export default ProfileButton;
