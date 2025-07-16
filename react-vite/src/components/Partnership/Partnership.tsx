import React, { useState } from "react";
import { useActionData, Form, Link, useNavigation } from "react-router-dom";
import {
	ArrowLeft,
	User,
	Mail,
	Phone,
	Briefcase,
	MessageSquare,
	Send,
	X,
	CheckCircle,
	Handshake,
	Heart,
	Shield,
} from "lucide-react";
import { PartnershipErrors } from "../../types";

const Partnership: React.FC = () => {
	const errors = (useActionData() as PartnershipErrors) || {};
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		subject: "",
		message: "",
	});

	// Character limits and validation constants
	const FIRST_NAME_MIN_LENGTH = 2;
	const FIRST_NAME_MAX_LENGTH = 20;
	const LAST_NAME_MIN_LENGTH = 2;
	const LAST_NAME_MAX_LENGTH = 20;
	const SUBJECT_MIN_LENGTH = 5;
	const SUBJECT_MAX_LENGTH = 255;
	const MESSAGE_MIN_LENGTH = 10;
	const MESSAGE_MAX_LENGTH = 500;

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	// Form validation logic
	const isEmailValid = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const isPhoneValid = (phone: string) => {
		const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
		return phoneRegex.test(phone.replace(/[\s\-()]/g, ""));
	};

	// Calculate if form is valid
	const isFormValid =
		formData.firstName.length >= FIRST_NAME_MIN_LENGTH &&
		formData.firstName.length <= FIRST_NAME_MAX_LENGTH &&
		formData.lastName.length >= LAST_NAME_MIN_LENGTH &&
		formData.lastName.length <= LAST_NAME_MAX_LENGTH &&
		isEmailValid(formData.email) &&
		isPhoneValid(formData.phone) &&
		formData.subject.length >= SUBJECT_MIN_LENGTH &&
		formData.subject.length <= SUBJECT_MAX_LENGTH &&
		formData.message.length >= MESSAGE_MIN_LENGTH &&
		formData.message.length <= MESSAGE_MAX_LENGTH;

	const benefits = [
		"Access to mental health resources and tools",
		"Network with like-minded organizations",
		"Contribute to reducing stigma around men's mental health",
		"Implement proven prevention strategies",
		"Customized support for your community",
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100">
			{/* Header */}
			<div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link
							to="/"
							className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
						>
							<ArrowLeft size={20} />
							Back to Home
						</Link>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid lg:grid-cols-2 gap-12 items-start">
					{/* Left Column - Image and Info */}
					<div className="space-y-8">
						{/* Hero Image */}
						<div className="relative rounded-2xl overflow-hidden shadow-xl">
							<img
								src="https://mencrytoo.s3.amazonaws.com/MENCRYTOO4.jpg"
								alt="Men supporting each other"
								className="w-full h-auto object-cover rounded-2xl"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent flex items-end">
								<div className="p-8 text-white">
									<h2 className="text-3xl font-bold mb-2">Join Our Mission</h2>
									<p className="text-slate-200">
										Together we can make a difference in men's mental health
									</p>
								</div>
							</div>
						</div>

						{/* Partnership Info */}
						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
							<div className="flex items-center gap-4 mb-6">
								<div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
									<Handshake size={24} className="text-orange-600" />
								</div>
								<h2 className="text-2xl font-bold text-slate-900">
									Why Partner With Us?
								</h2>
							</div>

							<p className="text-slate-700 mb-6 leading-relaxed">
								Men Cry Too is a member-based, ready-made program for
								organizations and communities that want to promote mental health
								and reduce suicide among men. Our licensing model and
								partnership network help us expand our reach and impact through
								proven solutions that connect men with lifesaving tools and
								resources.
							</p>

							<ul className="space-y-3 mb-6">
								{benefits.map((benefit, index) => (
									<li key={index} className="flex items-start gap-3">
										<CheckCircle
											size={20}
											className="text-green-500 flex-shrink-0 mt-0.5"
										/>
										<span className="text-slate-700">{benefit}</span>
									</li>
								))}
							</ul>

							<div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
								<div className="flex items-center gap-3 mb-2">
									<Heart size={18} className="text-orange-500" />
									<h3 className="font-semibold text-slate-800">Our Impact</h3>
								</div>
								<p className="text-slate-700 text-sm">
									By joining our network, you'll be part of a growing movement
									that's breaking through the stigma of men not being allowed to
									express their feelings, improving help-seeking behavior, and
									reducing male suicide.
								</p>
							</div>
						</div>
					</div>

					{/* Right Column - Form */}
					<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
						<div className="flex items-center gap-4 mb-8">
							<div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
								<Shield size={24} className="text-white" />
							</div>
							<div>
								<h2 className="text-2xl font-bold text-slate-900">
									Become a Partner
								</h2>
								<p className="text-slate-600">
									Fill out the form below to start the conversation
								</p>
							</div>
						</div>

						{errors.backendError && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">
								{errors.backendError}
							</div>
						)}

						<Form
							method="post"
							action="/partnership"
							encType="multipart/form-data"
							className="space-y-6"
						>
							<input type="hidden" name="intent" value="create-partnership" />

							{/* Personal Information */}
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
									<User size={18} className="text-orange-500" />
									Personal Information
								</h3>

								<div className="grid md:grid-cols-2 gap-4">
									{/* First Name */}
									<div>
										<label
											htmlFor="firstName"
											className="block text-sm font-medium text-slate-700 mb-1"
										>
											First Name
										</label>
										<div className="relative">
											<input
												id="firstName"
												name="firstName"
												type="text"
												value={formData.firstName}
												onChange={handleChange}
												placeholder="John"
												className={`w-full px-4 py-3 pl-10 border ${
													errors.firstName
														? "border-red-300"
														: "border-slate-300"
												} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
												maxLength={FIRST_NAME_MAX_LENGTH}
												required
												disabled={isSubmitting}
											/>
											<User
												size={16}
												className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
											/>
										</div>
										{/* Validation feedback */}
										<div className="flex justify-between items-center text-xs mt-1">
											<div>
												{errors.firstName ? (
													<p className="text-red-600">{errors.firstName}</p>
												) : (
													<p className="text-slate-500">
														{formData.firstName.length < FIRST_NAME_MIN_LENGTH
															? `Please enter at least ${FIRST_NAME_MIN_LENGTH} characters`
															: "Great! Your first name looks good"}
													</p>
												)}
											</div>
											<div
												className={`${
													formData.firstName.length > FIRST_NAME_MAX_LENGTH - 5
														? "text-orange-500"
														: formData.firstName.length >= FIRST_NAME_MIN_LENGTH
														? "text-green-500"
														: "text-slate-500"
												}`}
											>
												{formData.firstName.length}/{FIRST_NAME_MAX_LENGTH}
											</div>
										</div>
									</div>

									{/* Last Name */}
									<div>
										<label
											htmlFor="lastName"
											className="block text-sm font-medium text-slate-700 mb-1"
										>
											Last Name
										</label>
										<div className="relative">
											<input
												id="lastName"
												name="lastName"
												type="text"
												value={formData.lastName}
												onChange={handleChange}
												placeholder="Doe"
												className={`w-full px-4 py-3 pl-10 border ${
													errors.lastName
														? "border-red-300"
														: "border-slate-300"
												} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
												maxLength={LAST_NAME_MAX_LENGTH}
												required
												disabled={isSubmitting}
											/>
											<User
												size={16}
												className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
											/>
										</div>
										{/* Validation feedback */}
										<div className="flex justify-between items-center text-xs mt-1">
											<div>
												{errors.lastName ? (
													<p className="text-red-600">{errors.lastName}</p>
												) : (
													<p className="text-slate-500">
														{formData.lastName.length < LAST_NAME_MIN_LENGTH
															? `Please enter at least ${LAST_NAME_MIN_LENGTH} characters`
															: "Great! Your last name looks good"}
													</p>
												)}
											</div>
											<div
												className={`${
													formData.lastName.length > LAST_NAME_MAX_LENGTH - 5
														? "text-orange-500"
														: formData.lastName.length >= LAST_NAME_MIN_LENGTH
														? "text-green-500"
														: "text-slate-500"
												}`}
											>
												{formData.lastName.length}/{LAST_NAME_MAX_LENGTH}
											</div>
										</div>
									</div>
								</div>

								{/* Email */}
								<div>
									<label
										htmlFor="email"
										className="block text-sm font-medium text-slate-700 mb-1"
									>
										Email Address
									</label>
									<div className="relative">
										<input
											id="email"
											name="email"
											type="email"
											value={formData.email}
											onChange={handleChange}
											placeholder="john.doe@example.com"
											className={`w-full px-4 py-3 pl-10 border ${
												errors.email ? "border-red-300" : "border-slate-300"
											} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
											required
											disabled={isSubmitting}
										/>
										<Mail
											size={16}
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
										/>
									</div>
									{/* Email validation feedback */}
									{errors.email ? (
										<p className="mt-1 text-xs text-red-600">{errors.email}</p>
									) : (
										<p className="mt-1 text-xs text-slate-500">
											{formData.email.length === 0
												? "Please enter your email address"
												: isEmailValid(formData.email)
												? "Great! Your email looks good"
												: "Please enter a valid email address"}
										</p>
									)}
								</div>

								{/* Phone */}
								<div>
									<label
										htmlFor="phone"
										className="block text-sm font-medium text-slate-700 mb-1"
									>
										Phone Number
									</label>
									<div className="relative">
										<input
											id="phone"
											name="phone"
											type="tel"
											value={formData.phone}
											onChange={handleChange}
											placeholder="(123) 456-7890"
											className={`w-full px-4 py-3 pl-10 border ${
												errors.phone ? "border-red-300" : "border-slate-300"
											} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
											required
											disabled={isSubmitting}
										/>
										<Phone
											size={16}
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
										/>
									</div>
									{/* Phone validation feedback */}
									{errors.phone ? (
										<p className="mt-1 text-xs text-red-600">{errors.phone}</p>
									) : (
										<p className="mt-1 text-xs text-slate-500">
											{formData.phone.length === 0
												? "Please enter your phone number"
												: isPhoneValid(formData.phone)
												? "Great! Your phone number looks good"
												: "Please enter a valid phone number"}
										</p>
									)}
								</div>
							</div>

							{/* Organization Information */}
							<div className="pt-4 border-t border-slate-200 space-y-4">
								<h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
									<Briefcase size={18} className="text-orange-500" />
									Organization Information
								</h3>

								<div>
									<label
										htmlFor="subject"
										className="block text-sm font-medium text-slate-700 mb-1"
									>
										Who are you representing?
									</label>
									<div className="relative">
										<input
											id="subject"
											name="subject"
											type="text"
											value={formData.subject}
											onChange={handleChange}
											placeholder="Individual or Organization Name"
											className={`w-full px-4 py-3 pl-10 border ${
												errors.subject ? "border-red-300" : "border-slate-300"
											} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
											maxLength={SUBJECT_MAX_LENGTH}
											required
											disabled={isSubmitting}
										/>
										<Briefcase
											size={16}
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
										/>
									</div>
									<p className="mt-1 text-xs text-slate-500">
										Specify if you're an individual or a professional. If
										professional, include your organization type (Non-Profit,
										Government, Healthcare, etc.)
									</p>
									{/* Subject validation feedback */}
									<div className="flex justify-between items-center text-xs mt-1">
										<div>
											{errors.subject ? (
												<p className="text-red-600">{errors.subject}</p>
											) : (
												<p className="text-slate-500">
													{formData.subject.length < SUBJECT_MIN_LENGTH
														? `Please enter at least ${SUBJECT_MIN_LENGTH} characters`
														: "Great! Your organization info looks good"}
												</p>
											)}
										</div>
										<div
											className={`${
												formData.subject.length > SUBJECT_MAX_LENGTH - 30
													? "text-orange-500"
													: formData.subject.length >= SUBJECT_MIN_LENGTH
													? "text-green-500"
													: "text-slate-500"
											}`}
										>
											{formData.subject.length}/{SUBJECT_MAX_LENGTH}
										</div>
									</div>
								</div>
							</div>

							{/* Message */}
							<div className="pt-4 border-t border-slate-200 space-y-4">
								<h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
									<MessageSquare size={18} className="text-orange-500" />
									Your Message
								</h3>

								<div>
									<label
										htmlFor="message"
										className="block text-sm font-medium text-slate-700 mb-1"
									>
										Describe your journey and interest
									</label>
									<div className="relative">
										<textarea
											id="message"
											name="message"
											value={formData.message}
											onChange={handleChange}
											placeholder="Tell us about your interest in partnering with Men Cry Too and what you hope to achieve..."
											rows={6}
											className={`w-full px-4 py-3 border ${
												errors.message ? "border-red-300" : "border-slate-300"
											} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none`}
											maxLength={MESSAGE_MAX_LENGTH}
											required
											disabled={isSubmitting}
										/>
									</div>
									{/* Message validation feedback */}
									<div className="flex justify-between items-center text-xs mt-1">
										<div>
											{errors.message ? (
												<p className="text-red-600">{errors.message}</p>
											) : (
												<p className="text-slate-500">
													{formData.message.length < MESSAGE_MIN_LENGTH
														? `Please write at least ${MESSAGE_MIN_LENGTH} characters`
														: "Great! Your message looks good"}
												</p>
											)}
										</div>
										<div
											className={`${
												formData.message.length > MESSAGE_MAX_LENGTH - 50
													? "text-orange-500"
													: formData.message.length >= MESSAGE_MIN_LENGTH
													? "text-green-500"
													: "text-slate-500"
											}`}
										>
											{formData.message.length}/{MESSAGE_MAX_LENGTH}
										</div>
									</div>
								</div>
							</div>

							{/* Form Actions */}
							<div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-end">
								<Link
									to="/"
									className={`px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2 ${
										isSubmitting ? "opacity-50 pointer-events-none" : ""
									}`}
								>
									<X size={18} />
									Cancel
								</Link>
								<button
									type="submit"
									disabled={!isFormValid || isSubmitting}
									className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
										isFormValid && !isSubmitting
											? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg"
											: "bg-slate-300 text-slate-500 cursor-not-allowed"
									} transition-all duration-200`}
								>
									{isSubmitting ? (
										<>
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											Submitting...
										</>
									) : (
										<>
											<Send size={18} />
											Submit Application
										</>
									)}
								</button>
							</div>
						</Form>
					</div>
				</div>

				{/* Testimonials Section */}
				<div className="mt-16">
					<h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
						What Our Partners Say
					</h2>

					<div className="grid md:grid-cols-3 gap-6">
						{[
							{
								quote:
									"Partnering with Men Cry Too has transformed how our organization approaches men's mental health. The resources and support have been invaluable.",
								name: "Sarah Johnson",
								title: "Director, Community Health Alliance",
								image:
									"https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=600",
							},
							{
								quote:
									"The impact we've seen in our community since implementing Men Cry Too's programs has been remarkable. Men are finally opening up.",
								name: "Michael Chen",
								title: "Program Manager, Urban Wellness",
								image:
									"https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=600",
							},
							{
								quote:
									"As a mental health professional, I've seen firsthand how Men Cry Too's approach breaks down barriers for men seeking help.",
								name: "Dr. James Wilson",
								title: "Clinical Psychologist",
								image:
									"https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?auto=compress&cs=tinysrgb&w=600",
							},
						].map((testimonial, index) => (
							<div
								key={index}
								className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-300"
							>
								<div className="flex flex-col h-full">
									<div className="mb-4 text-orange-500">
										<svg
											width="32"
											height="32"
											viewBox="0 0 32 32"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M9.33333 21.3333C7.86667 21.3333 6.66667 20.8 5.73333 19.7333C4.8 18.6667 4.33333 17.3333 4.33333 15.7333C4.33333 14 4.93333 12.2667 6.13333 10.5333C7.33333 8.8 9.06667 7.33333 11.3333 6.13333L13.3333 8.8C11.7333 9.6 10.5333 10.4667 9.73333 11.4C8.93333 12.3333 8.53333 13.2 8.53333 14C8.53333 14.2667 8.6 14.5333 8.73333 14.8C8.86667 15.0667 9.13333 15.3333 9.53333 15.6C10.0667 15.9333 10.4667 16.3333 10.7333 16.8C11 17.2667 11.1333 17.8 11.1333 18.4C11.1333 19.2 10.8667 19.8667 10.3333 20.4C9.8 20.9333 9.13333 21.2 8.33333 21.2L9.33333 21.3333ZM20.6667 21.3333C19.2 21.3333 18 20.8 17.0667 19.7333C16.1333 18.6667 15.6667 17.3333 15.6667 15.7333C15.6667 14 16.2667 12.2667 17.4667 10.5333C18.6667 8.8 20.4 7.33333 22.6667 6.13333L24.6667 8.8C23.0667 9.6 21.8667 10.4667 21.0667 11.4C20.2667 12.3333 19.8667 13.2 19.8667 14C19.8667 14.2667 19.9333 14.5333 20.0667 14.8C20.2 15.0667 20.4667 15.3333 20.8667 15.6C21.4 15.9333 21.8 16.3333 22.0667 16.8C22.3333 17.2667 22.4667 17.8 22.4667 18.4C22.4667 19.2 22.2 19.8667 21.6667 20.4C21.1333 20.9333 20.4667 21.2 19.6667 21.2L20.6667 21.3333Z"
												fill="currentColor"
											/>
										</svg>
									</div>

									<p className="text-slate-700 italic mb-6 flex-grow">
										{testimonial.quote}
									</p>

									<div className="flex items-center gap-3 mt-auto">
										<img
											src={testimonial.image}
											alt={testimonial.name}
											className="w-12 h-12 rounded-full object-cover"
										/>
										<div>
											<h4 className="font-semibold text-slate-900">
												{testimonial.name}
											</h4>
											<p className="text-sm text-slate-600">
												{testimonial.title}
											</p>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* FAQ Section */}
				<div className="mt-16">
					<h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
						Frequently Asked Questions
					</h2>

					<div className="grid md:grid-cols-2 gap-6">
						{[
							{
								question:
									"What types of organizations can partner with Men Cry Too?",
								answer:
									"We welcome partnerships with a wide range of organizations including non-profits, healthcare providers, educational institutions, government agencies, and community groups that share our mission of improving men's mental health.",
							},
							{
								question: "What resources do partners receive?",
								answer:
									"Partners receive access to our comprehensive toolkit including educational materials, workshop guides, marketing resources, training for staff, and ongoing support from our team.",
							},
							{
								question: "Is there a cost associated with partnership?",
								answer:
									"Partnership structures vary based on organization type and needs. Some partnerships are grant-funded, while others operate on a licensing model. We work with each partner to find a sustainable approach.",
							},
							{
								question: "How long does the partnership process take?",
								answer:
									"After initial contact, we typically schedule a consultation within 1-2 weeks. The full onboarding process usually takes 4-6 weeks, depending on the scope of the partnership.",
							},
						].map((faq, index) => (
							<div
								key={index}
								className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
							>
								<h3 className="font-semibold text-slate-900 mb-2">
									{faq.question}
								</h3>
								<p className="text-slate-700">{faq.answer}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Partnership;

