import React from "react";
import { Link } from "react-router-dom";
import { Heart, Users, Calendar, ArrowRight, CheckCircle } from "lucide-react";
import "./NotAuthHome.css";

const NotAuthHome: React.FC = () => {
	const mentalHealthTags = [
		"ANGER",
		"ANXIETY",
		"DEPRESSION",
		"SUBSTANCE ABUSE",
		"STRESS",
		"TRAUMA",
		"RELATIONSHIPS",
		"GRIEF",
		"COMING OUT",
		"SUICIDAL THOUGHTS",
	];

	return (
		<div className="not-auth-home">
			{/* Hero Section */}
			<section className="hero-section">
				<div className="hero-overlay">
					<div className="hero-content">
						<div className="hero-text">
							<h1 className="hero-title">
								<span className="title-main">MEN CRY TOO</span>
								<span className="title-subtitle">IT'S OKAY TO CRY</span>
							</h1>
							<p className="hero-description">
								Take control of your mental health. Join a supportive community
								where vulnerability is strength and healing begins with
								connection.
							</p>
							<div className="hero-actions">
								<Link to="/signup" className="btn-primary">
									Join Our Community
									<ArrowRight size={20} />
								</Link>
								<Link to="/login" className="btn-secondary">
									Log In
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Mental Health Topics */}
			<section className="topics-section">
				<div className="container">
					<div
						className="section-header"
						style={{ display: `flex`, flexDirection: `column` }}
					>
						<h2
							className="section-title"
							style={{
								alignSelf: `center`,
								fontSize: `clamp(1.5rem, 5vw, 2rem)`,
							}}
						>
							GETLEMENTAL HEALTH 401
						</h2>
						<p className="section-subtitle">
							What every man should know about mental health and emotional
							wellbeing
						</p>
					</div>
					<div className="topics-grid">
						{mentalHealthTags.map((tag, index) => (
							<div key={index} className="topic-card">
								<span className="topic-name">{tag}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Support Options */}
			<section className="support-section">
				<div className="container">
					<div
						className="section-header"
						style={{ display: `flex`, flexDirection: `column` }}
					>
						<h2
							className="section-title"
							style={{
								alignSelf: `center`,
								fontSize: `clamp(1.5rem, 5vw, 2rem)`,
							}}
						>
							GET SUPPORT CLOSE TO HOME
						</h2>
						<p className="section-subtitle">
							Find groups and events in your community
						</p>
					</div>
					<div className="support-grid">
						<Link to="/groups" className="support-card">
							<div className="support-icon">
								<Users size={32} />
							</div>
							<h3>Find Groups</h3>
							<p>
								Connect with people forming groups to discuss mental health
								issues and find mutual support
							</p>
							<div className="card-arrow">
								<ArrowRight size={20} />
							</div>
						</Link>
						<Link to="/events" className="support-card">
							<div className="support-icon">
								<Calendar size={32} />
							</div>
							<h3>Find Events</h3>
							<p>
								Discover events hosted by groups in your community focused on
								mental health and wellness
							</p>
							<div className="card-arrow">
								<ArrowRight size={20} />
							</div>
						</Link>
					</div>
				</div>
			</section>

			{/* About Section */}
			<section className="about-section">
				<div className="container">
					<div className="about-grid">
						<div className="about-card">
							<div className="about-image">
								<img
									src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600"
									alt="Men supporting each other"
								/>
							</div>
							<div className="about-content">
								<h3>About Men Cry Too</h3>
								<p>
									Men Cry Too is an effort to break through the stigma of men
									not being allowed to express their feelings, improve
									help-seeking behavior and reduce male suicide.
								</p>
								<div className="about-stats">
									<div className="stat">
										<CheckCircle size={20} />
										<span>Safe Space</span>
									</div>
									<div className="stat">
										<CheckCircle size={20} />
										<span>Professional Support</span>
									</div>
									<div className="stat">
										<CheckCircle size={20} />
										<span>Community Driven</span>
									</div>
								</div>
							</div>
						</div>
						<div className="about-card">
							<div className="about-image">
								<img
									src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600"
									alt="Partnership and collaboration"
								/>
							</div>
							<div className="about-content">
								<h3>Partnership</h3>
								<p>
									Whether it's personal or business, we must come together and
									help each other. There are partnership opportunities for
									individuals and organizations.
								</p>
								<Link to="/partnership" className="btn-outline">
									Learn More
									<ArrowRight size={16} />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Help Someone Section */}
			<section className="help-section">
				<div className="container">
					<div className="help-content">
						<div className="help-text">
							<h2>Worried About Someone?</h2>
							<p>
								It's not you, it's them. Sometimes the people we care about need
								professional help.
							</p>
							<Link to="/contact" className="btn-primary">
								Let Us Help
								<Heart size={20} />
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="cta-section">
				<div className="container">
					<div className="cta-content">
						<h2>Become a Member</h2>
						<p>Start improving your mental health today</p>
						<Link to="/signup" className="btn-primary large">
							Join Us Today
							<ArrowRight size={24} />
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
};

export default NotAuthHome;
