import React, { useState } from "react";
import { useActionData, Form, Link, useNavigation } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	User,
	Mail,
	Phone,
	MessageSquare,
	Send,
	HelpCircle,
	Heart,
	Shield,
	Tag,
	AlertTriangle,
} from "lucide-react";
import { ContactErrors } from "../../types";

const Contact: React.FC = () => {
	const errors = (useActionData() as ContactErrors) || {};
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

	const concernTopics = [
		"ANGER",
		"ANXIETY",
		"DEPRESSION",
		"SUICIDAL THOUGHTS",
		"SUBSTANCE ABUSE",
		"COMING OUT",
		"GRIEF",
		"TRAUMA",
		"RELATIONSHIPS",
		"STRESS",
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
									<h2 className="text-3xl font-bold mb-2">
										We're Here For You
									</h2>
									<p className="text-slate-200">
										Supporting you in supporting others
									</p>
								</div>
							</div>
						</div>

						{/* Help Info */}
						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
							<div className="flex items-center gap-4 mb-6">
								<div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
									<HelpCircle size={24} className="text-orange-600" />
								</div>
								<h2 className="text-2xl font-bold text-slate-900">
									How We Can Help
								</h2>
							</div>

							<p className="text-slate-700 mb-6 leading-relaxed">
								We understand that watching someone you care about struggle with
								mental health challenges can be difficult. Our team is here to
								provide guidance, resources, and support to help you navigate
								this journey.
							</p>

							<div className="space-y-6">
								<div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
									<h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
										<div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
											<span className="text-green-600 font-medium text-sm">
												1
											</span>
										</div>
										Initial Resources
									</h3>
									<p className="text-slate-600 text-sm">
										After submitting this form, we'll send you documentation to
										help you understand what your loved one might be
										experiencing and how to approach conversations.
									</p>
								</div>

								<div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
									<h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
										<div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
											<span className="text-green-600 font-medium text-sm">
												2
											</span>
										</div>
										Personalized Guidance
									</h3>
									<p className="text-slate-600 text-sm">
										Our team will review your specific situation and provide
										tailored recommendations for support options and next steps.
									</p>
								</div>

								<div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
									<h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
										<div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
											<span className="text-green-600 font-medium text-sm">
												3
											</span>
										</div>
										Ongoing Support
									</h3>
									<p className="text-slate-600 text-sm">
										We'll connect you with community resources, support groups,
										and professional services that can provide continued
										assistance.
									</p>
								</div>
							</div>

							<div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
								<div className="flex items-center gap-3 mb-2">
									<AlertTriangle size={18} className="text-orange-500" />
									<h3 className="font-semibold text-slate-800">
										Important Note
									</h3>
								</div>
								<p className="text-slate-700 text-sm">
									If you or someone you know is in immediate danger or
									experiencing a mental health emergency, please call your local
									emergency services (911 in the US) or a crisis hotline
									immediately.
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
									Let Us Help
								</h2>
								<p className="text-slate-600">
									Fill out the form below to request support
								</p>
							</div>
						</div>

						<Form
							method="post"
							action="/contact"
							encType="multipart/form-data"
							className="space-y-6"
						>
							<input type="hidden" name="intent" value="create-contact" />

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

							{/* Concern Information */}
							<div className="pt-4 border-t border-slate-200 space-y-4">
								<h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
									<Tag size={18} className="text-orange-500" />
									Topic of Concern
								</h3>

								<div>
									<label
										htmlFor="subject"
										className="block text-sm font-medium text-slate-700 mb-1"
									>
										What are you concerned about?
									</label>
									<div className="relative">
										<input
											id="subject"
											name="subject"
											type="text"
											value={formData.subject}
											onChange={handleChange}
											placeholder="e.g., DEPRESSION, ANXIETY"
											className={`w-full px-4 py-3 pl-10 border ${
												errors.subject ? "border-red-300" : "border-slate-300"
											} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
											maxLength={SUBJECT_MAX_LENGTH}
											required
											disabled={isSubmitting}
										/>
										<Tag
											size={16}
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
										/>
									</div>
									<p className="mt-1 text-xs text-slate-500">
										What does your loved one need support with at the moment?
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
														: "Great! Your concern topic looks good"}
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

								{/* Common Topics */}
								<div className="flex flex-wrap gap-2 mt-2">
									{concernTopics.map((topic) => (
										<button
											key={topic}
											type="button"
											onClick={() =>
												setFormData((prev) => ({ ...prev, subject: topic }))
											}
											className="px-3 py-1 bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-700 rounded-full text-xs font-medium transition-colors"
											disabled={isSubmitting}
										>
											{topic}
										</button>
									))}
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
										Describe what's been going on
									</label>
									<div className="relative">
										<textarea
											id="message"
											name="message"
											value={formData.message}
											onChange={handleChange}
											placeholder="Please share details about the situation and what kind of support you're looking for..."
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

							{/* Privacy Notice */}
							<div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-600">
								<p>
									By submitting this form, you agree to our{" "}
									<a href="#" className="text-orange-600 hover:underline">
										Privacy Policy
									</a>
									. We'll use your information only to provide support and will
									never share it with third parties without your consent.
								</p>
							</div>

							{/* Form Actions */}
							<div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-end">
								<Link
									to="/"
									className={`px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2 ${
										isSubmitting ? "opacity-50 pointer-events-none" : ""
									}`}
								>
									<ArrowLeft size={18} />
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
											Submit Request
										</>
									)}
								</button>
							</div>
						</Form>
					</div>
				</div>

				{/* Resources Section */}
				<div className="mt-16">
					<h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
						Helpful Resources
					</h2>

					<div className="grid md:grid-cols-3 gap-6">
						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-300">
							<div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
								<Heart className="text-red-600" size={24} />
							</div>
							<h3 className="font-semibold text-slate-900 text-lg mb-2">
								Crisis Support
							</h3>
							<p className="text-slate-600 mb-4">
								If someone is in immediate danger, call emergency services or a
								crisis hotline right away.
							</p>
							<div className="bg-slate-50 rounded-lg p-3 text-sm">
								<p className="font-medium text-slate-800">
									National Suicide Prevention Lifeline
								</p>
								<p className="text-slate-600">1-800-273-8255</p>
							</div>
						</div>

						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-300">
							<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
								<MessageSquare className="text-blue-600" size={24} />
							</div>
							<h3 className="font-semibold text-slate-900 text-lg mb-2">
								Starting Conversations
							</h3>
							<p className="text-slate-600 mb-4">
								Learn how to approach difficult conversations about mental
								health with men in your life.
							</p>
						</div>

						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-300">
							<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
								<User className="text-green-600" size={24} />
							</div>
							<h3 className="font-semibold text-slate-900 text-lg mb-2">
								Support Groups
							</h3>
							<p className="text-slate-600 mb-4">
								Find local and online support groups for both those experiencing
								mental health challenges and their supporters.
							</p>
							<Link
								to="/groups"
								className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
							>
								Find a group near you
								<ArrowRight size={16} />
							</Link>
						</div>
					</div>
				</div>

				{/* Testimonials */}
				<div className="mt-16">
					<h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
						Stories of Support
					</h2>

					<div className="grid md:grid-cols-2 gap-8">
						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
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
									"When my brother was struggling with depression, I didn't know
									how to help. The resources and guidance I received from Men
									Cry Too gave me the tools to start a conversation and support
									him through his journey to recovery."
								</p>

								<div className="flex items-center gap-3 mt-auto">
									<img
										src="https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=600"
										alt="Sarah Johnson"
										className="w-12 h-12 rounded-full object-cover"
									/>
									<div>
										<h4 className="font-semibold text-slate-900">
											Sarah Johnson
										</h4>
										<p className="text-sm text-slate-600">
											Sister of depression survivor
										</p>
									</div>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
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
									"As a father, I was worried about my son's increasing
									isolation and anger. The team at Men Cry Too helped me
									understand what he was going through and connected us with
									resources that made a real difference in our relationship."
								</p>

								<div className="flex items-center gap-3 mt-auto">
									<img
										src="https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=600"
										alt="Michael Chen"
										className="w-12 h-12 rounded-full object-cover"
									/>
									<div>
										<h4 className="font-semibold text-slate-900">
											Michael Chen
										</h4>
										<p className="text-sm text-slate-600">
											Father and supporter
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Contact;
