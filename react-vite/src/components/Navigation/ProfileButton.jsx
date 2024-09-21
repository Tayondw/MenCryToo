import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { thunkLogout } from "../../redux/session";
import OpenModalMenuItem from "./OpenModalMenuItem";
import LoginFormModal from "../LoginFormModal";
// import SignupFormModal from "../SignupFormModal";
// import SignupFormPage from "../SignupFormPage";
import OpenModalButton from "../OpenModalButton";
import { CgProfile } from "react-icons/cg";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import "./Navigation.css";

function ProfileButton({ user, navigate }) {
	const dispatch = useDispatch();
	const sessionUser = useSelector((state) => state.session.user);
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
            navigate("/", {replace: true});
            // window.location.href = "/";
	};

	return (
		<>
			{user || (user && user.profileImage) ? (
				<div id="options" ref={ulRef}>
					<div id="options-button">
						<div className="dropdown">
							<button className="nav-profile-button" onClick={toggleMenu}>
								<CgProfile size={35} style={{ color: `#223f5c` }} />
								{showMenu ? (
									<GoChevronUp size={35} style={{ color: `#223f5c` }} />
								) : (
									<GoChevronDown size={35} style={{ color: `#223f5c` }} />
								)}
							</button>
						</div>
						<div
							className={showMenu ? "profile-dropdown" : "hidden"}
							ref={ulRef}
						>
							<OpenModalMenuItem itemText={`Hello, ${user.username}`} />
							<OpenModalMenuItem itemText={user.email} />
							<hr
								style={{
									border: `1px solid #D9ECF2`,
								}}
							/>
							{!sessionUser || (sessionUser && !sessionUser.profileImage) ? (
								<div id="options-modal">
									<OpenModalButton
										className="logout"
										buttonText="View Groups"
										onButtonClick={() => {
											closeMenu();
											navigate("/groups");
										}}
										style={{
											color: `#223f5c`,
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
											color: `#223f5c`,
											backgroundColor: `#FAF5E4`,
										}}
									/>
									<OpenModalButton
										className="logout"
										buttonText="Log Out"
										onButtonClick={logout}
										style={{
											color: `#223f5c`,
											backgroundColor: `#FAF5E4`,
										}}
									/>
								</div>
							) : (
								<div id="options-modal">
									<OpenModalButton
										className="logout"
										buttonText="Profile"
										onButtonClick={() => {
											closeMenu();
											navigate(`/profile`);
										}}
										style={{
											color: `#223f5c`,
											backgroundColor: `#FAF5E4`,
										}}
									/>
									<OpenModalButton
										className="logout"
										buttonText="Posts Feed"
										onButtonClick={() => {
											closeMenu();
											navigate("/posts-feed");
										}}
										style={{
											color: `#223f5c`,
											backgroundColor: `#FAF5E4`,
										}}
									/>
									<OpenModalButton
										className="logout"
										buttonText="Similar To You"
										onButtonClick={() => {
											closeMenu();
											navigate("/profile-feed");
										}}
										style={{
											color: `#223f5c`,
											backgroundColor: `#FAF5E4`,
										}}
									/>
									<OpenModalButton
										className="logout"
										buttonText="View Groups"
										onButtonClick={() => {
											closeMenu();
											navigate("/groups");
										}}
										style={{
											color: `#223f5c`,
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
											color: `#223f5c`,
											backgroundColor: `#FAF5E4`,
										}}
									/>
									<OpenModalButton
										className="logout"
										buttonText="Log Out"
										onButtonClick={logout}
										style={{
											color: `#223f5c`,
											backgroundColor: `#FAF5E4`,
										}}
									/>
								</div>
							)}
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
					<Link to={`/signup`}>
						<p className="auth-signup">Sign up</p>
					</Link>
					{/* <OpenModalMenuItem
						itemText="Sign Up"
						onItemClick={closeMenu}
						className="auth-signup"
						modalComponent={<SignupFormModal navigate={navigate} />}
					/> */}
				</div>
			)}
		</>
	);
}

export default ProfileButton;
