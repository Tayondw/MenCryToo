import React from "react";
import { Link } from "react-router-dom";
import {
	Github,
	Linkedin,
	FolderOpen,
	FileText,
	Mail,
	Heart,
	ExternalLink,
	Code,
	User,
} from "lucide-react";

const Footer: React.FC = () => {
	const currentYear = new Date().getFullYear();

	const socialLinks = [
		{
			name: "Portfolio",
			href: "https://tayondw.github.io/",
			icon: FolderOpen,
			color: "hover:text-purple-400",
			description: "View my portfolio",
		},
		{
			name: "GitHub",
			href: "https://github.com/Tayondw",
			icon: Github,
			color: "hover:text-gray-300",
			description: "Check out my code",
		},
		{
			name: "LinkedIn",
			href: "https://www.linkedin.com/in/tayon",
			icon: Linkedin,
			color: "hover:text-blue-400",
			description: "Connect with me professionally",
		},
		{
			name: "Resume",
			href: "/assets/Williams-Tayon-SWE.pdf",
			icon: FileText,
			color: "hover:text-green-400",
			description: "Download my resume",
			download: true,
		},
	];

	return (
		<footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
			{/* Main Footer Content */}
			<div className="flex mx-auto px-4 sm:px-6 lg:px-8 py-6 justify-around">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
					{/* Developer Info */}
					<div className="lg:col-span-1 text-center lg:text-left">
						<div className="flex items-center gap-2 justify-center lg:justify-start mb-4">
							<Code size={24} className="text-orange-400" />
							<h3 className="text-xl font-bold text-orange-400">
								MEET THE DEVELOPER
							</h3>
						</div>
						<h4 className="text-2xl font-semibold text-white mb-2 text-center">
							Tayon Williams
						</h4>
						<div className="flex items-center gap-2 justify-center lg:justify-center text-slate-300 ">
							<Mail size={16} />
							<a
								href="mailto:tayondw@gmail.com"
								className="hover:text-orange-400 transition-colors duration-200"
							>
								tayondw@gmail.com
							</a>
						</div>
						<p className="text-slate-400 text-sm mt-2 text-center">
							Full Stack Software Engineer
						</p>
					</div>

					{/* Developer Photo */}
					<div className="lg:col-span-1 flex justify-center">
						<div className="relative group">
							<div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
							<img
								src="https://mencrytoo.s3.amazonaws.com/Proffesional-headshot-1.jpg"
								alt="Tayon Williams - Professional Headshot"
								className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-slate-700 group-hover:border-orange-400 transition-all duration-300 shadow-xl"
							/>
							<div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						</div>
					</div>

					{/* Social Links */}
					<div className="lg:col-span-1">
						<h4 className="text-lg font-semibold items-center lg:text-center text-slate-200">
							Connect With Me
						</h4>
						<div className="grid grid-cols-2 gap-4 justify-self-center">
							{socialLinks.map((link) => {
								const IconComponent = link.icon;
								return (
									<div key={link.name} className="group">
										{link.download ? (
											<a
												href={link.href}
												download="Williams-Tayon-SWE.pdf"
												className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 ${link.color} group-hover:transform group-hover:scale-105`}
												title={link.description}
											>
												<IconComponent size={20} />
												<span className="font-medium">{link.name}</span>
												<ExternalLink
													size={14}
													className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
												/>
											</a>
										) : (
											<Link
												to={link.href}
												target="_blank"
												rel="noopener noreferrer"
												className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 ${link.color} group-hover:transform group-hover:scale-105`}
												title={link.description}
											>
												<IconComponent size={20} />
												<span className="font-medium">{link.name}</span>
												<ExternalLink
													size={14}
													className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
												/>
											</Link>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Project Info */}
					<div className="lg:col-span-1 text-center lg:text-center">
						<h4 className="text-lg font-semibold mb-4 text-slate-200">
							About This Project
						</h4>
						<div className="space-y-3 justify-self-center">
							<div className="flex items-center gap-2 justify-center lg:justify-start text-slate-300">
								<Heart size={16} className="text-red-400" />
								<span className="text-sm">
									Built with passion for mental health
								</span>
							</div>
							<div className="flex items-center gap-2 justify-center lg:justify-start text-slate-300">
								<Code size={16} className="text-blue-400" />
								<span className="text-sm">
									React • JavaScript • TypeScript • Tailwind • Python
								</span>
							</div>
							<div className="flex items-center gap-2 justify-center lg:justify-start text-slate-300">
								<User size={16} className="text-green-400" />
								<span className="text-sm">
									Supporting men's mental wellness
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Bar */}
			<div className="border-t border-slate-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						{/* Copyright */}
						<div className="flex items-center gap-2 text-slate-400">
							<span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
								MEN CRY TOO
							</span>
							<span className="text-sm">
								© {currentYear} All rights reserved
							</span>
						</div>

						{/* Mission Statement */}
						<div className="text-center md:text-right">
							<p className="text-slate-400 text-sm italic">
								"It's okay to cry" - Breaking stigma, building community
							</p>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
